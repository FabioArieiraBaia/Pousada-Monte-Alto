<?php
// backend/api/controllers/ServicesController.php

require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ServicesController {

    /**
     * List all services (public or admin)
     */
    public static function getAll($pdo, $publicOnly = true) {
        $sql = "SELECT * FROM services";
        if ($publicOnly) {
            $sql .= " WHERE is_active = 1";
        }
        $sql .= " ORDER BY order_index ASC, id ASC";

        $stmt = $pdo->query($sql);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($services as &$s) {
            $s['included_items'] = json_decode($s['included_items_json'] ?? '[]', true) ?: [];
            $s['requirements'] = json_decode($s['requirements_json'] ?? '[]', true) ?: [];
            $s['gallery_photos'] = json_decode($s['gallery_photos_json'] ?? '[]', true) ?: [];
            $s['price_per_person'] = (float)$s['price_per_person'];
            $s['partner_cost'] = (float)$s['partner_cost'];
            $s['partner_commission_pct'] = (float)$s['partner_commission_pct'];
            $s['is_featured'] = (int)$s['is_featured'];
            $s['is_active'] = (int)$s['is_active'];
            $s['min_participants'] = (int)$s['min_participants'];
            $s['max_participants'] = (int)$s['max_participants'];
        }

        echo json_encode(['success' => true, 'data' => $services]);
    }

    /**
     * Get single service by slug (public)
     */
    public static function getBySlug($pdo, $slug) {
        $stmt = $pdo->prepare("SELECT * FROM services WHERE slug = ?");
        $stmt->execute([$slug]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$service) {
            http_response_code(404);
            echo json_encode(['error' => 'Serviço/Passeio não encontrado']);
            return;
        }

        $service['included_items'] = json_decode($service['included_items_json'] ?? '[]', true) ?: [];
        $service['requirements'] = json_decode($service['requirements_json'] ?? '[]', true) ?: [];
        $service['gallery_photos'] = json_decode($service['gallery_photos_json'] ?? '[]', true) ?: [];
        $service['price_per_person'] = (float)$service['price_per_person'];
        $service['partner_cost'] = (float)$service['partner_cost'];
        $service['partner_commission_pct'] = (float)$service['partner_commission_pct'];
        $service['is_featured'] = (int)$service['is_featured'];
        $service['is_active'] = (int)$service['is_active'];
        $service['min_participants'] = (int)$service['min_participants'];
        $service['max_participants'] = (int)$service['max_participants'];

        echo json_encode(['success' => true, 'data' => $service]);
    }

    /**
     * Get single service by ID (admin)
     */
    public static function getById($pdo, $id) {
        requireAuth($pdo);
        $stmt = $pdo->prepare("SELECT * FROM services WHERE id = ?");
        $stmt->execute([$id]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$service) {
            http_response_code(404);
            echo json_encode(['error' => 'Serviço/Passeio não encontrado']);
            return;
        }

        $service['included_items'] = json_decode($service['included_items_json'] ?? '[]', true) ?: [];
        $service['requirements'] = json_decode($service['requirements_json'] ?? '[]', true) ?: [];
        $service['gallery_photos'] = json_decode($service['gallery_photos_json'] ?? '[]', true) ?: [];
        $service['price_per_person'] = (float)$service['price_per_person'];
        $service['partner_cost'] = (float)$service['partner_cost'];
        $service['partner_commission_pct'] = (float)$service['partner_commission_pct'];
        $service['is_featured'] = (int)$service['is_featured'];
        $service['is_active'] = (int)$service['is_active'];

        echo json_encode(['success' => true, 'data' => $service]);
    }

    /**
     * Create a new service (admin)
     */
    public static function create($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $namePt = trim($data['name_pt'] ?? '');
        if (empty($namePt)) {
            http_response_code(400);
            echo json_encode(['error' => 'O nome do serviço em português é obrigatório']);
            return;
        }

        $slug = trim($data['slug'] ?? '');
        if (empty($slug)) {
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $namePt)));
            $check = $pdo->prepare("SELECT id FROM services WHERE slug = ?");
            $check->execute([$slug]);
            if ($check->fetch()) {
                $slug .= '-' . time();
            }
        }

        $price = floatval($data['price_per_person'] ?? 0);
        $commPct = floatval($data['partner_commission_pct'] ?? 20.0);
        $partnerCost = isset($data['partner_cost']) ? floatval($data['partner_cost']) : round($price * ((100 - $commPct) / 100), 2);

        $included = isset($data['included_items']) ? (is_array($data['included_items']) ? json_encode($data['included_items']) : $data['included_items']) : '[]';
        $requirements = isset($data['requirements']) ? (is_array($data['requirements']) ? json_encode($data['requirements']) : $data['requirements']) : '[]';
        $gallery = isset($data['gallery_photos']) ? (is_array($data['gallery_photos']) ? json_encode($data['gallery_photos']) : $data['gallery_photos']) : '[]';

        $stmt = $pdo->prepare("INSERT INTO services (
            slug, category, name_pt, name_en, name_es,
            tagline_pt, tagline_en, tagline_es,
            description_pt, description_en, description_es,
            duration_label, price_per_person, partner_name, partner_commission_pct, partner_cost,
            min_participants, max_participants, included_items_json, requirements_json,
            cover_photo, gallery_photos_json, youtube_video_url, instagram_video_url, facebook_video_url,
            is_featured, is_active, order_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $slug,
            $data['category'] ?? 'barco',
            $namePt,
            $data['name_en'] ?? $namePt,
            $data['name_es'] ?? $namePt,
            $data['tagline_pt'] ?? '',
            $data['tagline_en'] ?? '',
            $data['tagline_es'] ?? '',
            $data['description_pt'] ?? '',
            $data['description_en'] ?? '',
            $data['description_es'] ?? '',
            $data['duration_label'] ?? '3 horas',
            $price,
            $data['partner_name'] ?? '',
            $commPct,
            $partnerCost,
            intval($data['min_participants'] ?? 1),
            intval($data['max_participants'] ?? 12),
            $included,
            $requirements,
            $data['cover_photo'] ?? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
            $gallery,
            $data['youtube_video_url'] ?? '',
            $data['instagram_video_url'] ?? '',
            $data['facebook_video_url'] ?? '',
            !empty($data['is_featured']) ? 1 : 0,
            isset($data['is_active']) ? intval($data['is_active']) : 1,
            intval($data['order_index'] ?? 0)
        ]);

        $id = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Serviço cadastrado com sucesso!']);
    }

    /**
     * Update service (admin)
     */
    public static function update($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $stmtCheck = $pdo->prepare("SELECT * FROM services WHERE id = ?");
        $stmtCheck->execute([$id]);
        $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            http_response_code(404);
            echo json_encode(['error' => 'Serviço não encontrado']);
            return;
        }

        $namePt = trim($data['name_pt'] ?? $existing['name_pt']);
        $price = isset($data['price_per_person']) ? floatval($data['price_per_person']) : (float)$existing['price_per_person'];
        $commPct = isset($data['partner_commission_pct']) ? floatval($data['partner_commission_pct']) : (float)$existing['partner_commission_pct'];
        $partnerCost = isset($data['partner_cost']) ? floatval($data['partner_cost']) : (float)$existing['partner_cost'];

        $included = isset($data['included_items']) ? (is_array($data['included_items']) ? json_encode($data['included_items']) : $data['included_items']) : $existing['included_items_json'];
        $requirements = isset($data['requirements']) ? (is_array($data['requirements']) ? json_encode($data['requirements']) : $data['requirements']) : $existing['requirements_json'];
        $gallery = isset($data['gallery_photos']) ? (is_array($data['gallery_photos']) ? json_encode($data['gallery_photos']) : $data['gallery_photos']) : $existing['gallery_photos_json'];

        $stmt = $pdo->prepare("UPDATE services SET
            category = ?,
            name_pt = ?, name_en = ?, name_es = ?,
            tagline_pt = ?, tagline_en = ?, tagline_es = ?,
            description_pt = ?, description_en = ?, description_es = ?,
            duration_label = ?, price_per_person = ?, partner_name = ?, partner_commission_pct = ?, partner_cost = ?,
            min_participants = ?, max_participants = ?, included_items_json = ?, requirements_json = ?,
            cover_photo = ?, gallery_photos_json = ?, youtube_video_url = ?, instagram_video_url = ?, facebook_video_url = ?,
            is_featured = ?, is_active = ?, order_index = ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?");

        $stmt->execute([
            $data['category'] ?? $existing['category'],
            $namePt,
            $data['name_en'] ?? $namePt,
            $data['name_es'] ?? $namePt,
            $data['tagline_pt'] ?? $existing['tagline_pt'],
            $data['tagline_en'] ?? $existing['tagline_en'],
            $data['tagline_es'] ?? $existing['tagline_es'],
            $data['description_pt'] ?? $existing['description_pt'],
            $data['description_en'] ?? $existing['description_en'],
            $data['description_es'] ?? $existing['description_es'],
            $data['duration_label'] ?? $existing['duration_label'],
            $price,
            $data['partner_name'] ?? $existing['partner_name'],
            $commPct,
            $partnerCost,
            intval($data['min_participants'] ?? $existing['min_participants']),
            intval($data['max_participants'] ?? $existing['max_participants']),
            $included,
            $requirements,
            $data['cover_photo'] ?? $existing['cover_photo'],
            $gallery,
            $data['youtube_video_url'] ?? ($existing['youtube_video_url'] ?? ''),
            $data['instagram_video_url'] ?? ($existing['instagram_video_url'] ?? ''),
            $data['facebook_video_url'] ?? ($existing['facebook_video_url'] ?? ''),
            isset($data['is_featured']) ? intval($data['is_featured']) : $existing['is_featured'],
            isset($data['is_active']) ? intval($data['is_active']) : $existing['is_active'],
            intval($data['order_index'] ?? $existing['order_index']),
            $id
        ]);

        echo json_encode(['success' => true, 'message' => 'Serviço atualizado com sucesso!']);
    }

    /**
     * Toggle active status (admin)
     */
    public static function toggle($pdo, $id) {
        requireAuth($pdo);
        $stmt = $pdo->prepare("SELECT id, is_active, name_pt FROM services WHERE id = ?");
        $stmt->execute([$id]);
        $s = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$s) {
            http_response_code(404);
            echo json_encode(['error' => 'Serviço não encontrado']);
            return;
        }

        $newStatus = ((int)$s['is_active'] === 1) ? 0 : 1;
        $pdo->prepare("UPDATE services SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$newStatus, $id]);

        echo json_encode([
            'success' => true,
            'is_active' => $newStatus,
            'message' => $newStatus === 1 ? "Serviço \"{$s['name_pt']}\" ATIVADO!" : "Serviço \"{$s['name_pt']}\" DESATIVADO!"
        ]);
    }

    /**
     * Delete service (admin)
     */
    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $pdo->prepare("DELETE FROM services WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Serviço excluído com sucesso!']);
    }
}
