<?php

require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../services/WebPushService.php';
require_once __DIR__ . '/../services/WhatsAppNotificationService.php';
require_once __DIR__ . '/../services/NotificationService.php';

class NotificationController {

    /**
     * GET /api/push/vapid-public-key
     */
    public static function getVapidPublicKey($pdo) {
        $key = WebPushService::getPublicKey($pdo);
        echo json_encode([
            'success' => true,
            'publicKey' => $key
        ]);
    }

    /**
     * POST /api/push/subscribe
     */
    public static function subscribe($pdo) {
        $user = requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($data['endpoint'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados de inscrição inválidos']);
            return;
        }

        $saved = WebPushService::saveSubscription($pdo, $data, $user['id'] ?? null);
        echo json_encode([
            'success' => $saved,
            'message' => $saved ? 'Dispositivo conectado com sucesso para notificações push!' : 'Falha ao registrar dispositivo'
        ]);
    }

    /**
     * POST /api/push/unsubscribe
     */
    public static function unsubscribe($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $endpoint = $data['endpoint'] ?? '';

        if (!empty($endpoint)) {
            WebPushService::removeSubscription($pdo, $endpoint);
        }

        echo json_encode(['success' => true, 'message' => 'Dispositivo desconectado de notificações']);
    }

    /**
     * GET /api/notifications/settings
     */
    public static function getSettings($pdo) {
        requireAuth($pdo);

        $stmt = $pdo->prepare("
            SELECT setting_key, setting_value FROM site_settings 
            WHERE setting_key IN ('callmebot_phone', 'callmebot_api_key', 'whatsapp', 'notify_on_lead_whatsapp', 'notify_on_lead_push')
        ");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $stmtSubs = $pdo->query("SELECT COUNT(*) FROM push_subscriptions");
        $deviceCount = $stmtSubs ? (int)$stmtSubs->fetchColumn() : 0;

        $stmtDevices = $pdo->query("SELECT id, user_agent, created_at, last_used_at FROM push_subscriptions ORDER BY last_used_at DESC LIMIT 10");
        $devices = $stmtDevices ? $stmtDevices->fetchAll(PDO::FETCH_ASSOC) : [];

        echo json_encode([
            'success' => true,
            'data' => [
                'callmebot_phone' => !empty($settings['callmebot_phone']) ? $settings['callmebot_phone'] : ($settings['whatsapp'] ?? '5521969493569'),
                'callmebot_api_key' => $settings['callmebot_api_key'] ?? '',
                'notify_on_lead_whatsapp' => ($settings['notify_on_lead_whatsapp'] ?? '1') === '1',
                'notify_on_lead_push' => ($settings['notify_on_lead_push'] ?? '1') === '1',
                'device_count' => $deviceCount,
                'devices' => $devices,
                'vapid_public_key' => WebPushService::getPublicKey($pdo)
            ]
        ]);
    }

    /**
     * PUT /api/notifications/settings
     */
    public static function updateSettings($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $allowed = [
            'callmebot_phone',
            'callmebot_api_key',
            'notify_on_lead_whatsapp',
            'notify_on_lead_push'
        ];

        $stmt = $pdo->prepare("
            INSERT INTO site_settings (setting_key, setting_value) 
            VALUES (?, ?) 
            ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value
        ");

        foreach ($allowed as $key) {
            if (isset($data[$key])) {
                $val = is_bool($data[$key]) ? ($data[$key] ? '1' : '0') : (string)$data[$key];
                $stmt->execute([$key, $val]);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Configurações de notificação salvas com sucesso!']);
    }

    /**
     * POST /api/notifications/test-push
     */
    public static function testPush($pdo) {
        requireAuth($pdo);

        $title = "🔔 Teste de Notificação: Pousada Monte Alto!";
        $body = "Seu dispositivo está configurado e vibrando com os alertas hoteleiros.";
        $url = "/admin/configuracoes";

        $res = WebPushService::sendNotificationToAll($pdo, $title, $body, $url, ['is_test' => true]);

        echo json_encode([
            'success' => ($res['sent'] ?? 0) > 0,
            'data' => $res,
            'message' => ($res['sent'] ?? 0) > 0 
                ? "Push enviado para {$res['sent']} dispositivo(s)! Verifique seu celular." 
                : ($res['total'] == 0 ? "Nenhum dispositivo cadastrado neste navegador. Clique primeiro em 'Ativar neste aparelho'." : "Falha ao enviar push.")
        ]);
    }

    /**
     * POST /api/notifications/test-whatsapp
     */
    public static function testWhatsApp($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $cfg = WhatsAppNotificationService::getSettings($pdo);
        $phone = !empty($data['phone']) ? $data['phone'] : $cfg['phone'];
        $apiKey = !empty($data['api_key']) ? $data['api_key'] : $cfg['api_key'];

        if (empty($apiKey)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Por favor, informe a Chave de API do CallMeBot antes de testar.'
            ]);
            return;
        }

        $msg = "✅ *Teste de Conexão WhatsApp — Pousada Monte Alto*\n\n"
             . "Tudo certo! As notificações de novos leads e reservas estão ativas e serão entregues neste número.\n"
             . "🕒 Data/Hora: " . date('d/m/Y H:i:s');

        $res = WhatsAppNotificationService::sendMessage($phone, $apiKey, $msg);

        echo json_encode([
            'success' => $res['success'],
            'data' => $res,
            'message' => $res['success'] 
                ? "Mensagem de teste enviada com sucesso! Verifique seu WhatsApp." 
                : "Não foi possível enviar a mensagem. Verifique se o telefone e a API Key estão corretos."
        ]);
    }
}