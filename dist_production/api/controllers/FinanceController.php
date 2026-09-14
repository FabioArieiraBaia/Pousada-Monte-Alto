<?php
// backend/api/controllers/FinanceController.php

class FinanceController {

    public static function getSummary($pdo) {
        requireAuth($pdo);
        
        $currentMonth = date('Y-m');
        $selectedMonth = $_GET['month'] ?? $currentMonth;
        
        // Month totals
        $stmtMonthIncome = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
        $stmtMonthIncome->execute([$selectedMonth]);
        $monthIncome = floatval($stmtMonthIncome->fetchColumn());
        
        $stmtMonthExpense = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'expense' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
        $stmtMonthExpense->execute([$selectedMonth]);
        $monthExpense = floatval($stmtMonthExpense->fetchColumn());
        
        $monthBalance = $monthIncome - $monthExpense;
        
        // All time totals
        $totalIncome = floatval($pdo->query("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND status = 'completed'")->fetchColumn());
        $totalExpense = floatval($pdo->query("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'expense' AND status = 'completed'")->fetchColumn());
        $totalBalance = $totalIncome - $totalExpense;
        
        // Monthly breakdown for last 6 months (for chart)
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = date('Y-m', strtotime("-$i months"));
            $stmtInc = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
            $stmtInc->execute([$m]);
            $inc = floatval($stmtInc->fetchColumn());
            
            $stmtExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'expense' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
            $stmtExp->execute([$m]);
            $exp = floatval($stmtExp->fetchColumn());
            
            $chartData[] = [
                'month' => $m,
                'month_label' => date('M/y', strtotime($m . '-01')),
                'income' => $inc,
                'expense' => $exp,
                'net' => $inc - $exp
            ];
        }
        
        // Categories breakdown
        $stmtCat = $pdo->prepare("SELECT category, type, SUM(amount) as total FROM financial_transactions WHERE strftime('%Y-%m', transaction_date) = ? GROUP BY category, type");
        $stmtCat->execute([$selectedMonth]);
        $categoriesBreakdown = $stmtCat->fetchAll();
        
        echo json_encode([
            'success' => true,
            'summary' => [
                'selected_month' => $selectedMonth,
                'month_income' => $monthIncome,
                'month_expense' => $monthExpense,
                'month_balance' => $monthBalance,
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'total_balance' => $totalBalance,
                'chart_data' => $chartData,
                'categories' => $categoriesBreakdown
            ]
        ]);
    }

    public static function getAll($pdo) {
        requireAuth($pdo);
        
        $type = $_GET['type'] ?? null;
        $month = $_GET['month'] ?? null;
        
        $sql = "SELECT f.*, r.guest_name, COALESCE(a.name_pt, ar.name_pt) as accommodation_name, COALESCE(a.type, ar.type) as accommodation_type
                FROM financial_transactions f 
                LEFT JOIN reservations r ON f.reservation_id = r.id 
                LEFT JOIN accommodations a ON f.accommodation_id = a.id
                LEFT JOIN accommodations ar ON r.accommodation_id = ar.id
                WHERE 1=1";
        $params = [];
        
        if ($type) {
            $sql .= " AND f.type = ?";
            $params[] = $type;
        }
        if ($month) {
            $sql .= " AND strftime('%Y-%m', f.transaction_date) = ?";
            $params[] = $month;
        }
        
        $sql .= " ORDER BY f.transaction_date DESC, f.id DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $transactions = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $transactions]);
    }

    public static function create($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $type = $data['type'] ?? 'income';
        $category = $data['category'] ?? 'outros';
        $amount = floatval($data['amount'] ?? 0);
        $paymentMethod = $data['payment_method'] ?? 'pix';
        $transactionDate = $data['transaction_date'] ?? date('Y-m-d');
        $description = trim($data['description'] ?? '');
        $status = $data['status'] ?? 'completed';

        $accommodationId = !empty($data['accommodation_id']) ? intval($data['accommodation_id']) : null;
        $checkinDate = !empty($data['checkin_date']) ? $data['checkin_date'] : null;
        $checkoutDate = !empty($data['checkout_date']) ? $data['checkout_date'] : null;
        $nights = !empty($data['nights']) ? intval($data['nights']) : null;
        $reservationId = !empty($data['reservation_id']) ? intval($data['reservation_id']) : null;
        
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'O valor deve ser maior que zero']);
            return;
        }
        
        $stmt = $pdo->prepare("INSERT INTO financial_transactions 
            (reservation_id, accommodation_id, checkin_date, checkout_date, nights, type, category, amount, payment_method, transaction_date, description, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
        $stmt->execute([
            $reservationId, $accommodationId, $checkinDate, $checkoutDate, $nights,
            $type, $category, $amount, $paymentMethod, $transactionDate, $description, $status
        ]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Lançamento financeiro registrado com sucesso']);
    }

    // Method Aliases for backward/forward compatibility
    public static function getTransactions($pdo) {
        self::getAll($pdo);
    }

    public static function createTransaction($pdo) {
        self::create($pdo);
    }

    public static function deleteTransaction($pdo, $id) {
        self::delete($pdo, $id);
    }

    /**
     * Hospitality Financial KPIs: RevPAR, ADR, Occupancy %, Growth %, Profit Margin %
     */
    public static function getKpis($pdo) {
        requireAuth($pdo);

        $currentMonth = date('Y-m');
        $selectedMonth = $_GET['month'] ?? $currentMonth;
        $daysInMonth = (int)date('t', strtotime($selectedMonth . '-01'));

        // 1. Current Month Realized Income & Expense
        $stmtInc = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
        $stmtInc->execute([$selectedMonth]);
        $monthIncome = floatval($stmtInc->fetchColumn());

        $stmtExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'expense' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
        $stmtExp->execute([$selectedMonth]);
        $monthExpense = floatval($stmtExp->fetchColumn());

        $monthBalance = $monthIncome - $monthExpense;
        $profitMargin = $monthIncome > 0 ? round(($monthBalance / $monthIncome) * 100, 1) : 0;

        // 2. Previous Month for Growth Comparison
        $prevMonth = date('Y-m', strtotime($selectedMonth . '-01 -1 month'));
        $stmtPrevInc = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
        $stmtPrevInc->execute([$prevMonth]);
        $prevIncome = floatval($stmtPrevInc->fetchColumn());

        $incomeGrowth = $prevIncome > 0 ? round((($monthIncome - $prevIncome) / $prevIncome) * 100, 1) : 0;

        // 3. Total active rooms
        $totalRooms = (int)$pdo->query("SELECT COUNT(*) FROM accommodations WHERE is_active = 1")->fetchColumn();
        if ($totalRooms <= 0) $totalRooms = 4;
        $totalAvailableNights = $totalRooms * $daysInMonth;

        // 4. Occupied Nights in month (from transactions or reservations)
        $stmtNights = $pdo->prepare("
            SELECT COALESCE(SUM(nights), 0) FROM financial_transactions 
            WHERE type = 'income' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'
        ");
        $stmtNights->execute([$selectedMonth]);
        $occupiedNights = (int)$stmtNights->fetchColumn();

        if ($occupiedNights <= 0) {
            $stmtResNights = $pdo->prepare("
                SELECT COALESCE(SUM(ROUND((JULIANDAY(check_out) - JULIANDAY(check_in)))), 0) 
                FROM reservations 
                WHERE status IN ('confirmed', 'checked_in', 'completed') 
                AND strftime('%Y-%m', check_in) = ?
            ");
            $stmtResNights->execute([$selectedMonth]);
            $occupiedNights = (int)$stmtResNights->fetchColumn();
        }

        // 5. Hospitality Metrics: ADR, RevPAR, Occupancy %
        $occupancyRate = $totalAvailableNights > 0 ? round(($occupiedNights / $totalAvailableNights) * 100, 1) : 0;
        $adr = $occupiedNights > 0 ? round($monthIncome / $occupiedNights, 2) : 0;
        $revpar = $totalAvailableNights > 0 ? round($monthIncome / $totalAvailableNights, 2) : 0;

        // 6. Projected Receivables (Confirmed reservations in this month not yet settled)
        $stmtProj = $pdo->prepare("
            SELECT COALESCE(SUM(total_price), 0) FROM reservations 
            WHERE status = 'confirmed' AND payment_status != 'paid' 
            AND strftime('%Y-%m', check_in) = ?
        ");
        $stmtProj->execute([$selectedMonth]);
        $projectedIncome = floatval($stmtProj->fetchColumn());
        $totalForecast = $monthIncome + $projectedIncome;

        echo json_encode([
            'success' => true,
            'kpis' => [
                'selected_month' => $selectedMonth,
                'month_income' => $monthIncome,
                'month_expense' => $monthExpense,
                'month_balance' => $monthBalance,
                'profit_margin' => $profitMargin,
                'projected_income' => $projectedIncome,
                'total_forecast' => $totalForecast,
                'income_growth' => $incomeGrowth,
                'total_rooms' => $totalRooms,
                'days_in_month' => $daysInMonth,
                'total_available_nights' => $totalAvailableNights,
                'occupied_nights' => $occupiedNights,
                'occupancy_rate' => $occupancyRate,
                'adr' => $adr,
                'revpar' => $revpar
            ]
        ]);
    }

    /**
     * Revenue breakdown by Accommodation
     */
    public static function getByAccommodation($pdo) {
        requireAuth($pdo);
        $selectedMonth = $_GET['month'] ?? date('Y-m');

        $stmt = $pdo->prepare("
            SELECT 
                a.id, a.name_pt, a.type, a.base_price,
                COALESCE(SUM(f.amount), 0) as total_revenue,
                COALESCE(SUM(f.nights), 0) as total_nights,
                COUNT(f.id) as transaction_count
            FROM accommodations a
            LEFT JOIN financial_transactions f ON (
                f.accommodation_id = a.id 
                AND f.type = 'income' 
                AND f.status = 'completed'
                AND strftime('%Y-%m', f.transaction_date) = ?
            )
            GROUP BY a.id
            ORDER BY total_revenue DESC
        ");
        $stmt->execute([$selectedMonth]);
        $rooms = $stmt->fetchAll();

        echo json_encode(['success' => true, 'data' => $rooms]);
    }

    /**
     * Future Accounts Receivable from upcoming reservations
     */
    public static function getReceivables($pdo) {
        requireAuth($pdo);

        $stmt = $pdo->query("
            SELECT r.*, a.name_pt as accommodation_name, a.type as accommodation_type,
                   ROUND((JULIANDAY(r.check_out) - JULIANDAY(r.check_in))) as nights
            FROM reservations r
            LEFT JOIN accommodations a ON r.accommodation_id = a.id
            WHERE r.status IN ('confirmed', 'pending') 
              AND r.check_in >= DATE('now')
            ORDER BY r.check_in ASC
            LIMIT 30
        ");
        $receivables = $stmt->fetchAll();

        echo json_encode(['success' => true, 'data' => $receivables]);
    }

    /**
     * Export Transactions as CSV
     */
    public static function exportCsv($pdo) {
        requireAuth($pdo);
        $month = $_GET['month'] ?? null;

        $sql = "SELECT f.*, r.guest_name, COALESCE(a.name_pt, ar.name_pt) as accommodation_name
                FROM financial_transactions f 
                LEFT JOIN reservations r ON f.reservation_id = r.id 
                LEFT JOIN accommodations a ON f.accommodation_id = a.id
                LEFT JOIN accommodations ar ON r.accommodation_id = ar.id
                WHERE 1=1";
        $params = [];
        if ($month) {
            $sql .= " AND strftime('%Y-%m', f.transaction_date) = ?";
            $params[] = $month;
        }
        $sql .= " ORDER BY f.transaction_date DESC, f.id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="financeiro_monte_alto_' . ($month ?: 'completo') . '.csv"');

        // UTF-8 BOM for Excel compatibility
        echo "\xEF\xBB\xBF";

        $out = fopen('php://output', 'w');
        fputcsv($out, ['ID', 'Data', 'Tipo', 'Categoria', 'Descricao', 'Acomodacao', 'Forma de Pagamento', 'Valor (R$)', 'Status'], ';');

        foreach ($rows as $r) {
            fputcsv($out, [
                $r['id'],
                $r['transaction_date'],
                $r['type'] === 'income' ? 'Receita' : 'Despesa',
                $r['category'],
                $r['description'] ?: ($r['guest_name'] ? "Reserva - " . $r['guest_name'] : 'Lançamento'),
                $r['accommodation_name'] ?? '-',
                strtoupper($r['payment_method'] ?? 'PIX'),
                number_format($r['amount'], 2, ',', '.'),
                $r['status']
            ], ';');
        }
        fclose($out);
        exit();
    }
}
