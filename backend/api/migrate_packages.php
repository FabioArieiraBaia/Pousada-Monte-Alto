<?php
// backend/api/migrate_packages.php
header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/config/database.php';
    $pdo = getDatabaseConnection();

    // 1. Criar tabelas se não existirem
    $pdo->exec("CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active INTEGER DEFAULT 1,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS package_accommodations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id INTEGER NOT NULL,
        accommodation_id INTEGER NOT NULL,
        price_per_night REAL NOT NULL,
        min_nights INTEGER NOT NULL DEFAULT 2,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
        FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE
    )");

    // 2. Se a tabela packages estiver vazia, inserir os pacotes modelo
    $stmtCount = $pdo->query("SELECT COUNT(*) FROM packages");
    $totalPackages = (int)$stmtCount->fetchColumn();

    $seeded = false;
    if ($totalPackages === 0) {
        $stmtPkg = $pdo->prepare("INSERT INTO packages (name, start_date, end_date, is_active, description) VALUES (?, ?, ?, ?, ?)");
        $stmtPkg->execute([
            'Pacote Réveillon Pé na Areia 2026/2027',
            '2026-12-28',
            '2027-01-02',
            1,
            'Ceia especial de Ano Novo, brinde com espumante pé na areia e café da manhã incluso.'
        ]);
        $revId = $pdo->lastInsertId();

        $stmtPkg->execute([
            'Pacote Carnaval no Paraíso 2027',
            '2027-02-12',
            '2027-02-17',
            1,
            'Refúgio de tranquilidade entre o mar e a lagoa, longe da agitação e com o melhor pôr do sol.'
        ]);
        $carnId = $pdo->lastInsertId();

        // Vincular acomodações
        $stmtAccs = $pdo->query("SELECT id, type, base_price FROM accommodations");
        $allRooms = $stmtAccs->fetchAll(PDO::FETCH_ASSOC);

        $stmtLink = $pdo->prepare("INSERT INTO package_accommodations (package_id, accommodation_id, price_per_night, min_nights, is_active) VALUES (?, ?, ?, ?, ?)");

        foreach ($allRooms as $r) {
            $isLoft = ($r['type'] === 'loft');
            // Réveillon
            $priceRev = $isLoft ? 1100 : round($r['base_price'] * 1.85);
            $minRev = $isLoft ? 5 : 4;
            $stmtLink->execute([$revId, $r['id'], $priceRev, $minRev, 1]);

            // Carnaval
            $priceCarn = $isLoft ? 980 : round($r['base_price'] * 1.65);
            $minCarn = $isLoft ? 5 : 4;
            $stmtLink->execute([$carnId, $r['id'], $priceCarn, $minCarn, 1]);
        }
        $seeded = true;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Migração de pacotes executada com sucesso! O banco existente de produção e todas as suas configurações foram 100% preservados.',
        'seeded_initial_packages' => $seeded,
        'current_packages_count' => $totalPackages === 0 ? 2 : $totalPackages
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
