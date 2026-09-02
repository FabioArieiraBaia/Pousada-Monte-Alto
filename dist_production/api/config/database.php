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
        youtube_video_url TEXT,
        tags TEXT,
        is_published INTEGER DEFAULT 1,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 8. Site Settings
    $pdo->exec("CREATE TABLE IF NOT EXISTS site_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT
    )");

    seedInitialData($pdo);
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
