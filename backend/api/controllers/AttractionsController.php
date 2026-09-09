<?php
// backend/api/controllers/AttractionsController.php

class AttractionsController {

    public static function getAll($pdo) {
        $includeInactive = isset($_GET['all']) && $_GET['all'] == '1';
        $sql = $includeInactive 
            ? "SELECT * FROM tourist_attractions ORDER BY order_index ASC, id ASC"
            : "SELECT * FROM tourist_attractions WHERE is_active = 1 ORDER BY order_index ASC, id ASC";
            
        $stmt = $pdo->query($sql);
        $items = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $items]);
    }

    public static function getBySlug($pdo, $slug) {
        $stmt = $pdo->prepare("SELECT * FROM tourist_attractions WHERE slug = ? OR id = ? LIMIT 1");
        $stmt->execute([$slug, $slug]);
        $item = $stmt->fetch();

        if (!$item) {
            http_response_code(404);
            echo json_encode(['error' => 'Atrativo/Praia não encontrado']);
            return;
        }

        echo json_encode(['success' => true, 'data' => $item]);
    }

    public static function create($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $namePt = trim($data['name_pt'] ?? '');
        if (empty($namePt)) {
            http_response_code(400);
            echo json_encode(['error' => 'O nome da praia/atrativo em português é obrigatório']);
            return;
        }

        $slug = trim($data['slug'] ?? '');
        if (empty($slug)) {
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT', $namePt)), '-'));
        }

        // Ensure unique slug
        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM tourist_attractions WHERE slug = ?");
        $stmtCheck->execute([$slug]);
        if ($stmtCheck->fetchColumn() > 0) {
            $slug .= '-' . uniqid();
        }

        $imageUrl = trim($data['image_url'] ?? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80');

        $stmt = $pdo->prepare("INSERT INTO tourist_attractions (
            slug, name_pt, name_en, name_es,
            distance_label_pt, distance_label_en, distance_label_es,
            duration_badge_pt, duration_badge_en, duration_badge_es,
            description_pt, description_en, description_es,
            tips_pt, tips_en, tips_es,
            image_url, youtube_video_url, maps_url,
            order_index, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $slug,
            $namePt,
            trim($data['name_en'] ?? $namePt),
            trim($data['name_es'] ?? $namePt),
            trim($data['distance_label_pt'] ?? ''),
            trim($data['distance_label_en'] ?? ''),
            trim($data['distance_label_es'] ?? ''),
            trim($data['duration_badge_pt'] ?? ''),
            trim($data['duration_badge_en'] ?? ''),
            trim($data['duration_badge_es'] ?? ''),
            trim($data['description_pt'] ?? ''),
            trim($data['description_en'] ?? ''),
            trim($data['description_es'] ?? ''),
            trim($data['tips_pt'] ?? ''),
            trim($data['tips_en'] ?? ''),
            trim($data['tips_es'] ?? ''),
            $imageUrl,
            trim($data['youtube_video_url'] ?? ''),
            trim($data['maps_url'] ?? ''),
            intval($data['order_index'] ?? 0),
            isset($data['is_active']) ? intval($data['is_active']) : 1
        ]);

        echo json_encode([
            'success' => true,
            'id' => $pdo->lastInsertId(),
            'slug' => $slug,
            'message' => 'Praia/Atrativo cadastrado com sucesso'
        ]);
    }

    public static function update($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $namePt = trim($data['name_pt'] ?? '');
        if (empty($namePt)) {
            http_response_code(400);
            echo json_encode(['error' => 'O nome da praia/atrativo em português é obrigatório']);
            return;
        }

        $stmt = $pdo->prepare("UPDATE tourist_attractions SET 
            name_pt = ?, name_en = ?, name_es = ?,
            distance_label_pt = ?, distance_label_en = ?, distance_label_es = ?,
            duration_badge_pt = ?, duration_badge_en = ?, duration_badge_es = ?,
            description_pt = ?, description_en = ?, description_es = ?,
            tips_pt = ?, tips_en = ?, tips_es = ?,
            image_url = ?, youtube_video_url = ?, maps_url = ?,
            order_index = ?, is_active = ?
            WHERE id = ?");

        $stmt->execute([
            $namePt,
            trim($data['name_en'] ?? $namePt),
            trim($data['name_es'] ?? $namePt),
            trim($data['distance_label_pt'] ?? ''),
            trim($data['distance_label_en'] ?? ''),
            trim($data['distance_label_es'] ?? ''),
            trim($data['duration_badge_pt'] ?? ''),
            trim($data['duration_badge_en'] ?? ''),
            trim($data['duration_badge_es'] ?? ''),
            trim($data['description_pt'] ?? ''),
            trim($data['description_en'] ?? ''),
            trim($data['description_es'] ?? ''),
            trim($data['tips_pt'] ?? ''),
            trim($data['tips_en'] ?? ''),
            trim($data['tips_es'] ?? ''),
            trim($data['image_url'] ?? ''),
            trim($data['youtube_video_url'] ?? ''),
            trim($data['maps_url'] ?? ''),
            intval($data['order_index'] ?? 0),
            isset($data['is_active']) ? intval($data['is_active']) : 1,
            $id
        ]);

        echo json_encode(['success' => true, 'message' => 'Praia/Atrativo atualizado com sucesso']);
    }

    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $stmt = $pdo->prepare("DELETE FROM tourist_attractions WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Praia/Atrativo excluído com sucesso']);
    }
}
