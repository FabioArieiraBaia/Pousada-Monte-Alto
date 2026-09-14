<?php

class WebPushService {
    private const DER_PREFIX = "3059301306072a8648ce3d020106082a8648ce3d030107034200";

    public static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    public static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Get or auto-generate VAPID keys from site_settings
     */
    public static function getVapidKeys($pdo) {
        $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('vapid_public_key', 'vapid_private_key')");
        $stmt->execute();
        $keys = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        if (!empty($keys['vapid_public_key']) && !empty($keys['vapid_private_key'])) {
            return [
                'publicKey' => $keys['vapid_public_key'],
                'privateKeyPem' => $keys['vapid_private_key']
            ];
        }

        // Generate new EC prime256v1 key pair
        $res = openssl_pkey_new([
            'curve_name' => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
        ]);
        openssl_pkey_export($res, $privKeyPem);
        $details = openssl_pkey_get_details($res);
        $pubRaw = "\x04" . $details['ec']['x'] . $details['ec']['y'];
        $pubKeyBase64 = self::base64UrlEncode($pubRaw);

        // Store into site_settings
        $stmtSave = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value");
        $stmtSave->execute(['vapid_public_key', $pubKeyBase64]);
        $stmtSave->execute(['vapid_private_key', $privKeyPem]);

        return [
            'publicKey' => $pubKeyBase64,
            'privateKeyPem' => $privKeyPem
        ];
    }

    /**
     * Get public VAPID key for frontend registration
     */
    public static function getPublicKey($pdo) {
        $keys = self::getVapidKeys($pdo);
        return $keys['publicKey'];
    }

    /**
     * Register or update client subscription
     */
    public static function saveSubscription($pdo, $data, $userId = null) {
        $endpoint = $data['endpoint'] ?? '';
        $keys = $data['keys'] ?? [];
        $p256dh = $keys['p256dh'] ?? '';
        $auth = $keys['auth'] ?? '';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

        if (empty($endpoint) || empty($p256dh) || empty($auth)) {
            return false;
        }

        $stmt = $pdo->prepare("
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, last_used_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(endpoint) DO UPDATE SET
                p256dh = excluded.p256dh,
                auth = excluded.auth,
                user_agent = excluded.user_agent,
                last_used_at = CURRENT_TIMESTAMP
        ");
        return $stmt->execute([$userId, $endpoint, $p256dh, $auth, $userAgent]);
    }

    /**
     * Remove client subscription
     */
    public static function removeSubscription($pdo, $endpoint) {
        $stmt = $pdo->prepare("DELETE FROM push_subscriptions WHERE endpoint = ?");
        return $stmt->execute([$endpoint]);
    }

    /**
     * Send Web Push notification to all registered admin devices
     */
    public static function sendNotificationToAll($pdo, $title, $body, $url = '/admin/reservas', $extraData = []) {
        $stmt = $pdo->query("SELECT * FROM push_subscriptions ORDER BY last_used_at DESC");
        $subscriptions = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

        if (empty($subscriptions)) {
            return ['sent' => 0, 'failed' => 0, 'total' => 0, 'message' => 'Nenhum dispositivo cadastrado'];
        }

        $vapid = self::getVapidKeys($pdo);
        $payload = json_encode(array_merge([
            'title' => $title,
            'body' => $body,
            'url' => $url,
            'timestamp' => time() * 1000
        ], $extraData), JSON_UNESCAPED_UNICODE);

        $sentCount = 0;
        $failCount = 0;

        foreach ($subscriptions as $sub) {
            $result = self::sendSinglePush($vapid, $sub, $payload);
            if ($result['success']) {
                $sentCount++;
                $pdo->prepare("UPDATE push_subscriptions SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$sub['id']]);
            } else {
                $failCount++;
                // If subscription expired or revoked (404/410), clean it up
                if (in_array($result['status_code'], [404, 410])) {
                    $pdo->prepare("DELETE FROM push_subscriptions WHERE id = ?")->execute([$sub['id']]);
                }
            }
        }

        return [
            'sent' => $sentCount,
            'failed' => $failCount,
            'total' => count($subscriptions)
        ];
    }

    /**
     * Send a single push message to one subscription
     */
    private static function sendSinglePush($vapid, $sub, $payload) {
        $endpoint = $sub['endpoint'];
        $p256dh = self::base64UrlDecode($sub['p256dh']);
        $auth = self::base64UrlDecode($sub['auth']);

        if (strlen($p256dh) !== 65 || empty($auth)) {
            return ['success' => false, 'status_code' => 400, 'error' => 'Invalid client keys'];
        }

        // Parse endpoint origin
        $urlParts = parse_url($endpoint);
        $origin = ($urlParts['scheme'] ?? 'https') . '://' . ($urlParts['host'] ?? '');

        // 1. Generate VAPID JWT
        $jwt = self::createVapidJwt($origin, $vapid['privateKeyPem']);
        if (!$jwt) {
            return ['success' => false, 'status_code' => 500, 'error' => 'Failed to create VAPID JWT'];
        }

        // 2. Encrypt payload via RFC 8291 (aes128gcm)
        $encryptedBody = self::encryptPayload($payload, $p256dh, $auth);
        if (!$encryptedBody) {
            return ['success' => false, 'status_code' => 500, 'error' => 'Payload encryption failed'];
        }

        // 3. Dispatch HTTP POST request to push service
        $headers = [
            'Content-Type: application/octet-stream',
            'Content-Encoding: aes128gcm',
            'TTL: 86400',
            'Urgency: high',
            'Authorization: vapid t=' . $jwt . ', k=' . $vapid['publicKey']
        ];

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $encryptedBody);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $isSuccess = ($httpCode >= 200 && $httpCode < 300);
        return [
            'success' => $isSuccess,
            'status_code' => $httpCode,
            'response' => $response,
            'error' => $curlError
        ];
    }

    /**
     * Create RFC 8292 VAPID JWT
     */
    private static function createVapidJwt($aud, $privKeyPem) {
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
        $payload = self::base64UrlEncode(json_encode([
            'aud' => $aud,
            'exp' => time() + 86400,
            'sub' => 'mailto:contato@pousadamontealto.com.br'
        ]));

        $dataToSign = $header . '.' . $payload;
        $privKey = openssl_pkey_get_private($privKeyPem);
        if (!$privKey) return null;

        if (!openssl_sign($dataToSign, $derSignature, $privKey, OPENSSL_ALGO_SHA256)) {
            return null;
        }

        $rawSig = self::derToRawSignature($derSignature);
        return $dataToSign . '.' . self::base64UrlEncode($rawSig);
    }

    /**
     * Convert DER ECDSA signature to IEEE P1363 (64 bytes: 32 R + 32 S)
     */
    private static function derToRawSignature($der) {
        $pos = 2;
        if (ord($der[1]) & 0x80) {
            $pos += (ord($der[1]) & 0x7f);
        }
        $pos += 1;
        $lenR = ord($der[$pos++]);
        $R = substr($der, $pos, $lenR);
        $pos += $lenR;
        $pos += 1;
        $lenS = ord($der[$pos++]);
        $S = substr($der, $pos, $lenS);

        $R = ltrim($R, "\x00");
        $S = ltrim($S, "\x00");
        $R = str_pad($R, 32, "\x00", STR_PAD_LEFT);
        $S = str_pad($S, 32, "\x00", STR_PAD_LEFT);

        return $R . $S;
    }

    /**
     * Encrypt message with RFC 8291 (aes128gcm)
     */
    private static function encryptPayload($plaintext, $clientPubRaw, $authSecret) {
        $serverKey = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
        if (!$serverKey) return null;

        $serverDetails = openssl_pkey_get_details($serverKey);
        $serverPubRaw = "\x04" . $serverDetails['ec']['x'] . $serverDetails['ec']['y'];

        $clientPubPem = "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode(hex2bin(self::DER_PREFIX) . $clientPubRaw), 64, "\n") . "-----END PUBLIC KEY-----\n";

        $ecdhSecret = openssl_pkey_derive($clientPubPem, $serverKey);
        if (!$ecdhSecret) return null;

        $keyInfo = "WebPush: info\0" . $clientPubRaw . $serverPubRaw;
        $ikmPrk = hash_hkdf('sha256', $ecdhSecret, 32, '', $authSecret);
        $ikm = hash_hkdf('sha256', $ikmPrk, 32, $keyInfo, '');

        $salt = random_bytes(16);
        $prk = hash_hkdf('sha256', $ikm, 32, '', $salt);

        $cekInfo = "Content-Encoding: aes128gcm\0";
        $cek = hash_hkdf('sha256', $prk, 16, $cekInfo, '');

        $nonceInfo = "Content-Encoding: nonce\0";
        $nonce = hash_hkdf('sha256', $prk, 12, $nonceInfo, '');

        $record = $plaintext . "\x02";
        $ciphertext = openssl_encrypt($record, 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag);
        if ($ciphertext === false) return null;

        $rs = pack('N', 4096);
        $idlen = chr(strlen($serverPubRaw));
        $header = $salt . $rs . $idlen . $serverPubRaw;

        return $header . $ciphertext . $tag;
    }
}