<?php
// backend/api/controllers/PackagesController.php

class PackagesController {

    /**
     * List all packages (public & admin)
     */
    public static function getAll($pdo) {
        $stmt = $pdo->query("SELECT * FROM packages ORDER BY start_date ASC");
        $packages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmtAcc = $pdo->prepare("
            SELECT pa.*, a.name_pt, a.type, a.base_price,
                   (SELECT photo_url FROM accommodation_photos WHERE accommodation_id = a.id AND is_cover = 1 LIMIT 1) as cover_photo
            FROM package_accommodations pa
            JOIN accommodations a ON pa.accommodation_id = a.id
            WHERE pa.package_id = ?
            ORDER BY a.id ASC
        ");

        foreach ($packages as &$pkg) {
            $stmtAcc->execute([$pkg['id']]);
            $pkg['accommodations'] = $stmtAcc->fetchAll(PDO::FETCH_ASSOC);
            $pkg['is_active'] = (int)$pkg['is_active'];
        }

        echo json_encode(['success' => true, 'data' => $packages]);
    }

    /**
     * Get single package by ID
     */
    public static function getById($pdo, $id) {
        $stmt = $pdo->prepare("SELECT * FROM packages WHERE id = ?");
        $stmt->execute([$id]);
        $pkg = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$pkg) {
            http_response_code(404);
            echo json_encode(['error' => 'Pacote não encontrado']);
            return;
        }

        $stmtAcc = $pdo->prepare("
            SELECT pa.*, a.name_pt, a.type, a.base_price,
                   (SELECT photo_url FROM accommodation_photos WHERE accommodation_id = a.id AND is_cover = 1 LIMIT 1) as cover_photo
            FROM package_accommodations pa
            JOIN accommodations a ON pa.accommodation_id = a.id
            WHERE pa.package_id = ?
            ORDER BY a.id ASC
        ");
        $stmtAcc->execute([$id]);
        $pkg['accommodations'] = $stmtAcc->fetchAll(PDO::FETCH_ASSOC);
        $pkg['is_active'] = (int)$pkg['is_active'];

        echo json_encode(['success' => true, 'data' => $pkg]);
    }

    /**
     * Create package (Admin)
     */
    public static function create($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim($data['name'] ?? '');
        $startDate = $data['start_date'] ?? '';
        $endDate = $data['end_date'] ?? '';
        $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 1;
        $description = trim($data['description'] ?? '');

        if (!$name || !$startDate || !$endDate) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome, data inicial e data final do pacote são obrigatórios']);
            return;
        }

        $stmt = $pdo->prepare("INSERT INTO packages (name, start_date, end_date, is_active, description) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $startDate, $endDate, $isActive, $description]);
        $packageId = (int)$pdo->lastInsertId();

        // Accommodations setup
        $accommodations = $data['accommodations'] ?? [];
        if (empty($accommodations)) {
            // Default: create for all active accommodations with default values
            $allAccs = $pdo->query("SELECT id, base_price FROM accommodations WHERE is_active = 1")->fetchAll(PDO::FETCH_ASSOC);
            $stmtPA = $pdo->prepare("INSERT INTO package_accommodations (package_id, accommodation_id, price_per_night, min_nights, is_active) VALUES (?, ?, ?, ?, ?)");
            foreach ($allAccs as $acc) {
                $stmtPA->execute([$packageId, $acc['id'], (float)$acc['base_price'], 3, 1]);
            }
        } else {
            $stmtPA = $pdo->prepare("INSERT INTO package_accommodations (package_id, accommodation_id, price_per_night, min_nights, is_active) VALUES (?, ?, ?, ?, ?)");
            foreach ($accommodations as $acc) {
                if (!empty($acc['accommodation_id'])) {
                    $stmtPA->execute([
                        $packageId,
                        (int)$acc['accommodation_id'],
                        floatval($acc['price_per_night'] ?? 0),
                        max(1, intval($acc['min_nights'] ?? 2)),
                        isset($acc['is_active']) ? (int)$acc['is_active'] : 1
                    ]);
                }
            }
        }

        echo json_encode(['success' => true, 'id' => $packageId, 'message' => 'Pacote criado com sucesso!']);
    }

    /**
     * Update package (Admin)
     */
    public static function update($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $stmt = $pdo->prepare("SELECT * FROM packages WHERE id = ?");
        $stmt->execute([$id]);
        $pkg = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$pkg) {
            http_response_code(404);
            echo json_encode(['error' => 'Pacote não encontrado']);
            return;
        }

        $name = trim($data['name'] ?? $pkg['name']);
        $startDate = $data['start_date'] ?? $pkg['start_date'];
        $endDate = $data['end_date'] ?? $pkg['end_date'];
        $isActive = isset($data['is_active']) ? (int)$data['is_active'] : (int)$pkg['is_active'];
        $description = isset($data['description']) ? trim($data['description']) : ($pkg['description'] ?? '');

        $stmtUp = $pdo->prepare("UPDATE packages SET name = ?, start_date = ?, end_date = ?, is_active = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmtUp->execute([$name, $startDate, $endDate, $isActive, $description, $id]);

        // If accommodations passed, update them
        if (isset($data['accommodations']) && is_array($data['accommodations'])) {
            $pdo->prepare("DELETE FROM package_accommodations WHERE package_id = ?")->execute([$id]);
            $stmtPA = $pdo->prepare("INSERT INTO package_accommodations (package_id, accommodation_id, price_per_night, min_nights, is_active) VALUES (?, ?, ?, ?, ?)");
            foreach ($data['accommodations'] as $acc) {
                if (!empty($acc['accommodation_id'])) {
                    $stmtPA->execute([
                        $id,
                        (int)$acc['accommodation_id'],
                        floatval($acc['price_per_night'] ?? 0),
                        max(1, intval($acc['min_nights'] ?? 2)),
                        isset($acc['is_active']) ? (int)$acc['is_active'] : 1
                    ]);
                }
            }
        }

        echo json_encode(['success' => true, 'message' => 'Pacote atualizado com sucesso!']);
    }

    /**
     * Toggle package active status (Admin)
     */
    public static function toggle($pdo, $id) {
        requireAuth($pdo);

        $stmt = $pdo->prepare("SELECT id, is_active, name FROM packages WHERE id = ?");
        $stmt->execute([$id]);
        $pkg = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$pkg) {
            http_response_code(404);
            echo json_encode(['error' => 'Pacote não encontrado']);
            return;
        }

        $newStatus = ((int)$pkg['is_active'] === 1) ? 0 : 1;
        $pdo->prepare("UPDATE packages SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$newStatus, $id]);

        echo json_encode([
            'success' => true,
            'is_active' => $newStatus,
            'message' => $newStatus === 1 ? "Pacote \"{$pkg['name']}\" ATIVADO!" : "Pacote \"{$pkg['name']}\" DESATIVADO!"
        ]);
    }

    /**
     * Delete package (Admin)
     */
    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $pdo->prepare("DELETE FROM packages WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Pacote excluído com sucesso!']);
    }
}