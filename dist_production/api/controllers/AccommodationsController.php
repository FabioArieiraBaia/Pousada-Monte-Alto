<?php
// backend/api/controllers/AccommodationsController.php

class AccommodationsController {
    
    public static function getAll($pdo, $publicOnly = false) {
        $sql = "SELECT a.* FROM accommodations a";
        if ($publicOnly) {
            $sql .= " WHERE a.is_active = 1";
        }
        $sql .= " ORDER BY a.id ASC";
        
        $stmt = $pdo->query($sql);
        $accommodations = $stmt->fetchAll();
        
        foreach ($accommodations as &$acc) {
            $acc['amenities'] = json_decode($acc['amenities_json'] ?? '[]', true) ?: [];
            $acc['accepts_pets'] = intval($acc['accepts_pets'] ?? 0);
            $acc['is_promo'] = intval($acc['is_promo'] ?? 0);
            
            // Fetch photos
            $stmtPhotos = $pdo->prepare("SELECT id, photo_url, is_cover, order_index FROM accommodation_photos WHERE accommodation_id = ? ORDER BY is_cover DESC, order_index ASC");
            $stmtPhotos->execute([$acc['id']]);
            $acc['photos'] = $stmtPhotos->fetchAll();
            $acc['cover_photo'] = !empty($acc['photos']) ? $acc['photos'][0]['photo_url'] : null;
            
            // Fetch seasonal prices
            $stmtSeason = $pdo->prepare("SELECT id, start_date, end_date, price_per_night, label FROM seasonal_prices WHERE accommodation_id = ? ORDER BY start_date ASC");
            $stmtSeason->execute([$acc['id']]);
            $acc['seasonal_prices'] = $stmtSeason->fetchAll();
        }
        
        echo json_encode(['success' => true, 'data' => $accommodations]);
    }
    
    public static function getBySlug($pdo, $slug) {
        $stmt = $pdo->prepare("SELECT * FROM accommodations WHERE slug = ?");
        $stmt->execute([$slug]);
        $acc = $stmt->fetch();
        
        if (!$acc) {
            http_response_code(404);
            echo json_encode(['error' => 'Acomodação não encontrada']);
            return;
        }
        
        $acc['amenities'] = json_decode($acc['amenities_json'] ?? '[]', true) ?: [];
        $acc['accepts_pets'] = intval($acc['accepts_pets'] ?? 0);
        $acc['is_promo'] = intval($acc['is_promo'] ?? 0);
        
        // Fetch photos
        $stmtPhotos = $pdo->prepare("SELECT id, photo_url, is_cover, order_index FROM accommodation_photos WHERE accommodation_id = ? ORDER BY is_cover DESC, order_index ASC");
        $stmtPhotos->execute([$acc['id']]);
        $acc['photos'] = $stmtPhotos->fetchAll();
        $acc['cover_photo'] = !empty($acc['photos']) ? $acc['photos'][0]['photo_url'] : null;
        
        // Fetch seasonal prices
        $stmtSeason = $pdo->prepare("SELECT id, start_date, end_date, price_per_night, label FROM seasonal_prices WHERE accommodation_id = ? ORDER BY start_date ASC");
        $stmtSeason->execute([$acc['id']]);
        $acc['seasonal_prices'] = $stmtSeason->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $acc]);
    }

    public static function create($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $slug = trim($data['slug'] ?? '');
        if (empty($slug)) {
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['name_pt'] ?? 'quarto-' . time())));
        }
        
        $acceptsPets = (!empty($data['accepts_pets']) && $data['accepts_pets'] !== 'false' && $data['accepts_pets'] !== false && $data['accepts_pets'] !== 0 && $data['accepts_pets'] !== '0') ? 1 : 0;
        $isPromo = (!empty($data['is_promo']) && $data['is_promo'] !== 'false' && $data['is_promo'] !== false && $data['is_promo'] !== 0 && $data['is_promo'] !== '0') ? 1 : 0;
        
        $stmt = $pdo->prepare("INSERT INTO accommodations 
            (slug, type, name_pt, name_en, name_es, description_pt, description_en, description_es, base_price, max_guests, accepts_pets, is_promo, youtube_video_url, amenities_json, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
        $stmt->execute([
            $slug,
            $data['type'] ?? 'suite',
            $data['name_pt'] ?? 'Nova Suíte',
            $data['name_en'] ?? $data['name_pt'] ?? 'New Suite',
            $data['name_es'] ?? $data['name_pt'] ?? 'Nueva Suite',
            $data['description_pt'] ?? '',
            $data['description_en'] ?? '',
            $data['description_es'] ?? '',
            floatval($data['base_price'] ?? 350.00),
            intval($data['max_guests'] ?? 2),
            $acceptsPets,
            $isPromo,
            $data['youtube_video_url'] ?? '',
            json_encode($data['amenities'] ?? []),
            isset($data['is_active']) ? intval($data['is_active']) : 1
        ]);
        
        $id = $pdo->lastInsertId();
        
        // Handle photos if provided
        if (!empty($data['photos']) && is_array($data['photos'])) {
            $stmtP = $pdo->prepare("INSERT INTO accommodation_photos (accommodation_id, photo_url, is_cover, order_index) VALUES (?, ?, ?, ?)");
            $order = 0;
            foreach ($data['photos'] as $p) {
                $url = is_string($p) ? $p : ($p['photo_url'] ?? '');
                $isCover = !empty($p['is_cover']) ? 1 : ($order === 0 ? 1 : 0);
                if ($url) {
                    $stmtP->execute([$id, $url, $isCover, $order++]);
                }
            }
        }
        
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Acomodação criada com sucesso']);
    }

    public static function update($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $acceptsPets = (!empty($data['accepts_pets']) && $data['accepts_pets'] !== 'false' && $data['accepts_pets'] !== false && $data['accepts_pets'] !== 0 && $data['accepts_pets'] !== '0') ? 1 : 0;
        $isPromo = (!empty($data['is_promo']) && $data['is_promo'] !== 'false' && $data['is_promo'] !== false && $data['is_promo'] !== 0 && $data['is_promo'] !== '0') ? 1 : 0;
        
        $stmt = $pdo->prepare("UPDATE accommodations SET 
            type = ?,
            name_pt = ?, name_en = ?, name_es = ?,
            description_pt = ?, description_en = ?, description_es = ?,
            base_price = ?, max_guests = ?, accepts_pets = ?, is_promo = ?,
            youtube_video_url = ?, amenities_json = ?, is_active = ?
            WHERE id = ?");
            
        $stmt->execute([
            $data['type'] ?? 'suite',
            $data['name_pt'],
            $data['name_en'] ?? $data['name_pt'],
            $data['name_es'] ?? $data['name_pt'],
            $data['description_pt'] ?? '',
            $data['description_en'] ?? '',
            $data['description_es'] ?? '',
            floatval($data['base_price']),
            intval($data['max_guests'] ?? 2),
            $acceptsPets,
            $isPromo,
            $data['youtube_video_url'] ?? '',
            json_encode($data['amenities'] ?? []),
            isset($data['is_active']) ? intval($data['is_active']) : 1,
            $id
        ]);
        
        // Update photos if provided
        if (isset($data['photos']) && is_array($data['photos'])) {
            $pdo->prepare("DELETE FROM accommodation_photos WHERE accommodation_id = ?")->execute([$id]);
            $stmtP = $pdo->prepare("INSERT INTO accommodation_photos (accommodation_id, photo_url, is_cover, order_index) VALUES (?, ?, ?, ?)");
            $order = 0;
            foreach ($data['photos'] as $p) {
                $url = is_string($p) ? $p : ($p['photo_url'] ?? '');
                $isCover = !empty($p['is_cover']) ? 1 : ($order === 0 ? 1 : 0);
                if ($url) {
                    $stmtP->execute([$id, $url, $isCover, $order++]);
                }
            }
        }
        
        // Update seasonal prices if provided
        if (isset($data['seasonal_prices']) && is_array($data['seasonal_prices'])) {
            $pdo->prepare("DELETE FROM seasonal_prices WHERE accommodation_id = ?")->execute([$id]);
            $stmtS = $pdo->prepare("INSERT INTO seasonal_prices (accommodation_id, start_date, end_date, price_per_night, label) VALUES (?, ?, ?, ?, ?)");
            foreach ($data['seasonal_prices'] as $sp) {
                if (!empty($sp['start_date']) && !empty($sp['end_date']) && !empty($sp['price_per_night'])) {
                    $stmtS->execute([$id, $sp['start_date'], $sp['end_date'], floatval($sp['price_per_night']), $sp['label'] ?? '']);
                }
            }
        }
        
        echo json_encode(['success' => true, 'message' => 'Acomodação atualizada com sucesso']);
    }

    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $pdo->prepare("DELETE FROM accommodations WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Acomodação excluída com sucesso']);
    }

    public static function addPhoto($pdo, $accommodationId) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $photoUrl = $data['photo_url'] ?? '';
        
        if (empty($photoUrl)) {
            http_response_code(400);
            echo json_encode(['error' => 'URL da foto é obrigatória']);
            return;
        }
        
        $isCover = !empty($data['is_cover']) ? 1 : 0;
        if ($isCover) {
            $pdo->prepare("UPDATE accommodation_photos SET is_cover = 0 WHERE accommodation_id = ?")->execute([$accommodationId]);
        }
        
        $stmt = $pdo->prepare("INSERT INTO accommodation_photos (accommodation_id, photo_url, is_cover, order_index) VALUES (?, ?, ?, 99)");
        $stmt->execute([$accommodationId, $photoUrl, $isCover]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Foto adicionada com sucesso']);
    }

    public static function deletePhoto($pdo, $photoId) {
        requireAuth($pdo);
        $pdo->prepare("DELETE FROM accommodation_photos WHERE id = ?")->execute([$photoId]);
        echo json_encode(['success' => true, 'message' => 'Foto excluída com sucesso']);
    }

    public static function setCoverPhoto($pdo, $accommodationId, $photoId) {
        requireAuth($pdo);
        $pdo->prepare("UPDATE accommodation_photos SET is_cover = 0 WHERE accommodation_id = ?")->execute([$accommodationId]);
        $pdo->prepare("UPDATE accommodation_photos SET is_cover = 1 WHERE id = ? AND accommodation_id = ?")->execute([$photoId, $accommodationId]);
        echo json_encode(['success' => true, 'message' => 'Foto de capa atualizada']);
    }

    public static function checkAvailability($pdo) {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_GET;
        $checkIn = $input['check_in'] ?? null;
        $checkOut = $input['check_out'] ?? null;
        $guests = intval($input['guests'] ?? 1);
        $pets = (!empty($input['pets']) && $input['pets'] !== 'false' && $input['pets'] !== false && $input['pets'] !== 0 && $input['pets'] !== '0') ? 1 : 0;
        
        if (!$checkIn || !$checkOut) {
            http_response_code(400);
            echo json_encode(['error' => 'Datas de check-in e check-out são obrigatórias']);
            return;
        }
        
        $sql = "SELECT a.* FROM accommodations a 
                WHERE a.is_active = 1 
                AND a.max_guests >= ? ";
                
        $params = [$guests];
        
        if ($pets === 1) {
            $sql .= " AND a.accepts_pets = 1";
        }
        
        $sql .= " AND a.id NOT IN (
                    SELECT r.accommodation_id FROM reservations r 
                    WHERE r.status IN ('confirmed', 'checked_in')
                    AND (
                        (r.check_in <= ? AND r.check_out >= ?) OR
                        (r.check_in <= ? AND r.check_out >= ?) OR
                        (r.check_in >= ? AND r.check_out <= ?)
                    )
                )";
                
        $params = array_merge($params, [$checkIn, $checkIn, $checkOut, $checkOut, $checkIn, $checkOut]);
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $availableRooms = $stmt->fetchAll();
        
        // Enrich photos
        foreach ($availableRooms as &$acc) {
            $acc['amenities'] = json_decode($acc['amenities_json'] ?? '[]', true) ?: [];
            $acc['accepts_pets'] = intval($acc['accepts_pets'] ?? 0);
            $acc['is_promo'] = intval($acc['is_promo'] ?? 0);
            $stmtPhotos = $pdo->prepare("SELECT photo_url FROM accommodation_photos WHERE accommodation_id = ? ORDER BY is_cover DESC, order_index ASC");
            $stmtPhotos->execute([$acc['id']]);
            $acc['photos'] = $stmtPhotos->fetchAll(PDO::FETCH_COLUMN);
            $acc['cover_photo'] = $acc['photos'][0] ?? null;
            
            // Calculate total price for date range
            $days = max(1, (strtotime($checkOut) - strtotime($checkIn)) / 86400);
            $acc['calculated_total'] = $days * $acc['base_price'];
            $acc['nights'] = $days;
        }
        
        echo json_encode(['success' => true, 'data' => $availableRooms]);
    }
}
