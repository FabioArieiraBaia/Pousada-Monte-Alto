<?php
// backend/api/migrate_services.php
header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/config/database.php';
    $pdo = getDatabaseConnection();

    // 1. Criar tabelas se não existirem
    $pdo->exec("CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL DEFAULT 'barco',
        name_pt TEXT NOT NULL,
        name_en TEXT NOT NULL,
        name_es TEXT NOT NULL,
        tagline_pt TEXT,
        tagline_en TEXT,
        tagline_es TEXT,
        description_pt TEXT,
        description_en TEXT,
        description_es TEXT,
        duration_label TEXT,
        price_per_person REAL NOT NULL DEFAULT 0,
        partner_name TEXT,
        partner_commission_pct REAL DEFAULT 20.0,
        partner_cost REAL DEFAULT 0.0,
        min_participants INTEGER DEFAULT 1,
        max_participants INTEGER DEFAULT 12,
        included_items_json TEXT,
        requirements_json TEXT,
        cover_photo TEXT NOT NULL,
        gallery_photos_json TEXT,
        youtube_video_url TEXT,
        is_featured INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS service_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        service_date DATE NOT NULL,
        service_time TEXT DEFAULT '09:00',
        participants_count INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        pousada_commission REAL DEFAULT 0.0,
        partner_cost REAL DEFAULT 0.0,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'unpaid',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS service_financial_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_booking_id INTEGER NULL,
        service_id INTEGER NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'pix',
        transaction_date DATE NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_booking_id) REFERENCES service_bookings(id) ON DELETE SET NULL,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    )");

    // 2. Executar seed se vazia
    seedServicesIfEmpty($pdo);

    $servicesCount = (int)$pdo->query("SELECT COUNT(*) FROM services")->fetchColumn();
    $bookingsCount = (int)$pdo->query("SELECT COUNT(*) FROM service_bookings")->fetchColumn();
    $txCount = (int)$pdo->query("SELECT COUNT(*) FROM service_financial_transactions")->fetchColumn();

    echo json_encode([
        'success' => true,
        'message' => 'Migração do módulo de Passeios & Serviços executada com sucesso! Seu banco de dados existente foi 100% preservado.',
        'data' => [
            'total_services' => $servicesCount,
            'total_bookings' => $bookingsCount,
            'total_service_transactions' => $txCount
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erro ao migrar tabelas de serviços: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
