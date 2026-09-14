<?php

require_once __DIR__ . '/WebPushService.php';
require_once __DIR__ . '/WhatsAppNotificationService.php';

class NotificationService {

    /**
     * Centralized method to trigger all active notification channels for a new lead/reservation
     */
    public static function notifyNewLead($pdo, $leadData) {
        $results = [
            'push' => null,
            'whatsapp' => null
        ];

        $name = $leadData['guest_name'] ?? $leadData['name'] ?? 'Visitante';
        $accName = $leadData['accommodation_name'] ?? 'Hospedagem';
        $source = $leadData['source'] ?? 'Site';

        // 1. Web Push Notification (Android / iPhone / Desktop)
        try {
            $stmtPush = $pdo->query("SELECT setting_value FROM site_settings WHERE setting_key = 'notify_on_lead_push'");
            $pushEnabled = ($stmtPush ? $stmtPush->fetchColumn() : '1') !== '0';

            if ($pushEnabled) {
                $title = "🔔 Novo Lead: {$name}!";
                $body = "{$accName} • Captado via {$source}\nToque para abrir a solicitação.";
                $url = "/admin/reservas";

                $results['push'] = WebPushService::sendNotificationToAll($pdo, $title, $body, $url, [
                    'lead_name' => $name,
                    'accommodation' => $accName,
                    'source' => $source
                ]);
            }
        } catch (Exception $e) {
            $results['push'] = ['error' => $e->getMessage()];
        }

        // 2. WhatsApp Notification via CallMeBot
        try {
            $results['whatsapp'] = WhatsAppNotificationService::sendLeadAlert($pdo, $leadData);
        } catch (Exception $e) {
            $results['whatsapp'] = ['error' => $e->getMessage()];
        }

        return $results;
    }
}