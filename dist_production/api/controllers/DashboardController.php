<?php
// backend/api/controllers/DashboardController.php

class DashboardController {

    public static function getOverview($pdo) {
        requireAuth($pdo);

        $currentMonth = date('Y-m');
        $selectedMonth = !empty($_GET['month']) ? $_GET['month'] : $currentMonth;
        $today = date('Y-m-d');
        $daysInMonth = (int)date('t', strtotime($selectedMonth . '-01'));

        // 1. FINANCIAL METRICS (Realized)
        $stmtInc = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
        $stmtInc->execute([$selectedMonth]);
        $monthIncome = floatval($stmtInc->fetchColumn());

        $stmtExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'expense' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
        $stmtExp->execute([$selectedMonth]);
        $monthExpense = floatval($stmtExp->fetchColumn());

        $monthBalance = $monthIncome - $monthExpense;
        $profitMargin = $monthIncome > 0 ? round(($monthBalance / $monthIncome) * 100, 1) : 0;

        // Previous month comparison
        $prevMonth = date('Y-m', strtotime($selectedMonth . '-01 -1 month'));
        $stmtPrevInc = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
        $stmtPrevInc->execute([$prevMonth]);
        $prevMonthIncome = floatval($stmtPrevInc->fetchColumn());

        $growthPercentage = $prevMonthIncome > 0 
            ? round((($monthIncome - $prevMonthIncome) / $prevMonthIncome) * 100, 1) 
            : ($monthIncome > 0 ? 100 : 0);

        // Historical all-time income
        $totalHistoricalIncome = floatval($pdo->query("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND status = 'completed'")->fetchColumn());

        // 2. ACCOMMODATIONS & ROOM RACK STATUS
        $stmtAcc = $pdo->query("
            SELECT a.id, a.slug, a.type, a.name_pt, a.base_price, a.max_guests, a.accepts_pets, a.is_active,
                (SELECT photo_url FROM accommodation_photos WHERE accommodation_id = a.id AND is_cover = 1 LIMIT 1) as cover_photo
            FROM accommodations a
            WHERE a.is_active = 1
            ORDER BY a.id ASC
        ");
        $accommodations = $stmtAcc->fetchAll();
        $totalRooms = count($accommodations);

        // Active reservations today (for room rack and reception status)
        $stmtTodayRes = $pdo->prepare("
            SELECT r.*, a.name_pt as accommodation_name 
            FROM reservations r
            LEFT JOIN accommodations a ON r.accommodation_id = a.id
            WHERE r.status != 'cancelled'
              AND (r.check_in <= ? AND r.check_out >= ?)
            ORDER BY r.check_in ASC
        ");
        $stmtTodayRes->execute([$today, $today]);
        $activeTodayRes = $stmtTodayRes->fetchAll();

        // Check-ins today
        $checkinsToday = [];
        // Check-outs today
        $checkoutsToday = [];
        // In-house guests currently staying
        $stayingToday = [];

        foreach ($activeTodayRes as $r) {
            if ($r['check_in'] === $today) {
                $checkinsToday[] = $r;
            }
            if ($r['check_out'] === $today) {
                $checkoutsToday[] = $r;
            }
            if ($r['check_in'] <= $today && $r['check_out'] > $today) {
                $stayingToday[] = $r;
            }
        }

        // Build Room Rack state for each accommodation
        $roomRack = [];
        $occupiedCountToday = 0;

        foreach ($accommodations as $acc) {
            $currentGuest = null;
            $status = 'vacant'; // vacant | occupied | checkin_today | checkout_today

            foreach ($activeTodayRes as $res) {
                if ((int)$res['accommodation_id'] === (int)$acc['id']) {
                    if ($res['check_in'] === $today) {
                        $status = 'checkin_today';
                        $currentGuest = $res;
                        $occupiedCountToday++;
                        break;
                    } elseif ($res['check_out'] === $today) {
                        $status = 'checkout_today';
                        $currentGuest = $res;
                        break;
                    } elseif ($res['check_in'] < $today && $res['check_out'] > $today) {
                        $status = 'occupied';
                        $currentGuest = $res;
                        $occupiedCountToday++;
                        break;
                    }
                }
            }

            $roomRack[] = [
                'id' => $acc['id'],
                'slug' => $acc['slug'],
                'type' => $acc['type'],
                'name' => $acc['name_pt'],
                'base_price' => (float)$acc['base_price'],
                'max_guests' => (int)$acc['max_guests'],
                'accepts_pets' => (bool)$acc['accepts_pets'],
                'cover_photo' => $acc['cover_photo'],
                'status' => $status,
                'current_guest' => $currentGuest ? [
                    'name' => $currentGuest['guest_name'],
                    'phone' => $currentGuest['guest_phone'],
                    'check_in' => $currentGuest['check_in'],
                    'check_out' => $currentGuest['check_out'],
                    'status' => $currentGuest['status']
                ] : null
            ];
        }

        $vacantCountToday = max(0, $totalRooms - $occupiedCountToday);

        // 3. HOSPITALITY KPIS (ADR & RevPAR & Monthly Occupancy)
        $monthStart = $selectedMonth . '-01';
        $monthEnd = date('Y-m-t', strtotime($monthStart));

        $stmtNights = $pdo->prepare("
            SELECT r.check_in, r.check_out, r.total_price
            FROM reservations r
            WHERE r.status IN ('confirmed', 'checked_in', 'checked_out')
              AND r.check_in <= ? AND r.check_out >= ?
        ");
        $stmtNights->execute([$monthEnd, $monthStart]);
        $monthReservations = $stmtNights->fetchAll();

        $totalNightsOccupied = 0;
        $totalLodgingRevenue = 0;

        foreach ($monthReservations as $mRes) {
            $cin = max(strtotime($monthStart), strtotime($mRes['check_in']));
            $cout = min(strtotime($monthEnd . ' +1 day'), strtotime($mRes['check_out']));
            $nights = max(0, round(($cout - $cin) / 86400));
            $totalNightsOccupied += $nights;
            $totalLodgingRevenue += floatval($mRes['total_price']);
        }

        $totalRoomCapacity = $totalRooms * $daysInMonth;
        $occupancyRate = $totalRoomCapacity > 0 ? round(($totalNightsOccupied / $totalRoomCapacity) * 100, 1) : 0;
        $adr = $totalNightsOccupied > 0 ? round($monthIncome / $totalNightsOccupied, 2) : 0;
        $revpar = $totalRoomCapacity > 0 ? round($monthIncome / $totalRoomCapacity, 2) : 0;

        // 4. CONCIERGE IA & LEADS (Marina)
        $stmtAi = $pdo->query("SELECT is_active, agent_name FROM ai_settings LIMIT 1");
        $aiRow = $stmtAi ? $stmtAi->fetch() : null;
        $aiActive = $aiRow ? (bool)$aiRow['is_active'] : true;
        $agentName = $aiRow['agent_name'] ?? 'Marina - Concierge Monte Alto';

        // Leads this month
        $stmtLeadsCount = $pdo->prepare("SELECT COUNT(*) FROM leads_capture WHERE strftime('%Y-%m', created_at) = ?");
        $stmtLeadsCount->execute([$selectedMonth]);
        $leadsCountMonth = (int)$stmtLeadsCount->fetchColumn();

        // Pending leads needing attention
        $stmtPendingLeads = $pdo->query("SELECT COUNT(*) FROM leads_capture WHERE status = 'new'");
        $pendingLeadsCount = (int)$stmtPendingLeads->fetchColumn();

        // Recent 4 leads
        $stmtRecentLeads = $pdo->query("
            SELECT l.*, a.name_pt as accommodation_name 
            FROM leads_capture l
            LEFT JOIN accommodations a ON l.accommodation_id = a.id
            ORDER BY l.created_at DESC
            LIMIT 4
        ");
        $recentLeads = $stmtRecentLeads->fetchAll();

        // 5. CHART DATA (Last 6 Months Income vs Expense)
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = date('Y-m', strtotime("-$i months"));
            $stmtIncChart = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
            $stmtIncChart->execute([$m]);
            $inc = floatval($stmtIncChart->fetchColumn());

            $stmtExpChart = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'expense' AND strftime('%Y-%m', transaction_date) = ? AND status = 'completed'");
            $stmtExpChart->execute([$m]);
            $exp = floatval($stmtExpChart->fetchColumn());

            $chartData[] = [
                'month' => $m,
                'month_label' => date('M/y', strtotime($m . '-01')),
                'income' => $inc,
                'expense' => $exp,
                'net' => $inc - $exp
            ];
        }

        // 6. RESERVATIONS OVERVIEW
        $stmtAllRes = $pdo->query("
            SELECT r.*, a.name_pt as accommodation_name, a.type as accommodation_type
            FROM reservations r
            LEFT JOIN accommodations a ON r.accommodation_id = a.id
            ORDER BY r.created_at DESC
        ");
        $allRes = $stmtAllRes->fetchAll();

        $pendingReservationsCount = 0;
        $confirmedCount = 0;
        foreach ($allRes as $r) {
            if ($r['status'] === 'pending') $pendingReservationsCount++;
            if ($r['status'] === 'confirmed') $confirmedCount++;
        }

        echo json_encode([
            'success' => true,
            'selected_month' => $selectedMonth,
            'today' => $today,
            'finance' => [
                'month_income' => $monthIncome,
                'month_expense' => $monthExpense,
                'month_balance' => $monthBalance,
                'profit_margin' => $profitMargin,
                'previous_month_income' => $prevMonthIncome,
                'growth_percentage' => $growthPercentage,
                'historical_total_income' => $totalHistoricalIncome,
                'adr' => $adr,
                'revpar' => $revpar,
                'occupancy_rate' => $occupancyRate
            ],
            'today_operations' => [
                'total_rooms' => $totalRooms,
                'occupied_today' => $occupiedCountToday,
                'vacant_today' => $vacantCountToday,
                'checkins_today' => $checkinsToday,
                'checkouts_today' => $checkoutsToday,
                'staying_today' => $stayingToday
            ],
            'room_rack' => $roomRack,
            'ai_concierge' => [
                'is_active' => $aiActive,
                'agent_name' => $agentName,
                'leads_month' => $leadsCountMonth,
                'pending_leads' => $pendingLeadsCount,
                'recent_leads' => $recentLeads
            ],
            'chart_data' => $chartData,
            'reservations' => [
                'total_count' => count($allRes),
                'pending_count' => $pendingReservationsCount,
                'confirmed_count' => $confirmedCount,
                'recent' => array_slice($allRes, 0, 6)
            ]
        ]);
    }
}