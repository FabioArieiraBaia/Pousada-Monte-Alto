<?php
// backend/api/controllers/ReservationsController.php

require_once __DIR__ . '/../services_lib/StayRuleService.php';

class ReservationsController {

    public static function getAll($pdo) {
        requireAuth($pdo);
        
        $sql = "SELECT r.*, 
                ROUND(r.total_price - COALESCE(r.paid_amount, 0), 2) as remaining_balance,
                a.name_pt as accommodation_name, a.type as accommodation_type, a.slug as accommodation_slug,
                (SELECT COUNT(*) FROM financial_transactions WHERE reservation_id = r.id AND status = 'completed') as is_in_finance
                FROM reservations r
                LEFT JOIN accommodations a ON r.accommodation_id = a.id
                ORDER BY r.check_in ASC, r.created_at DESC";
                
        $stmt = $pdo->query($sql);
        $reservations = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $reservations]);
    }

    public static function getCalendar($pdo) {
        requireAuth($pdo);
        
        $month = $_GET['month'] ?? date('Y-m');
        $startDate = $month . '-01';
        $endDate = date('Y-m-t', strtotime($startDate));
        
        $sql = "SELECT r.*, 
                ROUND(r.total_price - COALESCE(r.paid_amount, 0), 2) as remaining_balance,
                a.name_pt as accommodation_name, a.type as accommodation_type
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
        
        // Validate stay rules (minimum nights, weekend rules, and packages)
        $stayRule = StayRuleService::validateStay($pdo, $accommodationId, $checkIn, $checkOut);
        if (!$stayRule['valid']) {
            http_response_code(400);
            echo json_encode([
                'error' => $stayRule['reason'],
                'min_nights' => $stayRule['min_nights'],
                'is_package' => $stayRule['is_package']
            ]);
            return;
        }

        $nights = $stayRule['nights'];
        $totalPrice = $stayRule['total_price'];
        
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
        
        // Disparar Notificações (Push no celular do Admin e WhatsApp CallMeBot)
        try {
            require_once __DIR__ . '/../services_lib/NotificationService.php';
            NotificationService::notifyNewLead($pdo, [
                'guest_name' => $guestName,
                'guest_phone' => $guestPhone,
                'guest_email' => $guestEmail,
                'accommodation_name' => $acc['name_pt'],
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'adults_count' => $adultsCount,
                'has_pets' => $hasPets,
                'total_price' => $totalPrice,
                'source' => 'Formulário de Reserva do Site',
                'notes' => $notes
            ]);
        } catch (Exception $e) {
            error_log("Erro ao disparar notificações de nova reserva: " . $e->getMessage());
        }

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
        
        $totalPrice = floatval($data['total_price'] ?? 0);
        $paidAmount = isset($data['paid_amount']) ? floatval($data['paid_amount']) : 0;
        $paymentStatus = $data['payment_status'] ?? null;
        
        if (!$paymentStatus) {
            if ($paidAmount >= $totalPrice && $totalPrice > 0) {
                $paymentStatus = 'paid';
            } else if ($paidAmount > 0) {
                $paymentStatus = 'partial';
            } else {
                $paymentStatus = 'unpaid';
            }
        }
        if ($paymentStatus === 'paid' && $paidAmount == 0 && $totalPrice > 0) {
            $paidAmount = $totalPrice;
        }

        $stmt = $pdo->prepare("INSERT INTO reservations 
            (accommodation_id, guest_name, guest_email, guest_phone, check_in, check_out, adults_count, children_count, has_pets, total_price, paid_amount, status, payment_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
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
            $totalPrice,
            $paidAmount,
            $data['status'] ?? 'confirmed',
            $paymentStatus,
            $data['notes'] ?? ''
        ]);
        
        $resId = $pdo->lastInsertId();
        
        // Auto-create financial income if paid/partial or confirmed
        if ($paidAmount > 0 || in_array(($data['status'] ?? ''), ['confirmed', 'checked_in'])) {
            $nights = max(1, round((strtotime($data['check_out']) - strtotime($data['check_in'])) / 86400));
            $accId = intval($data['accommodation_id']);
            $stmtAcc = $pdo->prepare("SELECT name_pt FROM accommodations WHERE id = ?");
            $stmtAcc->execute([$accId]);
            $accName = $stmtAcc->fetchColumn() ?: 'Acomodação';
            
            $finAmount = $paidAmount > 0 ? $paidAmount : $totalPrice;
            $descSuffix = $paymentStatus === 'partial' 
                ? " (Sinal / Entrada - Resta: R$ " . number_format($totalPrice - $paidAmount, 2, ',', '.') . ")"
                : " (Quitação Integral)";

            $stmtFin = $pdo->prepare("INSERT INTO financial_transactions 
                (reservation_id, accommodation_id, checkin_date, checkout_date, nights, type, category, amount, payment_method, transaction_date, description, status)
                VALUES (?, ?, ?, ?, ?, 'income', 'diaria', ?, ?, ?, ?, 'completed')");
            $stmtFin->execute([
                $resId,
                $accId,
                $data['check_in'],
                $data['check_out'],
                $nights,
                $finAmount,
                $data['payment_method'] ?? 'pix',
                date('Y-m-d'),
                "Reserva #{$resId} - {$data['guest_name']} ({$accName} • {$nights} diárias){$descSuffix}"
            ]);
        }
        
        echo json_encode([
            'success' => true, 
            'id' => $resId, 
            'message' => 'Reserva criada com sucesso',
            'remaining_balance' => max(0, $totalPrice - $paidAmount)
        ]);
    }

    public static function updateAdmin($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $stmtRes = $pdo->prepare("SELECT * FROM reservations WHERE id = ?");
        $stmtRes->execute([$id]);
        $current = $stmtRes->fetch();
        if (!$current) {
            http_response_code(404);
            echo json_encode(['error' => 'Reserva não encontrada']);
            return;
        }

        $accId = intval($data['accommodation_id'] ?? $current['accommodation_id']);
        $guestName = trim($data['guest_name'] ?? $current['guest_name']);
        $guestEmail = trim($data['guest_email'] ?? $current['guest_email']);
        $guestPhone = trim($data['guest_phone'] ?? $current['guest_phone']);
        $checkIn = $data['check_in'] ?? $current['check_in'];
        $checkOut = $data['check_out'] ?? $current['check_out'];
        $adultsCount = intval($data['adults_count'] ?? $current['adults_count']);
        $childrenCount = intval($data['children_count'] ?? $current['children_count']);
        $hasPets = isset($data['has_pets']) ? (!empty($data['has_pets']) ? 1 : 0) : $current['has_pets'];
        $totalPrice = floatval($data['total_price'] ?? $current['total_price']);
        $paidAmount = isset($data['paid_amount']) ? floatval($data['paid_amount']) : floatval($current['paid_amount']);
        $status = $data['status'] ?? $current['status'];
        $notes = $data['notes'] ?? $current['notes'];
        
        // Auto-detect or respect payment_status
        $paymentStatus = $data['payment_status'] ?? null;
        if (!empty($data['quick_pay'])) {
            $paidAmount = $totalPrice;
            $paymentStatus = 'paid';
        } else if (!$paymentStatus) {
            if ($paidAmount >= $totalPrice && $totalPrice > 0) {
                $paymentStatus = 'paid';
            } else if ($paidAmount > 0) {
                $paymentStatus = 'partial';
            } else {
                $paymentStatus = 'unpaid';
            }
        } else if ($paymentStatus === 'paid' && $paidAmount == 0 && $totalPrice > 0) {
            $paidAmount = $totalPrice;
        }

        $stmtUpdate = $pdo->prepare("UPDATE reservations SET 
            accommodation_id = ?, guest_name = ?, guest_email = ?, guest_phone = ?,
            check_in = ?, check_out = ?, adults_count = ?, children_count = ?, has_pets = ?,
            total_price = ?, paid_amount = ?, status = ?, payment_status = ?, notes = ?
            WHERE id = ?");
            
        $stmtUpdate->execute([
            $accId, $guestName, $guestEmail, $guestPhone,
            $checkIn, $checkOut, $adultsCount, $childrenCount, $hasPets,
            $totalPrice, $paidAmount, $status, $paymentStatus, $notes,
            $id
        ]);

        // Sincronização com o financeiro
        if ($paidAmount > 0) {
            $stmtFinCheck = $pdo->prepare("SELECT id, status FROM financial_transactions WHERE reservation_id = ? AND type = 'income'");
            $stmtFinCheck->execute([$id]);
            $existingFin = $stmtFinCheck->fetch();

            $nights = max(1, round((strtotime($checkOut) - strtotime($checkIn)) / 86400));
            $stmtAcc = $pdo->prepare("SELECT name_pt FROM accommodations WHERE id = ?");
            $stmtAcc->execute([$accId]);
            $accName = $stmtAcc->fetchColumn() ?: 'Acomodação';

            $descSuffix = $paymentStatus === 'partial' 
                ? " (Sinal / Entrada - Resta: R$ " . number_format($totalPrice - $paidAmount, 2, ',', '.') . ")"
                : " (Quitação Integral)";

            if ($existingFin) {
                $stmtFinUp = $pdo->prepare("UPDATE financial_transactions SET 
                    amount = ?, checkin_date = ?, checkout_date = ?, nights = ?, accommodation_id = ?,
                    description = ?, status = 'completed'
                    WHERE id = ?");
                $stmtFinUp->execute([
                    $paidAmount, $checkIn, $checkOut, $nights, $accId,
                    "Reserva #{$id} - {$guestName} ({$accName} • {$nights} diárias){$descSuffix}",
                    $existingFin['id']
                ]);
            } else {
                $stmtFinIns = $pdo->prepare("INSERT INTO financial_transactions 
                    (reservation_id, accommodation_id, checkin_date, checkout_date, nights, type, category, amount, payment_method, transaction_date, description, status)
                    VALUES (?, ?, ?, ?, ?, 'income', 'diaria', ?, ?, ?, ?, 'completed')");
                $stmtFinIns->execute([
                    $id, $accId, $checkIn, $checkOut, $nights, $paidAmount,
                    $data['payment_method'] ?? 'pix', date('Y-m-d'),
                    "Reserva #{$id} - {$guestName} ({$accName} • {$nights} diárias){$descSuffix}"
                ]);
            }
        }

        echo json_encode([
            'success' => true, 
            'message' => 'Reserva atualizada com sucesso',
            'remaining_balance' => max(0, $totalPrice - $paidAmount)
        ]);
    }

    public static function extendStay($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $newCheckOut = trim($data['new_check_out'] ?? '');
        $additionalPrice = floatval($data['additional_price'] ?? 0);
        $additionalPaid = floatval($data['additional_paid'] ?? 0);
        $paymentMethod = $data['payment_method'] ?? 'pix';
        $adminNotes = trim($data['notes'] ?? '');

        if (empty($newCheckOut)) {
            http_response_code(400);
            echo json_encode(['error' => 'A nova data de check-out é obrigatória']);
            return;
        }

        $stmt = $pdo->prepare("SELECT r.*, a.name_pt as accommodation_name FROM reservations r LEFT JOIN accommodations a ON r.accommodation_id = a.id WHERE r.id = ?");
        $stmt->execute([$id]);
        $res = $stmt->fetch();

        if (!$res) {
            http_response_code(404);
            echo json_encode(['error' => 'Reserva não encontrada']);
            return;
        }

        $oldCheckOut = $res['check_out'];
        if (strtotime($newCheckOut) <= strtotime($oldCheckOut)) {
            http_response_code(400);
            echo json_encode(['error' => 'A nova data de check-out deve ser posterior à data atual (' . date('d/m/Y', strtotime($oldCheckOut)) . ')']);
            return;
        }

        $diffNights = max(1, round((strtotime($newCheckOut) - strtotime($oldCheckOut)) / 86400));
        $oldTotal = floatval($res['total_price']);
        $oldPaid = floatval($res['paid_amount']);

        $newTotal = $oldTotal + $additionalPrice;
        $newPaid = $oldPaid + $additionalPaid;

        // Determine new payment status
        if ($newPaid >= $newTotal && $newTotal > 0) {
            $newPaymentStatus = 'paid';
        } else if ($newPaid > 0) {
            $newPaymentStatus = 'partial';
        } else {
            $newPaymentStatus = 'unpaid';
        }

        // Build log note
        $extMsg = "\n[Prorrogação em " . date('d/m/Y H:i') . ": Check-out alterado de " . date('d/m/Y', strtotime($oldCheckOut)) . " para " . date('d/m/Y', strtotime($newCheckOut)) . " (+{$diffNights} diárias). Adicional cobrado: R$ " . number_format($additionalPrice, 2, ',', '.') . ($additionalPaid > 0 ? " | Pago: R$ " . number_format($additionalPaid, 2, ',', '.') : "") . ($adminNotes ? " - Obs: {$adminNotes}" : "") . "]";
        $updatedNotes = trim(($res['notes'] ?? '') . $extMsg);

        // Update reservation
        $stmtUp = $pdo->prepare("UPDATE reservations SET 
            check_out = ?, total_price = ?, paid_amount = ?, payment_status = ?, notes = ?
            WHERE id = ?");
        $stmtUp->execute([
            $newCheckOut, $newTotal, $newPaid, $newPaymentStatus, $updatedNotes, $id
        ]);

        // Register income for the additional payment if received now
        if ($additionalPaid > 0) {
            $stmtFin = $pdo->prepare("INSERT INTO financial_transactions 
                (reservation_id, accommodation_id, checkin_date, checkout_date, nights, type, category, amount, payment_method, transaction_date, description, status)
                VALUES (?, ?, ?, ?, ?, 'income', 'diaria', ?, ?, ?, ?, 'completed')");
            $stmtFin->execute([
                $id,
                $res['accommodation_id'],
                $oldCheckOut,
                $newCheckOut,
                $diffNights,
                $additionalPaid,
                $paymentMethod,
                date('Y-m-d'),
                "Prorrogação Reserva #{$id} - {$res['guest_name']} (+{$diffNights} diárias até " . date('d/m/Y', strtotime($newCheckOut)) . ")"
            ]);
        }

        echo json_encode([
            'success' => true,
            'message' => "Estadia estendida com sucesso até " . date('d/m/Y', strtotime($newCheckOut)) . " (+{$diffNights} noites).",
            'new_check_out' => $newCheckOut,
            'new_total_price' => $newTotal,
            'new_paid_amount' => $newPaid,
            'remaining_balance' => max(0, $newTotal - $newPaid)
        ]);
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
        if (!empty($data['quick_pay'])) {
            $updates[] = "paid_amount = total_price";
            $updates[] = "payment_status = 'paid'";
            $paymentStatus = 'paid';
        } else {
            if ($paymentStatus !== null) {
                $updates[] = "payment_status = ?";
                $params[] = $paymentStatus;
                if ($paymentStatus === 'paid') {
                    $updates[] = "paid_amount = total_price";
                }
            }
            if (isset($data['paid_amount'])) {
                $updates[] = "paid_amount = ?";
                $params[] = floatval($data['paid_amount']);
            }
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

    public static function cancelWithRefund($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $refundType = $data['refund_type'] ?? 'none'; // 'none' | 'full' | 'partial'
        $refundAmount = floatval($data['refund_amount'] ?? 0);
        $refundReason = trim($data['refund_reason'] ?? 'Cancelamento a pedido do hóspede');
        $paymentMethod = $data['payment_method'] ?? 'pix';

        // Fetch reservation and accommodation details
        $stmtRes = $pdo->prepare("SELECT r.*, a.name_pt as accommodation_name FROM reservations r LEFT JOIN accommodations a ON r.accommodation_id = a.id WHERE r.id = ?");
        $stmtRes->execute([$id]);
        $res = $stmtRes->fetch();

        if (!$res) {
            http_response_code(404);
            echo json_encode(['error' => 'Reserva não encontrada']);
            return;
        }

        $totalPrice = floatval($res['total_price']);

        if ($refundType === 'full') {
            $refundAmount = $totalPrice;
        } else if ($refundType === 'none') {
            $refundAmount = 0;
        } else if ($refundType === 'partial') {
            if ($refundAmount <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Informe um valor válido para o reembolso parcial']);
                return;
            }
            if ($refundAmount > $totalPrice) {
                $refundAmount = $totalPrice;
            }
        }

        // 1. Update reservation status to cancelled and save refund info
        $stmtUpdate = $pdo->prepare("UPDATE reservations SET 
            status = 'cancelled', 
            payment_status = CASE WHEN ? > 0 THEN 'refunded' ELSE payment_status END,
            refund_amount = ?, 
            refund_reason = ?, 
            refund_date = ? 
            WHERE id = ?");
        $stmtUpdate->execute([
            $refundAmount,
            $refundAmount,
            $refundReason,
            date('Y-m-d'),
            $id
        ]);

        // 2. Cancel original income transactions if full refund, or keep partial
        // First check existing income transaction
        $stmtCheck = $pdo->prepare("SELECT * FROM financial_transactions WHERE reservation_id = ? AND type = 'income'");
        $stmtCheck->execute([$id]);
        $incomeTx = $stmtCheck->fetch();

        if ($incomeTx) {
            if ($refundType === 'full') {
                // If 100% refunded, we can either cancel the original income OR insert an explicit expense of refund
                // In accounting best practices, inserting an expense of category 'reembolso' keeps audit trails clear
                // Let's create an expense transaction for the refund
                $stmtExp = $pdo->prepare("INSERT INTO financial_transactions 
                    (reservation_id, accommodation_id, checkin_date, checkout_date, nights, type, category, amount, payment_method, transaction_date, description, status)
                    VALUES (?, ?, ?, ?, ?, 'expense', 'reembolso', ?, ?, ?, ?, 'completed')");
                $stmtExp->execute([
                    $id,
                    $res['accommodation_id'],
                    $res['check_in'],
                    $res['check_out'],
                    $incomeTx['nights'] ?? 0,
                    $refundAmount,
                    $paymentMethod,
                    date('Y-m-d'),
                    "Reembolso Total da Reserva #{$id} - {$res['guest_name']} ({$refundReason})"
                ]);
            } else if ($refundType === 'partial' && $refundAmount > 0) {
                // Insert expense transaction for the partial refund
                $stmtExp = $pdo->prepare("INSERT INTO financial_transactions 
                    (reservation_id, accommodation_id, checkin_date, checkout_date, nights, type, category, amount, payment_method, transaction_date, description, status)
                    VALUES (?, ?, ?, ?, ?, 'expense', 'reembolso', ?, ?, ?, ?, 'completed')");
                $stmtExp->execute([
                    $id,
                    $res['accommodation_id'],
                    $res['check_in'],
                    $res['check_out'],
                    $incomeTx['nights'] ?? 0,
                    $refundAmount,
                    $paymentMethod,
                    date('Y-m-d'),
                    "Reembolso Parcial da Reserva #{$id} - {$res['guest_name']} (R$ " . number_format($refundAmount, 2, ',', '.') . " de R$ " . number_format($totalPrice, 2, ',', '.') . ") - Motivo: {$refundReason}"
                ]);
            } else {
                // No refund: Mark reservation as cancelled, income remains or can be labelled as no-show fee
                // Keep income transaction as completed or retention fee
                $pdo->prepare("UPDATE financial_transactions SET description = description || ' (Cancelada sem reembolso / Taxa de retenção)' WHERE id = ?")->execute([$incomeTx['id']]);
            }
        } else if ($refundAmount > 0) {
            // Even if there wasn't a prior registered income, register the refund expense
            $stmtExp = $pdo->prepare("INSERT INTO financial_transactions 
                (reservation_id, accommodation_id, checkin_date, checkout_date, nights, type, category, amount, payment_method, transaction_date, description, status)
                VALUES (?, ?, ?, ?, ?, 'expense', 'reembolso', ?, ?, ?, ?, 'completed')");
            $stmtExp->execute([
                $id,
                $res['accommodation_id'],
                $res['check_in'],
                $res['check_out'],
                0,
                $refundAmount,
                $paymentMethod,
                date('Y-m-d'),
                "Reembolso Reserva #{$id} - {$res['guest_name']} ({$refundReason})"
            ]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Reserva cancelada com sucesso' . ($refundAmount > 0 ? " e reembolso de R$ " . number_format($refundAmount, 2, ',', '.') . " lançado no financeiro." : "."),
            'refund_amount' => $refundAmount
        ]);
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
