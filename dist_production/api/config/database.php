<?php
// backend/api/config/database.php

function getDatabaseConnection() {
    // Check multiple potential database directory locations
    $candidates = [
        __DIR__ . '/../../database',
        __DIR__ . '/../database',
        dirname(__DIR__, 2) . '/database',
        dirname(__DIR__) . '/database'
    ];
    
    $dbDir = null;
    foreach ($candidates as $dir) {
        if (is_dir($dir) || @mkdir($dir, 0777, true)) {
            $dbDir = $dir;
            break;
        }
    }
    
    if (!$dbDir) {
        $dbDir = __DIR__ . '/../database';
        @mkdir($dbDir, 0777, true);
    }
    
    $dbFile = $dbDir . '/pousada.sqlite';
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    initDatabase($pdo);
    return $pdo;
}

function initDatabase($pdo) {
    // 1. Users (Admin)
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 2. Accommodations (Suítes e Lofts)
    $pdo->exec("CREATE TABLE IF NOT EXISTS accommodations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL DEFAULT 'suite',
        name_pt TEXT NOT NULL,
        name_en TEXT NOT NULL,
        name_es TEXT NOT NULL,
        description_pt TEXT,
        description_en TEXT,
        description_es TEXT,
        base_price REAL NOT NULL,
        max_guests INTEGER NOT NULL DEFAULT 2,
        accepts_pets INTEGER NOT NULL DEFAULT 0,
        youtube_video_url TEXT,
        amenities_json TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 3. Accommodation Photos
    $pdo->exec("CREATE TABLE IF NOT EXISTS accommodation_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accommodation_id INTEGER NOT NULL,
        photo_url TEXT NOT NULL,
        is_cover INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE
    )");

    // 4. Seasonal Prices (Alta temporada / Feriados / Réveillon)
    $pdo->exec("CREATE TABLE IF NOT EXISTS seasonal_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accommodation_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        price_per_night REAL NOT NULL,
        label TEXT,
        FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE
    )");

    // 5. Reservations
    $pdo->exec("CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accommodation_id INTEGER NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_phone TEXT NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        adults_count INTEGER NOT NULL DEFAULT 1,
        children_count INTEGER DEFAULT 0,
        has_pets INTEGER DEFAULT 0,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'unpaid',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE RESTRICT
    )");

    // 6. Financial Transactions (Livro Caixa)
    $pdo->exec("CREATE TABLE IF NOT EXISTS financial_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reservation_id INTEGER NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'pix',
        transaction_date DATE NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL
    )");

    // 7. Blog Posts
    $pdo->exec("CREATE TABLE IF NOT EXISTS blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title_pt TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_es TEXT NOT NULL,
        excerpt_pt TEXT,
        excerpt_en TEXT,
        excerpt_es TEXT,
        content_pt TEXT NOT NULL,
        content_en TEXT NOT NULL,
        content_es TEXT NOT NULL,
        featured_image TEXT,
        gallery_photos TEXT,
        youtube_video_url TEXT,
        tags TEXT,
        is_published INTEGER DEFAULT 1,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Garantir coluna gallery_photos se tabela já existia
    try {
        $stmtCols = $pdo->query("PRAGMA table_info(blog_posts)");
        $cols = $stmtCols->fetchAll(PDO::FETCH_COLUMN, 1);
        if (!in_array('gallery_photos', $cols)) {
            $pdo->exec("ALTER TABLE blog_posts ADD COLUMN gallery_photos TEXT");
        }
    } catch (Exception $e) {}

    // 8. Site Settings
    $pdo->exec("CREATE TABLE IF NOT EXISTS site_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT
    )");

    
    // 9. Gallery Items
    $pdo->exec("CREATE TABLE IF NOT EXISTS gallery_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        image_url TEXT NOT NULL,
        category TEXT DEFAULT 'geral',
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 10. Tourist Attractions / Beaches Guide
    $pdo->exec("CREATE TABLE IF NOT EXISTS tourist_attractions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name_pt TEXT NOT NULL,
        name_en TEXT NOT NULL,
        name_es TEXT NOT NULL,
        distance_label_pt TEXT,
        distance_label_en TEXT,
        distance_label_es TEXT,
        duration_badge_pt TEXT,
        duration_badge_en TEXT,
        duration_badge_es TEXT,
        description_pt TEXT,
        description_en TEXT,
        description_es TEXT,
        tips_pt TEXT,
        tips_en TEXT,
        tips_es TEXT,
        image_url TEXT NOT NULL,
        youtube_video_url TEXT,
        maps_url TEXT,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 11. Leads Capture (IA Concierge)
    $pdo->exec("CREATE TABLE IF NOT EXISTS leads_capture (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        whatsapp TEXT,
        email TEXT,
        checkin_date DATE,
        checkout_date DATE,
        guests INTEGER DEFAULT 2,
        has_pets INTEGER DEFAULT 0,
        accommodation_id INTEGER NULL,
        reservation_id INTEGER NULL,
        estimated_total REAL NULL,
        notes TEXT,
        status TEXT DEFAULT 'new', -- new, in_negotiation, converted, lost
        chat_history TEXT, -- JSON array of messages
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE SET NULL,
        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL
    )");

    // 12. AI Agent Settings & API Keys
    $pdo->exec("CREATE TABLE IF NOT EXISTS ai_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT DEFAULT 'Marina - Concierge Monte Alto',
        is_active INTEGER DEFAULT 1,
        system_instructions TEXT,
        welcome_message_pt TEXT DEFAULT 'Olá! Bem-vindo à Pousada Monte Alto em Arraial do Cabo. Como posso ajudar com sua hospedagem pé na areia hoje?',
        welcome_message_en TEXT DEFAULT 'Hello! Welcome to Pousada Monte Alto in Arraial do Cabo. How can I help with your beachfront stay today?',
        welcome_message_es TEXT DEFAULT '¡Hola! Bienvenido a Posada Monte Alto en Arraial do Cabo. ¿Cómo puedo ayudarte con tu estadía frente al mar hoy?',
        api_keys_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Seed default ai_settings row if empty
    try {
        $checkAI = $pdo->query("SELECT COUNT(*) as count FROM ai_settings")->fetch();
        if ($checkAI['count'] == 0) {
            $defaultKeys = [
                'AIzaSyCHGG9m1yJJy1ffn5OXnF4QtH4GkQU8sWo',
                'AIzaSyDTq2Juy_-GBmUqUENkaMuEIT9pDaIpnyY',
                'AIzaSyBVDPCS8_oMYVQQO0eHUysi7cSKzPMeD_Q',
                'AIzaSyAW3_ob0bZSQ96GIpw3btCO_pihxSUynvg',
                'AIzaSyB-V7bHPnrKtxZuOVLorob2bLsvscRWSSA',
                'AIzaSyCDLzafLWD9P49plPqdvgjA2j3OfuWGreQ',
                'AIzaSyDrxWGEeDTKI9Qb9wI5V-7PcVAC4suNTXM',
                'AIzaSyBQRNLnzkpObcJAEipYpT9ghSlvB58f4Tg',
                'AIzaSyDphR7H4w1_GkXcoxbZ9S0a_Nogf0Ama6E',
                'AIzaSyDZFrvCFhMMlOAvIBIST0eTKT5XBC3sHrI',
                'AIzaSyCW8D7QdaHCrGLwl087vJl34tHFw_IHof0',
                'AIzaSyDBun_96_TZuoItLMkf9lSv7qvdkVmQGFo',
                'AIzaSyDOnJLiyMNThtfghZ-u9CMRd9twQUYNdos'
            ];
            $stmtInitAI = $pdo->prepare("INSERT INTO ai_settings (agent_name, is_active, api_keys_json) VALUES (?, 1, ?)");
            $stmtInitAI->execute(['Marina - Concierge Monte Alto', json_encode($defaultKeys)]);
        }
    } catch (Exception $e) {}

    seedInitialData($pdo);
    seedAttractionsAndGalleryIfEmpty($pdo);
}

function seedInitialData($pdo) {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetch()['count'];
    
    if ($userCount == 0) {
        // Admin
        $pass = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')");
        $stmt->execute(['Administrador Pousada Monte Alto', 'admin@pousadamontealto.com.br', $pass]);
        
        // Accommodations
        $accommodations = [
            [
                'slug' => 'suite-master-pe-na-areia',
                'type' => 'suite',
                'name_pt' => 'Suíte Master Pé na Areia',
                'name_en' => 'Master Beachfront Suite',
                'name_es' => 'Suite Master Frente al Mar',
                'description_pt' => 'Localizada a poucos passos da praia de Monte Alto em Arraial do Cabo. Conta com cama king size, hidromassagem com vista, ar condicionado split silencioso, varanda privativa com rede e decoração náutica rústico-chique.',
                'description_en' => 'Located just steps from the quiet beach of Monte Alto in Arraial do Cabo. Features king size bed, whirlpool with view, silent AC, private balcony with hammock and rustic-chic coastal decor.',
                'description_es' => 'Ubicada a pocos pasos de la tranquila playa de Monte Alto en Arraial del Cabo. Cuenta con cama king size, hidromasaje con vista, aire acondicionado, balcón privado con hamaca y decoración costera.',
                'base_price' => 450.00,
                'max_guests' => 2,
                'accepts_pets' => 1,
                'youtube_video_url' => 'https://www.youtube.com/watch?v=0kH8s4Ue7w8',
                'amenities_json' => json_encode(['wifi', 'ar_condicionado', 'hidromassagem', 'cama_king', 'frigobar', 'smart_tv', 'vista_mar', 'cafe_da_manha', 'estacionamento', 'pet_friendly', 'varanda_com_rede']),
                'photos' => [
                    ['url' => 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 'cover' => 1],
                    ['url' => 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', 'cover' => 0],
                    ['url' => 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', 'cover' => 0],
                    ['url' => 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80', 'cover' => 0]
                ]
            ],
            [
                'slug' => 'loft-massambaba-familia',
                'type' => 'loft',
                'name_pt' => 'Loft Massambaba Família',
                'name_en' => 'Massambaba Family Loft',
                'name_es' => 'Loft Massambaba Familiar',
                'description_pt' => 'Espaço amplo de 65m² estilo bangalô privativo. Equipado com cozinha americana completa, sala de estar integrada, mezanino aconchegante, churrasqueira individual e espaço pet friendly perfeito para famílias.',
                'description_en' => 'Spacious 65m² private bungalow style loft. Fully equipped open-concept kitchen, integrated living room, cozy mezzanine, private barbecue grill and pet friendly garden ideal for families.',
                'description_es' => 'Amplio espacio de 65m² estilo loft bungalow. Equipado con cocina completa, sala integrada, altillo acogedor, parrilla individual y espacio pet friendly ideal para familias.',
                'base_price' => 590.00,
                'max_guests' => 4,
                'accepts_pets' => 1,
                'youtube_video_url' => 'https://www.youtube.com/watch?v=kY3P1x_wNq0',
                'amenities_json' => json_encode(['wifi', 'ar_condicionado', 'cozinha_completa', 'smart_tv', 'churrasqueira', 'varanda_com_rede', 'estacionamento', 'pet_friendly', 'cama_queen', 'sofa_cama']),
                'photos' => [
                    ['url' => 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80', 'cover' => 1],
                    ['url' => 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', 'cover' => 0],
                    ['url' => 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80', 'cover' => 0]
                ]
            ],
            [
                'slug' => 'suite-jardim-tropical',
                'type' => 'suite',
                'name_pt' => 'Suíte Jardim Tropical',
                'name_en' => 'Tropical Garden Suite',
                'name_es' => 'Suite Jardín Tropical',
                'description_pt' => 'Cercada pelo verde da restinga e coqueiros de Monte Alto. Ambiente tranquilo e reservado para casais que buscam paz, ar condicionado econômico e cama box com lençóis 300 fios.',
                'description_en' => 'Surrounded by lush coastal gardens and palm trees of Monte Alto. Quiet and private atmosphere for couples seeking relaxation, premium linen and peaceful sleep.',
                'description_es' => 'Rodeada de jardines tropicales y palmeras de Monte Alto. Ambiente sereno y privado para parejas que buscan descanso absoluto y confort.',
                'base_price' => 340.00,
                'max_guests' => 2,
                'accepts_pets' => 0,
                'youtube_video_url' => '',
                'amenities_json' => json_encode(['wifi', 'ar_condicionado', 'frigobar', 'smart_tv', 'jardim_privativo', 'cafe_da_manha', 'estacionamento']),
                'photos' => [
                    ['url' => 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', 'cover' => 1],
                    ['url' => 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80', 'cover' => 0]
                ]
            ],
            [
                'slug' => 'suite-romantica-sunset',
                'type' => 'suite',
                'name_pt' => 'Suíte Romântica Sunset',
                'name_en' => 'Romantic Sunset Suite',
                'name_es' => 'Suite Romántica Sunset',
                'description_pt' => 'Vista privilegiada para o inesquecível pôr do sol na Lagoa de Araruama. Banheira de imersão, iluminação cênica aconchegante, adega de vinhos e roupões de banho.',
                'description_en' => 'Privileged views of the breathtaking sunset over Araruama Lagoon. Features soaking tub, warm ambient lighting, wine cellar access and plush bathrobes.',
                'description_es' => 'Vista privilegiada al increíble atardecer en la Laguna de Araruama. Bañera de inmersión, iluminación cálida, minibar de vinos y batas de baño.',
                'base_price' => 480.00,
                'max_guests' => 2,
                'accepts_pets' => 1,
                'youtube_video_url' => 'https://www.youtube.com/watch?v=0kH8s4Ue7w8',
                'amenities_json' => json_encode(['wifi', 'ar_condicionado', 'vista_lagoa', 'banheira', 'frigobar', 'varanda_sunset', 'cafe_da_manha', 'estacionamento', 'pet_friendly']),
                'photos' => [
                    ['url' => 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', 'cover' => 1],
                    ['url' => 'https://images.unsplash.com/photo-1540518614846-7ede433c4b49?auto=format&fit=crop&w=1200&q=80', 'cover' => 0],
                    ['url' => 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80', 'cover' => 0]
                ]
            ]
        ];

        $stmtRoom = $pdo->prepare("INSERT INTO accommodations 
            (slug, type, name_pt, name_en, name_es, description_pt, description_en, description_es, base_price, max_guests, accepts_pets, youtube_video_url, amenities_json) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
        $stmtPhoto = $pdo->prepare("INSERT INTO accommodation_photos (accommodation_id, photo_url, is_cover, order_index) VALUES (?, ?, ?, ?)");

        foreach ($accommodations as $acc) {
            $stmtRoom->execute([
                $acc['slug'], $acc['type'],
                $acc['name_pt'], $acc['name_en'], $acc['name_es'],
                $acc['description_pt'], $acc['description_en'], $acc['description_es'],
                $acc['base_price'], $acc['max_guests'], $acc['accepts_pets'],
                $acc['youtube_video_url'], $acc['amenities_json']
            ]);
            $accId = $pdo->lastInsertId();
            
            $order = 0;
            foreach ($acc['photos'] as $photo) {
                $stmtPhoto->execute([$accId, $photo['url'], $photo['cover'], $order++]);
            }
        }

        // Seasonal Prices
        $stmtSeason = $pdo->prepare("INSERT INTO seasonal_prices (accommodation_id, start_date, end_date, price_per_night, label) VALUES (?, ?, ?, ?, ?)");
        $stmtSeason->execute([1, '2026-12-28', '2027-01-03', 750.00, 'Pacote Réveillon']);
        $stmtSeason->execute([1, '2027-02-12', '2027-02-18', 680.00, 'Carnaval']);
        $stmtSeason->execute([2, '2026-12-28', '2027-01-03', 950.00, 'Pacote Réveillon']);

        // Sample Reservations
        $stmtRes = $pdo->prepare("INSERT INTO reservations 
            (accommodation_id, guest_name, guest_email, guest_phone, check_in, check_out, adults_count, children_count, has_pets, total_price, status, payment_status, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmtRes->execute([1, 'Lucas Silveira', 'lucas.silveira@gmail.com', '+5521988776655', '2026-09-10', '2026-09-13', 2, 0, 1, 1350.00, 'confirmed', 'paid', 'Chegada prevista para 16h com 1 cachorro pequeno']);
        $stmtRes->execute([2, 'Mariana e Família', 'mariana.costa@yahoo.com.br', '+5524992334455', '2026-09-15', '2026-09-18', 3, 1, 1, 1770.00, 'pending', 'unpaid', 'Solicitou berço para bebê e estacionamento para 2 carros']);
        $stmtRes->execute([3, 'Carlos Eduardo Rocha', 'carlos.rocha@outlook.com', '+5511977665544', '2026-09-02', '2026-09-05', 2, 0, 0, 1020.00, 'checked_in', 'paid', 'Hóspedes em estadia ativa']);
        $stmtRes->execute([4, 'Fernanda Alencar', 'fernanda.alencar@gmail.com', '+5531991122334', '2026-08-20', '2026-08-23', 2, 0, 0, 1440.00, 'checked_out', 'paid', 'Avaliação 5 estrelas']);

        // Financial Transactions
        $stmtFin = $pdo->prepare("INSERT INTO financial_transactions 
            (reservation_id, type, category, amount, payment_method, transaction_date, description, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmtFin->execute([1, 'income', 'diaria', 1350.00, 'pix', '2026-09-01', 'Reserva #1 - Lucas Silveira (Suíte Master)', 'completed']);
        $stmtFin->execute([3, 'income', 'diaria', 1020.00, 'cartao_credito', '2026-09-02', 'Reserva #3 - Carlos Eduardo (Suíte Jardim)', 'completed']);
        $stmtFin->execute([4, 'income', 'diaria', 1440.00, 'pix', '2026-08-20', 'Reserva #4 - Fernanda Alencar (Suíte Sunset)', 'completed']);
        $stmtFin->execute([null, 'expense', 'energia', 480.50, 'pix', '2026-09-01', 'Conta de Energia Elétrica Enel (Pousada)', 'completed']);
        $stmtFin->execute([null, 'expense', 'limpeza', 350.00, 'pix', '2026-09-02', 'Produtos de limpeza e lavanderia especializada', 'completed']);
        $stmtFin->execute([null, 'expense', 'manutencao', 220.00, 'dinheiro', '2026-08-28', 'Revisão e limpeza de filtros do Ar Condicionado', 'completed']);
        $stmtFin->execute([null, 'income', 'frigobar', 115.00, 'pix', '2026-09-01', 'Consumo de bebidas e petiscos frigobar', 'completed']);

        // Blog Posts
        $stmtBlog = $pdo->prepare("INSERT INTO blog_posts 
            (slug, title_pt, title_en, title_es, excerpt_pt, excerpt_en, excerpt_es, content_pt, content_en, content_es, featured_image, youtube_video_url, tags, is_published) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");

        $stmtBlog->execute([
            'por-que-se-hospedar-em-monte-alto-arraial-do-cabo',
            'Por que se hospedar em Monte Alto: O refúgio secreto de Arraial do Cabo',
            'Why Stay in Monte Alto: The Secret Haven of Arraial do Cabo',
            'Por qué alojarse en Monte Alto: El refugio secreto de Arraial del Cabo',
            'Descubra a tranquilidade pé na areia entre o oceano cristalino e o pôr do sol mágico da Lagoa de Araruama.',
            'Discover peaceful beachfront relaxation between crystal-clear ocean and the magical lagoon sunset.',
            'Descubra la tranquilidad frente al mar entre el océano cristalino y el atardecer mágico de la laguna.',
            '<h3>O melhor dos dois mundos</h3><p>Quando pensamos em Arraial do Cabo, logo vêm à mente as águas caribenhas da Praia do Forno ou Pontal do Atalaia. Porém, o centro pode ser muito movimentado na alta temporada. É exatamente aí que o distrito de <strong>Monte Alto</strong> brilha como a melhor escolha para quem busca descansar com total sossego.</p><p>Localizada na charmosa Restinga de Massambaba, Monte Alto permite que você durma ao som das ondas do mar e em apenas 5 minutos contemple um dos mais belos pores do sol do Brasil às margens da Lagoa de Araruama.</p><h3>Vantagens de Monte Alto:</h3><ul><li><strong>Pé na areia sem aglomerações:</strong> Praia extensa e tranquila na porta da pousada.</li><li><strong>Fácil acesso ao centro:</strong> Apenas 15 minutos de carro das principais praias e passeios de barco.</li><li><strong>Perfeito para Pets:</strong> Espaço aberto e liberdade para seu companheiro de quatro patas.</li></ul>',
            '<h3>The Best of Both Worlds</h3><p>Monte Alto offers the perfect balance: peace and tranquility on endless beaches, plus quick 15-minute access to downtown Arraial do Cabo and famous boat tours.</p>',
            '<h3>Lo mejor de ambos mundos</h3><p>Monte Alto ofrece el equilibrio perfecto: paz y tranquilidad en playas interminables, además de un rápido acceso de 15 minutos al centro de Arraial del Cabo.</p>',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
            'https://www.youtube.com/watch?v=kY3P1x_wNq0',
            'arraial do cabo, monte alto, dicas, hospedagem, praias'
        ]);

        $stmtBlog->execute([
            'guia-completo-das-melhores-praias-de-arraial-do-cabo',
            'Guia Completo das Melhores Praias de Arraial do Cabo',
            'Complete Guide to the Best Beaches in Arraial do Cabo',
            'Guía Completa de las Mejores Playas de Arraial del Cabo',
            'Conheça o Caribe Brasileiro: Pontal do Atalaia, Praia do Forno, Ilha do Farol e Prainha.',
            'Explore the Brazilian Caribbean: Pontal do Atalaia, Praia do Forno, and Lighthouse Island.',
            'Conozca el Caribe Brasileño: Pontal do Atalaia, Praia do Forno e Isla del Faro.',
            '<h3>1. Prainhas do Pontal do Atalaia</h3><p>Famosas pela lendária escadaria de madeira e águas em tons de azul turquesa inacreditáveis.</p><h3>2. Praia do Forno</h3><p>Acesso por uma trilha leve de 15 minutos com vista panorâmica da enseada. Águas calmas perfeitas para mergulho com tartarugas.</p><h3>3. Praia de Monte Alto</h3><p>A praia da nossa pousada! Extensa, areia branca, excelente para caminhadas e esportes náuticos como kitesurf.</p>',
            '<h3>1. Pontal do Atalaia Beaches</h3><p>Famous for the wooden staircase and turquoise waters.</p><h3>2. Praia do Forno</h3><p>Calm waters, great for snorkeling with sea turtles.</p>',
            '<h3>1. Playas de Pontal do Atalaia</h3><p>Famosas por la escalera de madera y aguas turquesas.</p><h3>2. Praia do Forno</h3><p>Aguas tranquilas, ideales para hacer snorkel.</p>',
            'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
            'https://www.youtube.com/watch?v=0kH8s4Ue7w8',
            'praias, arraial do cabo, guia, turismo, mergulho'
        ]);

        // Settings
        $settings = [
            'pousada_name' => 'Pousada Monte Alto',
            'tagline_pt' => 'Seu refúgio de paz pé na areia em Arraial do Cabo',
            'tagline_en' => 'Your peaceful beachfront haven in Arraial do Cabo',
            'tagline_es' => 'Tu refugio de paz frente al mar en Arraial del Cabo',
            'phone' => '+55 (21) 96949-3569',
            'whatsapp' => '5521969493569',
            'secondary_whatsapp' => '5524993350954',
            'email' => 'contato@pousadamontealto.com.br',
            'address' => 'Travessa Américo Reis, Distrito de Monte Alto, Arraial do Cabo - RJ, CEP 28930-000',
            'checkin_time' => '14:00',
            'checkout_time' => '12:00',
            'instagram' => 'https://instagram.com/pousadamontealtooficial',
            'facebook' => 'https://facebook.com/pousadamontealtooficial',
            'google_maps_embed' => 'https://maps.google.com/maps?q=Monte%20Alto%20Arraial%20do%20Cabo%20RJ&t=&z=14&ie=UTF8&iwloc=&output=embed',
            'pix_key' => 'contato@pousadamontealto.com.br',
            'wifi_info' => 'Pousada_MonteAlto_Guest / senha: bemvindoaomontealto'
        ];

        $stmtSet = $pdo->prepare("INSERT OR REPLACE INTO site_settings (setting_key, setting_value) VALUES (?, ?)");
        foreach ($settings as $k => $v) {
            $stmtSet->execute([$k, $v]);
        }
    }
}


function seedAttractionsAndGalleryIfEmpty($pdo) {
    // 1. Seed Attractions / Beaches if empty
    $stmtA = $pdo->query("SELECT COUNT(*) as count FROM tourist_attractions");
    if ($stmtA->fetch()['count'] == 0) {
        $beaches = [
            [
                'slug' => 'praia-de-monte-alto',
                'name_pt' => 'Praia de Monte Alto',
                'name_en' => 'Monte Alto Beach',
                'name_es' => 'Playa de Monte Alto',
                'distance_label_pt' => 'Na porta da pousada',
                'distance_label_en' => 'Right outside the inn',
                'distance_label_es' => 'En la puerta de la posada',
                'duration_badge_pt' => 'Pé na areia (0 min)',
                'duration_badge_en' => 'Right on the beach (0 min)',
                'duration_badge_es' => 'Pie en la arena (0 min)',
                'description_pt' => 'Praia extensa de areias brancas e mar cristalino na porta da pousada. Um verdadeiro refúgio intocado na Restinga de Massambaba, perfeito para caminhadas, pesca esportiva e kitesurf.',
                'description_en' => 'Expansive beach with white sands and crystal clear ocean right outside the inn. An untouched paradise in Restinga de Massambaba, perfect for strolls, fishing, and kitesurfing.',
                'description_es' => 'Playa virgen de arenas blancas y mar transparente en la puerta de la posada. Refugio natural en la Restinga de Massambaba, ideal para caminatas y kitesurf.',
                'tips_pt' => 'Praia tranquila e sem o tumulto do centro. Excelente para quem busca sossego e contato puro com a natureza costeira.',
                'tips_en' => 'Peaceful beach away from downtown crowds. Perfect for pure relaxation and nature immersion.',
                'tips_es' => 'Playa serena sin aglomeraciones. Ideal para desconectar y disfrutar de la naturaleza.',
                'image_url' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
                'youtube_video_url' => 'https://www.youtube.com/watch?v=0kH8s4Ue7w8',
                'maps_url' => 'https://www.google.com/maps/dir/?api=1&destination=-22.9288,-42.0615',
                'order_index' => 1
            ],
            [
                'slug' => 'lagoa-de-araruama',
                'name_pt' => 'Lagoa de Araruama (Pôr do Sol)',
                'name_en' => 'Araruama Lagoon (Sunset)',
                'name_es' => 'Laguna de Araruama (Atardecer)',
                'distance_label_pt' => '500 metros',
                'distance_label_en' => '500 meters away',
                'distance_label_es' => '500 metros',
                'duration_badge_pt' => '3 min a pé / carro',
                'duration_badge_en' => '3 min walk / drive',
                'duration_badge_es' => '3 min a pie / auto',
                'description_pt' => 'A 3 minutos da pousada, a Lagoa de Araruama oferece águas mornas, calmas e salinas. O pôr do sol mais espetacular de Arraial do Cabo, com o céu tingido de tons dourados e violetas.',
                'description_en' => 'Just 3 minutes from the inn, Lake Araruama offers warm, peaceful waters and the most stunning sunset in the entire Lakes Region.',
                'description_es' => 'A 3 minutos de la posada, la Laguna de Araruama ofrece aguas tibias y calmas con el atardecer más espectacular de Arraial del Cabo.',
                'tips_pt' => 'Ideal para stand up paddle, caiaque e crianças. Não perca o visual do entardecer entre 17h e 18h.',
                'tips_en' => 'Great for paddleboarding, kayaking, and families. Don\'t miss the sunset between 5PM and 6PM.',
                'tips_es' => 'Perfecto para paddle surf y niños. No te pierdas la puesta de sol entre las 17h y 18h.',
                'image_url' => 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
                'youtube_video_url' => 'https://www.youtube.com/watch?v=kY3P1x_wNq0',
                'maps_url' => 'https://www.google.com/maps/dir/?api=1&destination=Lagoa+de+Araruama+Monte+Alto+Arraial+do+Cabo',
                'order_index' => 2
            ],
            [
                'slug' => 'praia-grande',
                'name_pt' => 'Praia Grande',
                'name_en' => 'Praia Grande',
                'name_es' => 'Playa Grande',
                'distance_label_pt' => '9 km',
                'distance_label_en' => '9 km away',
                'distance_label_es' => '9 km',
                'duration_badge_pt' => '10-12 min de carro',
                'duration_badge_en' => '10-12 min drive',
                'duration_badge_es' => '10-12 min en auto',
                'description_pt' => 'A mais vibrante praia urbana de Arraial do Cabo. Conta com amplo calçadão, quiosques gastronômicos, artesanato e o sol se pondo diretamente dentro do oceano Atlântico.',
                'description_en' => 'The vibrant main beach of Arraial do Cabo with restaurants, boardwalk strolls, and dramatic open-ocean sunsets.',
                'description_es' => 'La playa urbana principal con gastronomía costera, quioscos y atardecer sobre el océano.',
                'tips_pt' => 'Ótima para surfe e passeios de fim de tarde. Visite a famosa estátua de Flávia Alessandra no calçadão.',
                'tips_en' => 'Great surf spot and lively afternoon promenade. Check out the Flavia Alessandra statue.',
                'tips_es' => 'Excelente para surf y paseo vespertino por el malecón.',
                'image_url' => 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
                'youtube_video_url' => 'https://www.youtube.com/watch?v=0kH8s4Ue7w8',
                'maps_url' => 'https://www.google.com/maps/dir/?api=1&destination=Praia+Grande+Arraial+do+Cabo',
                'order_index' => 3
            ],
            [
                'slug' => 'prainha',
                'name_pt' => 'Prainha',
                'name_en' => 'Prainha',
                'name_es' => 'Prainha',
                'distance_label_pt' => '11 km',
                'distance_label_en' => '11 km away',
                'distance_label_es' => '11 km',
                'duration_badge_pt' => '15 min de carro',
                'duration_badge_en' => '15 min drive',
                'duration_badge_es' => '15 min en auto',
                'description_pt' => 'O cartão de visitas na chegada à cidade. Águas calmas em tons de azul turquesa caribenho, cercada por morros verdes e com quiosques com petiscos de frutos do mar.',
                'description_en' => 'The postcard entrance of Arraial do Cabo. Turquoise waters with calm gentle waves and seafood beach kiosks.',
                'description_es' => 'La postal de bienvenida con aguas turquesas serenas y quioscos gastronómicos.',
                'tips_pt' => 'Excelente para banho com crianças e passeios de caiaque ou banana boat.',
                'tips_en' => 'Ideal for kids swimming and kayak rentals.',
                'tips_es' => 'Ideal para familias y alquiler de kayaks.',
                'image_url' => 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
                'youtube_video_url' => '',
                'maps_url' => 'https://www.google.com/maps/dir/?api=1&destination=Prainha+Arraial+do+Cabo',
                'order_index' => 4
            ],
            [
                'slug' => 'prainhas-do-pontal-do-atalaia',
                'name_pt' => 'As Prainhas do Pontal do Atalaia',
                'name_en' => 'Pontal do Atalaia Beaches',
                'name_es' => 'Prainhas del Pontal do Atalaia',
                'distance_label_pt' => '14 km',
                'distance_label_en' => '14 km away',
                'distance_label_es' => '14 km',
                'duration_badge_pt' => '20 min de carro',
                'duration_badge_en' => '20 min drive',
                'duration_badge_es' => '20 min en auto',
                'description_pt' => 'Cenário paradisíaco mundialmente conhecido pela escadaria de madeira de 255 degraus. Areia fina como talco e água transparente estilo Caribe. Em maré baixa, surge a Gruta do Amor.',
                'description_en' => 'Iconic wooden staircase descending to breathtaking powder-white sands and emerald clear waters.',
                'description_es' => 'Escenario de ensueño con la famosa escalera de madera de 255 escalones y arenas blanquísimas.',
                'tips_pt' => 'Tire fotos panorâmicas no topo da escadaria. Acesso por carro pelo condomínio ou táxi boat da Praia dos Anjos.',
                'tips_en' => 'Snap panoramic photos from the top of the stairs. Accessible by car or boat taxi.',
                'tips_es' => 'Fotos espectaculares desde arriba de la escalera. Acceso en auto o en taxi boat.',
                'image_url' => 'https://images.unsplash.com/photo-1510414842594-a61752d335c5?auto=format&fit=crop&w=1200&q=80',
                'youtube_video_url' => 'https://www.youtube.com/watch?v=0kH8s4Ue7w8',
                'maps_url' => 'https://www.google.com/maps/dir/?api=1&destination=Prainhas+do+Pontal+do+Atalaia',
                'order_index' => 5
            ],
            [
                'slug' => 'praia-do-forno',
                'name_pt' => 'Praia do Forno',
                'name_en' => 'Forno Beach',
                'name_es' => 'Playa del Forno',
                'distance_label_pt' => '12 km',
                'distance_label_en' => '12 km away',
                'distance_label_es' => '12 km',
                'duration_badge_pt' => '18 min de carro + trilha',
                'duration_badge_en' => '18 min drive + trail',
                'duration_badge_es' => '18 min en auto + sendero',
                'description_pt' => 'Enseada preservada cercada por morros verdes e águas calmas e mornas com presença frequente de tartarugas marinhas. Abriga restaurante flutuante e quiosques rústicos.',
                'description_en' => 'Preserved cove flanked by lush forest, calm waters with sea turtles, and floating restaurants.',
                'description_es' => 'Ensenada virgen con abundante fauna marina (tortugas) y restaurantes flotantes.',
                'tips_pt' => 'Trilha pavimentada de 15 min a partir da Praia dos Anjos com mirante de tirar o fôlego.',
                'tips_en' => 'Panoramic 15-minute paved trail departing from Praia dos Anjos.',
                'tips_es' => 'Sendero panorámico de 15 minutos desde Praia dos Anjos.',
                'image_url' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
                'youtube_video_url' => '',
                'maps_url' => 'https://www.google.com/maps/dir/?api=1&destination=Praia+do+Forno+Arraial+do+Cabo',
                'order_index' => 6
            ]
        ];

        $stmtIns = $pdo->prepare("INSERT INTO tourist_attractions (
            slug, name_pt, name_en, name_es,
            distance_label_pt, distance_label_en, distance_label_es,
            duration_badge_pt, duration_badge_en, duration_badge_es,
            description_pt, description_en, description_es,
            tips_pt, tips_en, tips_es,
            image_url, youtube_video_url, maps_url,
            order_index, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        foreach ($beaches as $b) {
            $stmtIns->execute([
                $b['slug'], $b['name_pt'], $b['name_en'], $b['name_es'],
                $b['distance_label_pt'], $b['distance_label_en'], $b['distance_label_es'],
                $b['duration_badge_pt'], $b['duration_badge_en'], $b['duration_badge_es'],
                $b['description_pt'], $b['description_en'], $b['description_es'],
                $b['tips_pt'], $b['tips_en'], $b['tips_es'],
                $b['image_url'], $b['youtube_video_url'], $b['maps_url'],
                $b['order_index'], 1
            ]);
        }
    }

    // 2. Seed Gallery if fewer than 8 photos
    $stmtG = $pdo->query("SELECT COUNT(*) as count FROM gallery_items");
    if ($stmtG->fetch()['count'] < 6) {
        $gallery = [
            ['Praia de Monte Alto ao Amanhecer', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'praia', 1],
            ['Suíte Master Pé na Areia', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 'suites', 2],
            ['Lagoa de Araruama - Pôr do Sol Dourado', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', 'lagoa', 3],
            ['Loft Massambaba Família', 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80', 'suites', 4],
            ['Suíte Romântica Sunset', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', 'suites', 5],
            ['Piscina & Área de Descanso', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', 'pousada', 6],
            ['Jardim Tropical & Redário', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', 'pousada', 7],
            ['Café da Manhã Artesanal', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80', 'pousada', 8],
            ['As Prainhas do Pontal do Atalaia', 'https://images.unsplash.com/photo-1510414842594-a61752d335c5?auto=format&fit=crop&w=1200&q=80', 'praia', 9],
            ['Prainha de Arraial do Cabo', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', 'praia', 10]
        ];
        $stmtGIns = $pdo->prepare("INSERT INTO gallery_items (title, image_url, category, order_index) VALUES (?, ?, ?, ?)");
        foreach ($gallery as $g) {
            $stmtGIns->execute([$g[0], $g[1], $g[2], $g[3]]);
        }
    }
}
