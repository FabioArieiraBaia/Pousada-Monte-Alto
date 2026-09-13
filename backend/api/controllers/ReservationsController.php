<?php
// backend/api/controllers/ReservationsController.php

class ReservationsController {

    public static function getAll($pdo) {
        requireAuth($pdo);
        
        $sql = "SELECT r.*, a.name_pt as accommodation_name, a.type as accommodation_type, a.slug as accommodation_slug,
                (SELECT COUNT(*) FROM financial_transactions WHERE reservation_id = r.id AND status = 'completed') as is_in_finance
                FROM reservations r
                LEFT JOIN accommodations a ON r.accommodation_id = a.id
                ORDER BY r.created_at DESC";
                
        $stmt = $pdo->query($sql);
        $reservations = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $reservations]);
    }

    public static function getCalendar($pdo) {
        requireAuth($pdo);
        
        $month = $_GET['month'] ?? date('Y-m');
        $startDate = $month . '-01';
        $endDate = date('Y-m-t', strtotime($startDate));
        
        $sql = "SELECT r.*, a.name_pt as accommodation_name, a.type as accommodation_type
                FROM reservations r
                LEFT JOIN accommodations a ON r.accommodation_id = a.id
                WHERE (r.check_in <= ? AND r.check_out >= ?)
                AND r.status != 'cancelled'
                ORDER BY r.check_in ASC";
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$endDate, $startDate]);
        $reservations = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $reservations]);
    }

    public static function createPublic($pdo) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $accommodationId = intval($data['accommodation_id'] ?? 0);
        $guestName = trim($data['guest_name'] ?? '');
        $guestEmail = trim($data['guest_email'] ?? '');
        $guestPhone = trim($data['guest_phone'] ?? '');
        $checkIn = $data['check_in'] ?? '';
        $checkOut = $data['check_out'] ?? '';
        $adultsCount = intval($data['adults_count'] ?? 1);
        $childrenCount = intval($data['children_count'] ?? 0);
        $hasPets = !empty($data['has_pets']) ? 1 : 0;
        $notes = trim($data['notes'] ?? '');
        
        if (!$accommodationId || !$guestName || !$guestPhone || !$checkIn || !$checkOut) {
            http_response_code(400);
            echo json_encode(['error' => 'Por favor preencha todos os campos obrigatórios (acomodação, nome, telefone, check-in e check-out)']);
            return;
        }
        
        // Fetch accommodation details to calculate total
        $stmtAcc = $pdo->prepare("SELECT * FROM accommodations WHERE id = ?");
        $stmtAcc->execute([$accommodationId]);
        $acc = $stmtAcc->fetch();
        
        if (!$acc) {
            http_response_code(404);
            echo json_encode(['error' => 'Acomodação não encontrada']);
            return;
        }
        
        $nights = max(1, (strtotime($checkOut) - strtotime($checkIn)) / 86400);
        $totalPrice = $nights * $acc['base_price'];
        
        $stmt = $pdo->prepare("INSERT INTO reservations 
            (accommodation_id, guest_name, guest_email, guest_phone, check_in, check_out, adults_count, children_count, has_pets, total_price, status, payment_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?)");
            
        $stmt->execute([
            $accommodationId, $guestName, $guestEmail, $guestPhone,
            $checkIn, $checkOut, $adultsCount, $childrenCount, $hasPets,
            $totalPrice, $notes
        ]);
        
        $resId = $pdo->lastInsertId();
        
        // Build WhatsApp Message Link for instant contact
        $stmtSetting = $pdo->query("SELECT setting_value FROM site_settings WHERE setting_key = 'whatsapp'");
        $pousadaWhatsApp = $stmtSetting->fetchColumn() ?: '5521969493569';
        
        $msg = "Olá! Gostaria de confirmar minha solicitação de reserva na *{$acc['name_pt']}* na *Pousada Monte Alto*.\n\n" .
               "📅 *Check-in:* " . date('d/m/Y', strtotime($checkIn)) . "\n" .
               "📅 *Check-out:* " . date('d/m/Y', strtotime($checkOut)) . " ({$nights} diárias)\n" .
               "👥 *Hóspedes:* {$adultsCount} adulto(s)" . ($childrenCount > 0 ? " + {$childrenCount} criança(s)" : "") . "\n" .
               "🐾 *Pets:* " . ($hasPets ? "Sim" : "Não") . "\n" .
               "💰 *Valor estimado:* R$ " . number_format($totalPrice, 2, ',', '.') . "\n" .
               "👤 *Nome:* {$guestName}\n" .
               "🔖 *Cód. Solicitação:* #{$resId}";
               
        $whatsappUrl = "https://wa.me/{$pousadaWhatsApp}?text=" . rawurlencode($msg);
        
        echo json_encode([
            'success' => true,
            'id' => $resId,
            'total_price' => $totalPrice,
            'nights' => $nights,
            'whatsapp_url' => $whatsappUrl,
            'message' => 'Solicitação de reserva registrada com sucesso! Entraremos em contato via WhatsApp.'
        ]);
    }

    public static function createAdmin($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $stmt = $pdo->prepare("INSERT INTO reservations 
            (accommodation_id, guest_name, guest_email, guest_phone, check_in, check_out, adults_count, children_count, has_pets, total_price, status, payment_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
        $stmt->execute([
            intval($data['accommodation_id']),
            $data['guest_name'],
            $data['guest_email'] ?? '',
            $data['guest_phone'],
            $data['check_in'],
            $data['check_out'],
            intval($data['adults_count'] ?? 1),
            intval($data['children_count'] ?? 0),
            !empty($data['has_pets']) ? 1 : 0,
            floatval($data['total_price']),
            $data['status'] ?? 'confirmed',
            $data['payment_status'] ?? 'paid',
            $data['notes'] ?? ''
        ]);
        
        $resId = $pdo->lastInsertId();
        
        // Auto-create financial income if paid or confirmed
        if (($data['payment_status'] ?? '') === 'paid' || in_array(($data['status'] ?? ''), ['confirmed', 'checked_in'])) {
            $nights = max(1, round((strtotime($data['check_out']) - strtotime($data['check_in'])) / 86400));
            $accId = intval($data['accommodation_id']);
            $stmtAcc = $pdo->prepare("SELECT name_pt FROM accommodations WHERE id = ?");
            $stmtAcc->execute([$accId]);
            $accName = $stmtAcc->fetchColumn() ?: 'Acomodação';

            $stmtFin = $pdo->prepare("INSERT INTO financial_transactions 
                (reservation_id, accommodation_id, checkin_date, checkout_date, nights, type, category, amount, payment_method, transaction_date, description, status)
                VALUES (?, ?, ?, ?, ?, 'income', 'diaria', ?, ?, ?, ?, 'completed')");
            $stmtFin->execute([
                $resId,
                $accId,
                $data['check_in'],
                $data['check_out'],
                $nights,
                floatval($data['total_price']),
                $data['payment_method'] ?? 'pix',
                date('Y-m-d'),
                "Reserva #{$resId} - {$data['guest_name']} ({$accName} • {$nights} diárias)"
            ]);
        }
        
        echo json_encode(['success' => true, 'id' => $resId, 'message' => 'Reserva criada com sucesso']);
    }

    public static function updateStatus($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $status = $data['status'] ?? null;
        $paymentStatus = $data['payment_status'] ?? null;
        
        $updates = [];
        $params = [];
        
        if ($status !== null) {
            $updates[] = "status = ?";
            $params[] = $status;
        }
        if ($paymentStatus !== null) {
            $updates[] = "payment_status = ?";
            $params[] = $paymentStatus;
        }
        if (isset($data['notes'])) {
            $updates[] = "notes = ?";
            $params[] = $data['notes'];
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum campo para atualizar']);
            return;
        }
        
        $params[] = $id;
        $stmt = $pdo->prepare("UPDATE reservations SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->execute($params);
        
        // Synchronization with financial module
        if ($paymentStatus === 'paid' || in_array($status, ['confirmed', 'checked_in'])) {
            $stmtRes = $pdo->prepare("SELECT r.*, a.name_pt as accommodation_name FROM reservations r LEFT JOIN accommodations a ON r.accommodation_id = a.id WHERE r.id = ?");
            $stmtRes->execute([$id]);
            $res = $stmtRes->fetch();
            
            if ($res) {
                $stmtCheck = $pdo->prepare("SELECT id, status FROM financial_transactions WHERE reservation_id = ?");
                $stmtCheck->execute([$id]);
                $existingTx = $stmtCheck->fetch();

                if (!$existingTx) {
                    $nights = max(1, round((strtotime($res['check_out']) - strtotime($res['check_in'])) / 86400));
                    $accName = $res['accommodation_name'] ?: 'Acomodação';
                    $stmtFin = $pdo->prepare("INSERT INTO financial_transactions 
                        (reservation_id, accommodation_id, checkin_date, checkout_date, nights, type, category, amount, payment_method, transaction_date, description, status)
                        VALUES (?, ?, ?, ?, ?, 'income', 'diaria', ?, 'pix', ?, ?, 'completed')");
                    $stmtFin->execute([
                        $id,
                        $res['accommodation_id'],
                        $res['check_in'],
                        $res['check_out'],
                        $nights,
                        $res['total_price'],
                        date('Y-m-d'),
                        "Reserva #{$id} - {$res['guest_name']} ({$accName} • {$nights} diárias)"
                    ]);
                } else if ($existingTx['status'] === 'cancelled') {
                    $pdo->prepare("UPDATE financial_transactions SET status = 'completed' WHERE id = ?")->execute([$existingTx['id']]);
                }
            }
        } else if ($status === 'cancelled') {
            $pdo->prepare("UPDATE financial_transactions SET status = 'cancelled' WHERE reservation_id = ?")->execute([$id]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Status da reserva atualizado com sucesso']);
    }

    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $pdo->prepare("DELETE FROM reservations WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Reserva excluída com sucesso']);
    }

    public static function getWhatsAppLink($pdo, $id) {
        requireAuth($pdo);
        $stmt = $pdo->prepare("SELECT r.*, a.name_pt as room_name FROM reservations r LEFT JOIN accommodations a ON r.accommodation_id = a.id WHERE r.id = ?");
        $stmt->execute([$id]);
        $res = $stmt->fetch();
        
        if (!$res) {
            http_response_code(404);
            echo json_encode(['error' => 'Reserva não encontrada']);
            return;
        }
        
        // Sanitize phone
        $phone = preg_replace('/[^0-9]/', '', $res['guest_phone']);
        if (strlen($phone) <= 11 && !str_starts_with($phone, '55')) {
            $phone = '55' . $phone;
        }
        
        $msg = "Olá *{$res['guest_name']}*! Aqui é da *Pousada Monte Alto* em Arraial do Cabo.\n\n" .
               "Estamos entrando em contato sobre a sua reserva na *{$res['room_name']}*:\n" .
               "📅 *Check-in:* " . date('d/m/Y', strtotime($res['check_in'])) . " a partir das 14h\n" .
               "📅 *Check-out:* " . date('d/m/Y', strtotime($res['check_out'])) . " até às 12h\n" .
               "💰 *Valor Total:* R$ " . number_format($res['total_price'], 2, ',', '.') . "\n" .
               "📌 *Status:* " . ($res['status'] === 'confirmed' ? '✅ Confirmada' : '⏳ Pendente') . "\n\n" .
               "Caso tenha qualquer dúvida sobre o trajeto ou horários, estamos à sua total disposição. Seja muito bem-vindo!";
               
        $url = "https://wa.me/{$phone}?text=" . rawurlencode($msg);
        echo json_encode(['success' => true, 'whatsapp_url' => $url, 'phone' => $phone, 'message_text' => $msg]);
    }
}
