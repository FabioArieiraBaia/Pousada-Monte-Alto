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
        
        $sql = "SELECT f.*, r.guest_name 
                FROM financial_transactions f 
                LEFT JOIN reservations r ON f.reservation_id = r.id 
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
        
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'O valor deve ser maior que zero']);
            return;
        }
        
        $stmt = $pdo->prepare("INSERT INTO financial_transactions 
            (type, category, amount, payment_method, transaction_date, description, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)");
            
        $stmt->execute([$type, $category, $amount, $paymentMethod, $transactionDate, $description, $status]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Lançamento financeiro registrado com sucesso']);
    }

    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $pdo->prepare("DELETE FROM financial_transactions WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Lançamento excluído com sucesso']);
    }
}
