<?php
// backend/api/services/StayRuleService.php

class StayRuleService {

    /**
     * Centralized rule validator for stay length, weekend minimums, and special packages.
     *
     * Rules:
     * 1. If an active package covers the stay period, the package rules apply:
     *    - min_nights configured for the room in that package
     *    - special package price_per_night
     * 2. If no active package:
     *    - Loft: minimum 2 nights ALWAYS (weekdays and weekends).
     *    - Suites: minimum 2 nights on weekends (if stay includes Friday or Saturday night).
     *    - Suites: 1 night allowed on pure weekdays (Sunday to Thursday nights).
     *
     * @param PDO $pdo
     * @param int $accommodationId
     * @param string $checkIn  Format YYYY-MM-DD
     * @param string $checkOut Format YYYY-MM-DD
     * @return array
     */
    public static function validateStay($pdo, $accommodationId, $checkIn, $checkOut) {
        if (!$checkIn || !$checkOut || !strtotime($checkIn) || !strtotime($checkOut)) {
            return [
                'valid' => false,
                'error' => 'Datas de check-in e check-out inválidas',
                'nights' => 0,
                'min_nights' => 1
            ];
        }

        $startDate = new DateTime($checkIn);
        $endDate = new DateTime($checkOut);

        if ($endDate <= $startDate) {
            return [
                'valid' => false,
                'error' => 'A data de check-out deve ser posterior ao check-in',
                'nights' => 0,
                'min_nights' => 1
            ];
        }

        $nights = (int)$startDate->diff($endDate)->days;
        if ($nights <= 0) {
            return [
                'valid' => false,
                'error' => 'A estadia deve conter no mínimo 1 diária',
                'nights' => 0,
                'min_nights' => 1
            ];
        }

        // Fetch accommodation
        $stmtAcc = $pdo->prepare("SELECT id, name_pt, type, base_price FROM accommodations WHERE id = ?");
        $stmtAcc->execute([$accommodationId]);
        $acc = $stmtAcc->fetch(PDO::FETCH_ASSOC);

        if (!$acc) {
            return [
                'valid' => false,
                'error' => 'Acomodação não encontrada',
                'nights' => $nights,
                'min_nights' => 1
            ];
        }

        // 1. Check for an ACTIVE PACKAGE intersecting this reservation period
        $sqlPkg = "SELECT p.id, p.name, p.start_date, p.end_date, p.description,
                          pa.price_per_night, pa.min_nights
                   FROM packages p
                   JOIN package_accommodations pa ON p.id = pa.package_id
                   WHERE p.is_active = 1
                     AND pa.is_active = 1
                     AND pa.accommodation_id = ?
                     AND (p.start_date < ? AND p.end_date > ?)
                   ORDER BY p.start_date ASC
                   LIMIT 1";
        $stmtPkg = $pdo->prepare($sqlPkg);
        $stmtPkg->execute([$accommodationId, $checkOut, $checkIn]);
        $activePackage = $stmtPkg->fetch(PDO::FETCH_ASSOC);

        $isPackage = false;
        $minNights = 1;
        $reason = '';
        $packageData = null;
        $totalPrice = 0;

        if ($activePackage) {
            // Package is active for this period
            $isPackage = true;
            $minNights = (int)$activePackage['min_nights'];
            $pricePerNight = (float)$activePackage['price_per_night'];
            $packageName = $activePackage['name'];

            $packageData = [
                'id' => (int)$activePackage['id'],
                'name' => $packageName,
                'price_per_night' => $pricePerNight,
                'min_nights' => $minNights,
                'description' => $activePackage['description'] ?? '',
                'start_date' => $activePackage['start_date'],
                'end_date' => $activePackage['end_date']
            ];

            $totalPrice = $nights * $pricePerNight;

            if ($nights < $minNights) {
                $reason = "O período selecionado faz parte do \"{$packageName}\" e exige no mínimo {$minNights} diárias nesta acomodação.";
            }
        } else {
            // Standard Stay Rules (No active package)
            $isLoft = (strtolower($acc['type']) === 'loft');

            // Check if reservation includes Friday night or Saturday night
            $hasWeekendNight = false;
            $curr = clone $startDate;
            while ($curr < $endDate) {
                $dayOfWeek = (int)$curr->format('N'); // 1 = Mon, 5 = Fri, 6 = Sat, 7 = Sun
                if ($dayOfWeek === 5 || $dayOfWeek === 6) {
                    $hasWeekendNight = true;
                    break;
                }
                $curr->modify('+1 day');
            }

            if ($isLoft) {
                // Loft: minimum 2 nights ALWAYS
                $minNights = 2;
                if ($nights < 2) {
                    $reason = "O Loft Massambaba Família possui política de permanência mínima de 2 diárias.";
                }
            } elseif ($hasWeekendNight) {
                // Suites on Weekend: minimum 2 nights
                $minNights = 2;
                if ($nights < 2) {
                    $reason = "Para estadias aos finais de semana (noites de sexta e sábado), o período mínimo é de 2 diárias.";
                }
            } else {
                // Suites on pure Weekdays (Sun night to Thu night): 1 night allowed
                $minNights = 1;
            }

            // Calculate standard stay price (factoring in any seasonal prices)
            $stmtSeason = $pdo->prepare("SELECT start_date, end_date, price_per_night FROM seasonal_prices WHERE accommodation_id = ?");
            $stmtSeason->execute([$accommodationId]);
            $seasons = $stmtSeason->fetchAll(PDO::FETCH_ASSOC);

            $curr = clone $startDate;
            while ($curr < $endDate) {
                $dateStr = $curr->format('Y-m-d');
                $nightPrice = (float)$acc['base_price'];

                foreach ($seasons as $s) {
                    if ($dateStr >= $s['start_date'] && $dateStr <= $s['end_date']) {
                        $nightPrice = (float)$s['price_per_night'];
                        break;
                    }
                }

                $totalPrice += $nightPrice;
                $curr->modify('+1 day');
            }
        }

        $isValid = ($nights >= $minNights);

        return [
            'valid' => $isValid,
            'nights' => $nights,
            'min_nights' => $minNights,
            'reason' => $reason,
            'is_package' => $isPackage,
            'package' => $packageData,
            'price_per_night' => $nights > 0 ? round($totalPrice / $nights, 2) : 0,
            'total_price' => $totalPrice,
            'accommodation' => [
                'id' => (int)$acc['id'],
                'name' => $acc['name_pt'],
                'type' => $acc['type'],
                'base_price' => (float)$acc['base_price']
            ]
        ];
    }
}