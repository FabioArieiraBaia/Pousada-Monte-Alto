<?php
// backend/api/controllers/ServiceFinanceController.php

require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ServiceFinanceController {

    /**
     * Financial summary for services/tours (separate from rooms)
     */
    public static function getSummary($pdo) {
        requireAuth($pdo);

        $currentMonth = date('Y-m');
        $selectedMonth = !empty($_GET['month']) ? $_GET['month'] : $currentMonth;

        // 1. Month Totals
        $stmtInc = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM service_financial_transactions WHERE type = 'income' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
        $stmtInc->execute([$selectedMonth]);
        $monthIncome = floatval($stmtInc->fetchColumn());

        $stmtExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM service_financial_transactions WHERE type = 'expense' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
        $stmtExp->execute([$selectedMonth]);
        $monthExpense = floatval($stmtExp->fetchColumn());

        $monthNetProfit = $monthIncome - $monthExpense;
        $profitMargin = $monthIncome > 0 ? round(($monthNetProfit / $monthIncome) * 100, 1) : 0;

        // 2. All-Time Totals
        $totalIncome = floatval($pdo->query("SELECT COALESCE(SUM(amount), 0) FROM service_financial_transactions WHERE type = 'income' AND status = 'completed'")->fetchColumn());
        $totalExpense = floatval($pdo->query("SELECT COALESCE(SUM(amount), 0) FROM service_financial_transactions WHERE type = 'expense' AND status = 'completed'")->fetchColumn());
        $totalNetProfit = $totalIncome - $totalExpense;

        // 3. Last 6 Months Chart Data
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = date('Y-m', strtotime("-$i months"));
            $stmtMInc = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM service_financial_transactions WHERE type = 'income' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
            $stmtMInc->execute([$m]);
            $inc = floatval($stmtMInc->fetchColumn());

            $stmtMExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM service_financial_transactions WHERE type = 'expense' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
            $stmtMExp->execute([$m]);
            $exp = floatval($stmtMExp->fetchColumn());

            $chartData[] = [
                'month' => $m,
                'month_label' => date('M/y', strtotime($m . '-01')),
                'income' => $inc,
                'expense' => $exp,
                'net' => $inc - $exp
            ];
        }

        // 4. Categories breakdown
        $stmtCat = $pdo->prepare("SELECT category, type, SUM(amount) as total FROM service_financial_transactions WHERE strftime('%Y-%m', transaction_date) = ? AND status = 'completed' GROUP BY category, type");
        $stmtCat->execute([$selectedMonth]);
        $categoriesBreakdown = $stmtCat->fetchAll(PDO::FETCH_ASSOC);

        // 5. Breakdown by Service
        $stmtByService = $pdo->prepare("
            SELECT s.id, s.name_pt, s.category,
                   COALESCE(SUM(t.amount), 0) as total_revenue,
                   COUNT(t.id) as transaction_count
            FROM services s
            LEFT JOIN service_financial_transactions t ON (
                t.service_id = s.id AND t.type = 'income' AND t.status = 'completed' AND strftime('%Y-%m', t.transaction_date) = ?
            )
            GROUP BY s.id
            ORDER BY total_revenue DESC
        ");
        $stmtByService->execute([$selectedMonth]);
        $servicesBreakdown = $stmtByService->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'summary' => [
                'selected_month' => $selectedMonth,
                'month_income' => $monthIncome,
                'month_expense' => $monthExpense,
                'month_net_profit' => $monthNetProfit,
                'profit_margin' => $profitMargin,
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'total_net_profit' => $totalNetProfit,
                'chart_data' => $chartData,
                'categories' => $categoriesBreakdown,
                'by_service' => $servicesBreakdown
            ]
        ]);
    }

    /**
     * Get transactions list
     */
    public static function getTransactions($pdo) {
        requireAuth($pdo);

        $type = $_GET['type'] ?? null;
        $month = $_GET['month'] ?? null;
        $category = $_GET['category'] ?? null;

        $sql = "SELECT t.*, b.customer_name, b.participants_count, s.name_pt as service_name, s.partner_name
                FROM service_financial_transactions t
                LEFT JOIN service_bookings b ON t.service_booking_id = b.id
                LEFT JOIN services s ON (t.service_id = s.id OR b.service_id = s.id)
                WHERE 1=1";
        $params = [];

        if ($type) {
            $sql .= " AND t.type = ?";
            $params[] = $type;
        }
        if ($month) {
            $sql .= " AND strftime('%Y-%m', t.transaction_date) = ?";
            $params[] = $month;
        }
        if ($category) {
            $sql .= " AND t.category = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY t.transaction_date DESC, t.id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($transactions as &$tx) {
            $tx['amount'] = (float)$tx['amount'];
        }

        echo json_encode(['success' => true, 'data' => $transactions]);
    }

    /**
     * Create manual financial transaction
     */
    public static function createTransaction($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $amount = floatval($data['amount'] ?? 0);
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'O valor deve ser maior que zero']);
            return;
        }

        $stmt = $pdo->prepare("INSERT INTO service_financial_transactions (
            service_booking_id, service_id, type, category, amount, payment_method,
            transaction_date, description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            !empty($data['service_booking_id']) ? intval($data['service_booking_id']) : null,
            !empty($data['service_id']) ? intval($data['service_id']) : null,
            $data['type'] ?? 'income',
            $data['category'] ?? 'outros',
            $amount,
            $data['payment_method'] ?? 'pix',
            $data['transaction_date'] ?? date('Y-m-d'),
            trim($data['description'] ?? ''),
            $data['status'] ?? 'completed'
        ]);

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Lançamento financeiro de serviço registrado!']);
    }

    /**
     * Delete transaction
     */
    public static function deleteTransaction($pdo, $id) {
        requireAuth($pdo);
        $pdo->prepare("DELETE FROM service_financial_transactions WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Lançamento excluído com sucesso!']);
    }

    /**
     * Export CSV of service transactions
     */
    public static function exportCsv($pdo) {
        requireAuth($pdo);
        $month = $_GET['month'] ?? null;

        $sql = "SELECT t.id, t.transaction_date, t.type, t.category, t.amount, t.payment_method, t.description,
                       b.customer_name, s.name_pt as service_name, s.partner_name
                FROM service_financial_transactions t
                LEFT JOIN service_bookings b ON t.service_booking_id = b.id
                LEFT JOIN services s ON (t.service_id = s.id OR b.service_id = s.id)
                WHERE t.status = 'completed'";
        $params = [];

        if ($month) {
            $sql .= " AND strftime('%Y-%m', t.transaction_date) = ?";
            $params[] = $month;
        }
        $sql .= " ORDER BY t.transaction_date ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="financeiro_servicos_' . ($month ?: 'completo') . '.csv"');

        $out = fopen('php://output', 'w');
        fputs($out, "\xEF\xBB\xBF"); // UTF-8 BOM
        fputcsv($out, ['ID', 'Data', 'Tipo', 'Categoria', 'Valor (R$)', 'Forma de Pagamento', 'Cliente', 'Serviço', 'Parceiro', 'Descrição'], ';');

        foreach ($rows as $r) {
            fputcsv($out, [
                $r['id'],
                $r['transaction_date'],
                $r['type'] === 'income' ? 'Receita' : 'Despesa/Repasse',
                $r['category'],
                number_format($r['amount'], 2, ',', '.'),
                $r['payment_method'],
                $r['customer_name'] ?? '',
                $r['service_name'] ?? '',
                $r['partner_name'] ?? '',
                $r['description']
            ], ';');
        }

        fclose($out);
        exit();
    }
}
