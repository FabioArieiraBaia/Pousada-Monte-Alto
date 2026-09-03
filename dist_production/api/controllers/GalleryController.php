<?php
// backend/api/controllers/GalleryController.php

class GalleryController {

    public static function getAll($pdo) {
        $stmt = $pdo->query("SELECT * FROM gallery_items ORDER BY order_index ASC, id DESC");
        $items = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $items]);
    }

    public static function create($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $title = trim($data['title'] ?? '');
        $imageUrl = trim($data['image_url'] ?? '');
        $category = trim($data['category'] ?? 'geral');
        $orderIndex = intval($data['order_index'] ?? 0);

        if (empty($imageUrl)) {
            http_response_code(400);
            echo json_encode(['error' => 'A URL ou arquivo da foto é obrigatório']);
            return;
        }

        if (empty($title)) {
            $title = 'Espaço da Pousada';
        }

        $stmt = $pdo->prepare("INSERT INTO gallery_items (title, image_url, category, order_index) VALUES (?, ?, ?, ?)");
        $stmt->execute([$title, $imageUrl, $category, $orderIndex]);

        echo json_encode([
            'success' => true,
            'id' => $pdo->lastInsertId(),
            'message' => 'Foto adicionada à galeria com sucesso'
        ]);
    }

    public static function update($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $title = trim($data['title'] ?? '');
        $imageUrl = trim($data['image_url'] ?? '');
        $category = trim($data['category'] ?? 'geral');
        $orderIndex = intval($data['order_index'] ?? 0);

        $stmt = $pdo->prepare("UPDATE gallery_items SET title = ?, image_url = ?, category = ?, order_index = ? WHERE id = ?");
        $stmt->execute([$title, $imageUrl, $category, $orderIndex, $id]);

        echo json_encode(['success' => true, 'message' => 'Foto da galeria atualizada']);
    }

    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $stmt = $pdo->prepare("DELETE FROM gallery_items WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Foto removida da galeria com sucesso']);
    }
}
