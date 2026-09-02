<?php
// backend/api/controllers/BlogController.php

class BlogController {

    public static function getAll($pdo, $publicOnly = true) {
        $sql = "SELECT id, slug, title_pt, title_en, title_es, excerpt_pt, excerpt_en, excerpt_es, featured_image, youtube_video_url, tags, is_published, published_at FROM blog_posts";
        if ($publicOnly) {
            $sql .= " WHERE is_published = 1";
        }
        $sql .= " ORDER BY published_at DESC";
        
        $stmt = $pdo->query($sql);
        $posts = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $posts]);
    }

    public static function getBySlug($pdo, $slug) {
        $stmt = $pdo->prepare("SELECT * FROM blog_posts WHERE slug = ?");
        $stmt->execute([$slug]);
        $post = $stmt->fetch();
        
        if (!$post) {
            http_response_code(404);
            echo json_encode(['error' => 'Artigo não encontrado']);
            return;
        }
        
        echo json_encode(['success' => true, 'data' => $post]);
    }

    public static function create($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $slug = trim($data['slug'] ?? '');
        if (empty($slug)) {
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['title_pt'] ?? 'artigo-' . time())));
        }
        
        $stmt = $pdo->prepare("INSERT INTO blog_posts 
            (slug, title_pt, title_en, title_es, excerpt_pt, excerpt_en, excerpt_es, content_pt, content_en, content_es, featured_image, youtube_video_url, tags, is_published) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
        $stmt->execute([
            $slug,
            $data['title_pt'] ?? 'Novo Artigo',
            $data['title_en'] ?? $data['title_pt'] ?? 'New Article',
            $data['title_es'] ?? $data['title_pt'] ?? 'Nuevo Artículo',
            $data['excerpt_pt'] ?? '',
            $data['excerpt_en'] ?? '',
            $data['excerpt_es'] ?? '',
            $data['content_pt'] ?? '',
            $data['content_en'] ?? '',
            $data['content_es'] ?? '',
            $data['featured_image'] ?? '',
            $data['youtube_video_url'] ?? '',
            $data['tags'] ?? '',
            isset($data['is_published']) ? intval($data['is_published']) : 1
        ]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Artigo publicado com sucesso']);
    }

    public static function update($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $stmt = $pdo->prepare("UPDATE blog_posts SET 
            title_pt = ?, title_en = ?, title_es = ?,
            excerpt_pt = ?, excerpt_en = ?, excerpt_es = ?,
            content_pt = ?, content_en = ?, content_es = ?,
            featured_image = ?, youtube_video_url = ?, tags = ?,
            is_published = ?
            WHERE id = ?");
            
        $stmt->execute([
            $data['title_pt'],
            $data['title_en'] ?? $data['title_pt'],
            $data['name_es'] ?? $data['title_pt'],
            $data['excerpt_pt'] ?? '',
            $data['excerpt_en'] ?? '',
            $data['excerpt_es'] ?? '',
            $data['content_pt'] ?? '',
            $data['content_en'] ?? '',
            $data['content_es'] ?? '',
            $data['featured_image'] ?? '',
            $data['youtube_video_url'] ?? '',
            $data['tags'] ?? '',
            isset($data['is_published']) ? intval($data['is_published']) : 1,
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Artigo atualizado com sucesso']);
    }

    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $pdo->prepare("DELETE FROM blog_posts WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Artigo excluído com sucesso']);
    }
}
