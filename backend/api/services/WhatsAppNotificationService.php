<?php

class WhatsAppNotificationService {

    /**
     * Get WhatsApp notification settings from site_settings
     */
    public static function getSettings($pdo) {
        $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('callmebot_phone', 'callmebot_api_key', 'whatsapp', 'notify_on_lead_whatsapp', 'notify_on_lead_push')");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        return [
            'phone' => !empty($settings['callmebot_phone']) ? $settings['callmebot_phone'] : ($settings['whatsapp'] ?? '5521969493569'),
            'api_key' => $settings['callmebot_api_key'] ?? '',
            'notify_whatsapp' => ($settings['notify_on_lead_whatsapp'] ?? '1') === '1',
            'notify_push' => ($settings['notify_on_lead_push'] ?? '1') === '1'
        ];
    }

    /**
     * Send raw message via CallMeBot
     */
    public static function sendMessage($phone, $apiKey, $message) {
        $cleanPhone = preg_replace('/\D/', '', $phone);
        if (empty($cleanPhone) || empty($apiKey)) {
            return [
                'success' => false,
                'message' => 'Telefone ou Chave de API do CallMeBot não configurados'
            ];
        }

        // Add 55 DDI if missing
        if (strlen($cleanPhone) <= 11 && substr($cleanPhone, 0, 2) !== '55') {
            $cleanPhone = '55' . $cleanPhone;
        }

        $encodedText = urlencode($message);
        $url = "https://api.callmebot.com/whatsapp.php?phone={$cleanPhone}&text={$encodedText}&apikey={$apiKey}";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $isSuccess = ($httpCode >= 200 && $httpCode < 300) && (stripos($response, 'Message queued') !== false || stripos($response, 'success') !== false || empty($curlError));

        return [
            'success' => $isSuccess,
            'http_code' => $httpCode,
            'response' => $response,
            'error' => $curlError
        ];
    }

    /**
     * Format and send lead alert to admin WhatsApp
     */
    public static function sendLeadAlert($pdo, $leadData) {
        $cfg = self::getSettings($pdo);
        if (!$cfg['notify_whatsapp'] || empty($cfg['api_key'])) {
            return ['success' => false, 'message' => 'Notificação por WhatsApp desativada ou sem API Key'];
        }

        $name = $leadData['guest_name'] ?? $leadData['name'] ?? 'Visitante';
        $phone = $leadData['guest_phone'] ?? $leadData['phone'] ?? $leadData['whatsapp'] ?? 'Não informado';
        $cleanGuestPhone = preg_replace('/\D/', '', $phone);
        if (strlen($cleanGuestPhone) <= 11 && substr($cleanGuestPhone, 0, 2) !== '55') {
            $cleanGuestPhone = '55' . $cleanGuestPhone;
        }
        $guestWaLink = !empty($cleanGuestPhone) ? "https://wa.me/{$cleanGuestPhone}" : '';

        $accommodation = $leadData['accommodation_name'] ?? 'Hospedagem Geral';
        $checkIn = !empty($leadData['check_in']) ? date('d/m/Y', strtotime($leadData['check_in'])) : (!empty($leadData['checkin_date']) ? date('d/m/Y', strtotime($leadData['checkin_date'])) : 'A combinar');
        $checkOut = !empty($leadData['check_out']) ? date('d/m/Y', strtotime($leadData['check_out'])) : (!empty($leadData['checkout_date']) ? date('d/m/Y', strtotime($leadData['checkout_date'])) : 'A combinar');
        $guests = $leadData['adults_count'] ?? $leadData['guests'] ?? 2;
        $pets = !empty($leadData['has_pets']) ? 'Sim 🐾' : 'Não';
        $total = !empty($leadData['total_price']) ? 'R$ ' . number_format($leadData['total_price'], 2, ',', '.') : (!empty($leadData['estimated_total']) ? 'R$ ' . number_format($leadData['estimated_total'], 2, ',', '.') : 'A calcular');
        $source = $leadData['source'] ?? 'Site da Pousada';
        $notes = $leadData['notes'] ?? '';

        $msg = "🔔 *NOVO LEAD CAPTADO!* 🏝️\n"
             . "*Pousada Monte Alto - Arraial do Cabo*\n\n"
             . "👤 *Hóspede:* {$name}\n"
             . "📱 *WhatsApp:* {$phone}\n"
             . "🛏️ *Acomodação:* {$accommodation}\n"
             . "📅 *Período:* {$checkIn} até {$checkOut}\n"
             . "👥 *Pessoas:* {$guests} | *Pets:* {$pets}\n"
             . "💰 *Valor Previsto:* {$total}\n"
             . "🤖 *Origem:* {$source}\n";

        if (!empty($notes)) {
            $msg .= "💬 *Obs:* " . substr($notes, 0, 150) . "\n";
        }

        if (!empty($guestWaLink)) {
            $msg .= "\n👉 *Falar agora com o hóspede:* {$guestWaLink}";
        }

        return self::sendMessage($cfg['phone'], $cfg['api_key'], $msg);
    }
}