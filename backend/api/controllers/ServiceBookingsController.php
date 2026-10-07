<?php
// backend/api/controllers/ServiceBookingsController.php

require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../services_lib/NotificationService.php';

class ServiceBookingsController {

    /**
     * List all service bookings (admin)
     */
    public static function getAll($pdo) {
        requireAuth($pdo);

        $month = $_GET['month'] ?? null;
        $status = $_GET['status'] ?? null;
        $serviceId = !empty($_GET['service_id']) ? intval($_GET['service_id']) : null;

        $sql = "SELECT b.*, s.name_pt as service_name, s.category as service_category, s.cover_photo as service_photo, s.partner_name,
                (SELECT COUNT(*) FROM service_financial_transactions WHERE service_booking_id = b.id AND status = 'completed') as is_in_finance
                FROM service_bookings b
                JOIN services s ON b.service_id = s.id
                WHERE 1=1";
        $params = [];

        if ($month) {
            $sql .= " AND strftime('%Y-%m', b.service_date) = ?";
            $params[] = $month;
        }
        if ($status && $status !== 'all') {
            $sql .= " AND b.status = ?";
            $params[] = $status;
        }
        if ($serviceId) {
            $sql .= " AND b.service_id = ?";
            $params[] = $serviceId;
        }

        $sql .= " ORDER BY b.service_date DESC, b.id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($bookings as &$b) {
            $b['participants_count'] = (int)$b['participants_count'];
            $b['unit_price'] = (float)$b['unit_price'];
            $b['total_price'] = (float)$b['total_price'];
            $b['pousada_commission'] = (float)$b['pousada_commission'];
            $b['partner_cost'] = (float)$b['partner_cost'];
        }

        echo json_encode(['success' => true, 'data' => $bookings]);
    }

    /**
     * Public booking request from website visitor
     */
    public static function createPublic($pdo) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $serviceId = intval($data['service_id'] ?? 0);
        $customerName = trim($data['customer_name'] ?? '');
        $customerPhone = trim($data['customer_phone'] ?? '');
        $customerEmail = trim($data['customer_email'] ?? '');
        $serviceDate = $data['service_date'] ?? '';
        $serviceTime = $data['service_time'] ?? '09:00';
        $participantsCount = max(1, intval($data['participants_count'] ?? 1));
        $notes = trim($data['notes'] ?? '');

        if (!$serviceId || !$customerName || !$customerPhone || !$serviceDate) {
            http_response_code(400);
            echo json_encode(['error' => 'Por favor preencha nome, telefone, data e selecione o serviço.']);
            return;
        }

        // Fetch service details
        $stmtS = $pdo->prepare("SELECT * FROM services WHERE id = ? AND is_active = 1");
        $stmtS->execute([$serviceId]);
        $service = $stmtS->fetch(PDO::FETCH_ASSOC);

        if (!$service) {
            http_response_code(404);
            echo json_encode(['error' => 'Serviço/Passeio indisponível ou não encontrado.']);
            return;
        }

        $unitPrice = (float)$service['price_per_person'];
        $totalPrice = $unitPrice * $participantsCount;
        $commPct = (float)$service['partner_commission_pct'];
        $pousadaCommission = round($totalPrice * ($commPct / 100), 2);
        $partnerCost = $totalPrice - $pousadaCommission;

        $stmt = $pdo->prepare("INSERT INTO service_bookings (
            service_id, customer_name, customer_phone, customer_email,
            service_date, service_time, participants_count, unit_price, total_price,
            pousada_commission, partner_cost, status, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?)");

        $stmt->execute([
            $serviceId, $customerName, $customerPhone, $customerEmail,
            $serviceDate, $serviceTime, $participantsCount, $unitPrice, $totalPrice,
            $pousadaCommission, $partnerCost, $notes
        ]);

        $bookingId = $pdo->lastInsertId();

        // Build WhatsApp URL
        $stmtSetting = $pdo->query("SELECT setting_value FROM site_settings WHERE setting_key = 'whatsapp'");
        $pousadaWhatsApp = $stmtSetting->fetchColumn() ?: '5521969493569';

        $formattedDate = date('d/m/Y', strtotime($serviceDate));
        $msg = "Olá! Gostaria de reservar o passeio *{$service['name_pt']}* na *Pousada Monte Alto*:\n\n" .
               "📅 *Data desejada:* {$formattedDate} às {$serviceTime}\n" .
               "👥 *Participantes:* {$participantsCount} pessoa(s)\n" .
               "💰 *Valor estimado:* R$ " . number_format($totalPrice, 2, ',', '.') . "\n" .
               "👤 *Nome:* {$customerName}\n" .
               "📱 *Telefone:* {$customerPhone}\n" .
               ($notes ? "📝 *Obs:* {$notes}\n" : "") .
               "🔖 *Cód. do Passeio:* #S{$bookingId}";

        $whatsappUrl = "https://wa.me/{$pousadaWhatsApp}?text=" . rawurlencode($msg);

        // Notify Admin via Push and WhatsApp
        try {
            NotificationService::notifyNewLead($pdo, [
                'guest_name' => $customerName,
                'guest_phone' => $customerPhone,
                'guest_email' => $customerEmail,
                'accommodation_name' => 'Passeio: ' . $service['name_pt'],
                'check_in' => $serviceDate . ' às ' . $serviceTime,
                'check_out' => $serviceDate,
                'adults_count' => $participantsCount,
                'has_pets' => 0,
                'total_price' => $totalPrice,
                'source' => 'Reserva de Passeio/Serviço no Site',
                'notes' => $notes
            ]);
        } catch (Exception $e) {
            error_log("Erro ao disparar notificações de agendamento de serviço: " . $e->getMessage());
        }

        echo json_encode([
            'success' => true,
            'id' => $bookingId,
            'total_price' => $totalPrice,
            'whatsapp_url' => $whatsappUrl,
            'message' => 'Solicitação de agendamento realizada com sucesso! Entraremos em contato para confirmar sua vaga.'
        ]);
    }

    /**
     * Admin creates booking manually
     */
    public static function createAdmin($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $serviceId = intval($data['service_id'] ?? 0);
        $stmtS = $pdo->prepare("SELECT * FROM services WHERE id = ?");
        $stmtS->execute([$serviceId]);
        $service = $stmtS->fetch(PDO::FETCH_ASSOC);

        if (!$service) {
            http_response_code(404);
            echo json_encode(['error' => 'Serviço não encontrado']);
            return;
        }

        $participants = max(1, intval($data['participants_count'] ?? 1));
        $unitPrice = isset($data['unit_price']) ? floatval($data['unit_price']) : (float)$service['price_per_person'];
        $totalPrice = isset($data['total_price']) ? floatval($data['total_price']) : ($unitPrice * $participants);

        $commPct = (float)$service['partner_commission_pct'];
        $pousadaCommission = isset($data['pousada_commission']) ? floatval($data['pousada_commission']) : round($totalPrice * ($commPct / 100), 2);
        $partnerCost = isset($data['partner_cost']) ? floatval($data['partner_cost']) : ($totalPrice - $pousadaCommission);

        $status = $data['status'] ?? 'confirmed';
        $paymentStatus = $data['payment_status'] ?? 'paid';

        $stmt = $pdo->prepare("INSERT INTO service_bookings (
            service_id, customer_name, customer_phone, customer_email,
            service_date, service_time, participants_count, unit_price, total_price,
            pousada_commission, partner_cost, status, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $serviceId,
            $data['customer_name'] ?? 'Cliente',
            $data['customer_phone'] ?? '',
            $data['customer_email'] ?? '',
            $data['service_date'] ?? date('Y-m-d'),
            $data['service_time'] ?? '09:00',
            $participants,
            $unitPrice,
            $totalPrice,
            $pousadaCommission,
            $partnerCost,
            $status,
            $paymentStatus,
            $data['notes'] ?? ''
        ]);

        $bookingId = $pdo->lastInsertId();

        // Auto-create transactions in service_financial_transactions if paid
        if ($paymentStatus === 'paid' || in_array($status, ['confirmed', 'completed'])) {
            $date = $data['service_date'] ?? date('Y-m-d');
            $payMethod = $data['payment_method'] ?? 'pix';

            // 1. Income: total booking revenue
            $stmtInc = $pdo->prepare("INSERT INTO service_financial_transactions (
                service_booking_id, service_id, type, category, amount, payment_method,
                transaction_date, description, status
            ) VALUES (?, ?, 'income', 'reserva_servico', ?, ?, ?, ?, 'completed')");
            $stmtInc->execute([
                $bookingId, $serviceId, $totalPrice, $payMethod, $date,
                "Reserva #S{$bookingId} - {$data['customer_name']} ({$participants}x {$service['name_pt']})"
            ]);

            // 2. Expense: partner payout (if partner cost > 0)
            if ($partnerCost > 0) {
                $stmtExp = $pdo->prepare("INSERT INTO service_financial_transactions (
                    service_booking_id, service_id, type, category, amount, payment_method,
                    transaction_date, description, status
                ) VALUES (?, ?, 'expense', 'repasse_parceiro', ?, ?, ?, ?, 'completed')");
                $stmtExp->execute([
                    $bookingId, $serviceId, $partnerCost, $payMethod, $date,
                    "Repasse Parceiro ({$service['partner_name']}) - Reserva #S{$bookingId} ({$data['customer_name']})"
                ]);
            }
        }

        echo json_encode(['success' => true, 'id' => $bookingId, 'message' => 'Agendamento cadastrado com sucesso!']);
    }

    /**
     * Update booking status & payment status with financial sync (admin)
     */
    public static function updateStatus($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $stmtB = $pdo->prepare("SELECT b.*, s.name_pt as service_name, s.partner_name FROM service_bookings b JOIN services s ON b.service_id = s.id WHERE b.id = ?");
        $stmtB->execute([$id]);
        $booking = $stmtB->fetch(PDO::FETCH_ASSOC);

        if (!$booking) {
            http_response_code(404);
            echo json_encode(['error' => 'Agendamento não encontrado']);
            return;
        }

        $status = $data['status'] ?? $booking['status'];
        $paymentStatus = $data['payment_status'] ?? $booking['payment_status'];
        $notes = isset($data['notes']) ? $data['notes'] : $booking['notes'];

        $stmtUp = $pdo->prepare("UPDATE service_bookings SET status = ?, payment_status = ?, notes = ? WHERE id = ?");
        $stmtUp->execute([$status, $paymentStatus, $notes, $id]);

        // Financial sync
        if ($paymentStatus === 'paid' || in_array($status, ['confirmed', 'completed'])) {
            $stmtCheck = $pdo->prepare("SELECT id FROM service_financial_transactions WHERE service_booking_id = ? AND type = 'income'");
            $stmtCheck->execute([$id]);
            $hasIncome = $stmtCheck->fetch();

            if (!$hasIncome) {
                $payMethod = $data['payment_method'] ?? 'pix';
                $date = $booking['service_date'] ?: date('Y-m-d');

                // Income
                $stmtInc = $pdo->prepare("INSERT INTO service_financial_transactions (
                    service_booking_id, service_id, type, category, amount, payment_method,
                    transaction_date, description, status
                ) VALUES (?, ?, 'income', 'reserva_servico', ?, ?, ?, ?, 'completed')");
                $stmtInc->execute([
                    $id, $booking['service_id'], $booking['total_price'], $payMethod, $date,
                    "Reserva #S{$id} - {$booking['customer_name']} ({$booking['participants_count']}x {$booking['service_name']})"
                ]);

                // Partner payout
                if ($booking['partner_cost'] > 0) {
                    $stmtExp = $pdo->prepare("INSERT INTO service_financial_transactions (
                        service_booking_id, service_id, type, category, amount, payment_method,
                        transaction_date, description, status
                    ) VALUES (?, ?, 'expense', 'repasse_parceiro', ?, ?, ?, ?, 'completed')");
                    $stmtExp->execute([
                        $id, $booking['service_id'], $booking['partner_cost'], $payMethod, $date,
                        "Repasse Parceiro ({$booking['partner_name']}) - Reserva #S{$id} ({$booking['customer_name']})"
                    ]);
                }
            }
        } elseif ($status === 'cancelled') {
            $pdo->prepare("UPDATE service_financial_transactions SET status = 'cancelled' WHERE service_booking_id = ?")->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Status do agendamento atualizado com sucesso!']);
    }

    /**
     * Cancel booking with optional refund
     */
    public static function cancel($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $refundAmount = floatval($data['refund_amount'] ?? 0);
        $reason = trim($data['refund_reason'] ?? 'Cancelamento a pedido do cliente');

        $pdo->prepare("UPDATE service_bookings SET status = 'cancelled', payment_status = CASE WHEN ? > 0 THEN 'refunded' ELSE payment_status END WHERE id = ?")->execute([$refundAmount, $id]);
        $pdo->prepare("UPDATE service_financial_transactions SET status = 'cancelled' WHERE service_booking_id = ?")->execute([$id]);

        if ($refundAmount > 0) {
            $stmtRes = $pdo->prepare("SELECT b.*, s.name_pt FROM service_bookings b JOIN services s ON b.service_id = s.id WHERE b.id = ?");
            $stmtRes->execute([$id]);
            $b = $stmtRes->fetch(PDO::FETCH_ASSOC);

            $stmtExp = $pdo->prepare("INSERT INTO service_financial_transactions (
                service_booking_id, service_id, type, category, amount, payment_method,
                transaction_date, description, status
            ) VALUES (?, ?, 'expense', 'reembolso', ?, 'pix', ?, ?, 'completed')");
            $stmtExp->execute([
                $id, $b['service_id'], $refundAmount, date('Y-m-d'),
                "Reembolso de Passeio #S{$id} - {$b['customer_name']} ({$reason})"
            ]);
        }

        echo json_encode(['success' => true, 'message' => 'Agendamento cancelado com sucesso.']);
    }

    /**
     * Delete booking (admin)
     */
    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $pdo->prepare("DELETE FROM service_financial_transactions WHERE service_booking_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM service_bookings WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Agendamento excluído com sucesso!']);
    }

    /**
     * Get direct WhatsApp contact link for guest
     */
    public static function getWhatsAppLink($pdo, $id) {
        requireAuth($pdo);
        $stmt = $pdo->prepare("SELECT b.*, s.name_pt as service_name, s.duration_label FROM service_bookings b JOIN services s ON b.service_id = s.id WHERE b.id = ?");
        $stmt->execute([$id]);
        $b = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$b) {
            http_response_code(404);
            echo json_encode(['error' => 'Agendamento não encontrado']);
            return;
        }

        $phone = preg_replace('/[^0-9]/', '', $b['customer_phone']);
        if (strlen($phone) <= 11 && !str_starts_with($phone, '55')) {
            $phone = '55' . $phone;
        }

        $formattedDate = date('d/m/Y', strtotime($b['service_date']));
        $msg = "Olá *{$b['customer_name']}*! Aqui é da *Pousada Monte Alto* em Arraial do Cabo.\n\n" .
               "Estamos entrando em contato sobre o seu agendamento para o passeio *{$b['service_name']}*:\n" .
               "📅 *Data:* {$formattedDate} às {$b['service_time']}\n" .
               "👥 *Participantes:* {$b['participants_count']} pessoa(s)\n" .
               "⏱️ *Duração estimada:* {$b['duration_label']}\n" .
               "💰 *Valor Total:* R$ " . number_format($b['total_price'], 2, ',', '.') . "\n" .
               "📌 *Status:* " . ($b['status'] === 'confirmed' ? '✅ Confirmado' : '⏳ Em análise') . "\n\n" .
               "Qualquer dúvida sobre o ponto de encontro ou preparativos para o passeio, estamos à disposição!";

        $url = "https://wa.me/{$phone}?text=" . rawurlencode($msg);
        echo json_encode(['success' => true, 'whatsapp_url' => $url, 'phone' => $phone]);
    }
}
