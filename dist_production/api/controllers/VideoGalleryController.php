<?php
// backend/api/controllers/VideoGalleryController.php

class VideoGalleryController {

    public static function getAll($pdo) {
        $stmt = $pdo->query("SELECT * FROM video_gallery_items ORDER BY order_index ASC, id DESC");
        $items = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $items]);
    }

    public static function create($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $title = trim($data['title'] ?? '');
        $videoUrl = trim($data['video_url'] ?? '');
        $category = trim($data['category'] ?? 'geral');
        $coverUrl = trim($data['cover_url'] ?? '');
        $orderIndex = intval($data['order_index'] ?? 0);

        if (empty($videoUrl)) {
            http_response_code(400);
            echo json_encode(['error' => 'A URL do vídeo (YouTube ou Instagram) é obrigatória']);
            return;
        }

        if (empty($title)) {
            $title = 'Vídeo Pousada Monte Alto';
        }

        // Auto-detect video type if not supplied
        $videoType = trim($data['video_type'] ?? '');
        if (empty($videoType)) {
            if (stripos($videoUrl, 'instagram.com') !== false) {
                $videoType = (stripos($videoUrl, '/reel') !== false) ? 'reels' : 'instagram';
            } elseif (stripos($videoUrl, '/shorts/') !== false) {
                $videoType = 'shorts';
            } else {
                $videoType = 'youtube';
            }
        }

        $stmt = $pdo->prepare("INSERT INTO video_gallery_items (title, video_url, video_type, category, cover_url, order_index) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $videoUrl, $videoType, $category, $coverUrl, $orderIndex]);

        echo json_encode([
            'success' => true,
            'id' => $pdo->lastInsertId(),
            'message' => 'Vídeo adicionado à galeria com sucesso'
        ]);
    }

    public static function update($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $title = trim($data['title'] ?? '');
        $videoUrl = trim($data['video_url'] ?? '');
        $category = trim($data['category'] ?? 'geral');
        $coverUrl = trim($data['cover_url'] ?? '');
        $orderIndex = intval($data['order_index'] ?? 0);

        if (empty($videoUrl)) {
            http_response_code(400);
            echo json_encode(['error' => 'A URL do vídeo é obrigatória']);
            return;
        }

        if (empty($title)) {
            $title = 'Vídeo Pousada Monte Alto';
        }

        $videoType = trim($data['video_type'] ?? '');
        if (empty($videoType)) {
            if (stripos($videoUrl, 'instagram.com') !== false) {
                $videoType = (stripos($videoUrl, '/reel') !== false) ? 'reels' : 'instagram';
            } elseif (stripos($videoUrl, '/shorts/') !== false) {
                $videoType = 'shorts';
            } else {
                $videoType = 'youtube';
            }
        }

        $stmt = $pdo->prepare("UPDATE video_gallery_items SET title = ?, video_url = ?, video_type = ?, category = ?, cover_url = ?, order_index = ? WHERE id = ?");
        $stmt->execute([$title, $videoUrl, $videoType, $category, $coverUrl, $orderIndex, $id]);

        echo json_encode(['success' => true, 'message' => 'Vídeo atualizado com sucesso']);
    }

    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $stmt = $pdo->prepare("DELETE FROM video_gallery_items WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Vídeo removido da galeria com sucesso']);
    }
}
