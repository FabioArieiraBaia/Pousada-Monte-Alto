<?php
// backend/api/controllers/SettingsController.php

class SettingsController {

    public static function getSettings($pdo) {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM site_settings");
        $rows = $stmt->fetchAll();
        
        $settings = [];
        foreach ($rows as $r) {
            $settings[$r['setting_key']] = $r['setting_value'];
        }
        
        echo json_encode(['success' => true, 'data' => $settings]);
    }

    public static function updateSettings($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $stmt = $pdo->prepare("INSERT OR REPLACE INTO site_settings (setting_key, setting_value) VALUES (?, ?)");
        
        foreach ($data as $key => $val) {
            $stmt->execute([$key, is_array($val) ? json_encode($val) : strval($val)]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Configurações atualizadas com sucesso']);
    }
}
