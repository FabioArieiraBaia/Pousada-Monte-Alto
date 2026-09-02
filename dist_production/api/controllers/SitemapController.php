<?php
// backend/api/controllers/SitemapController.php

require_once __DIR__ . '/../config/database.php';

function renderDynamicSitemap($pdo) {
    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: public, max-age=3600'); // Cache for 1 hour for performance

    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'fabioarieira.com';
    
    // Auto-detect base URL (handles fabioarieira.com/montealto or custom domain)
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $baseSubfolder = strpos($uri, '/montealto') !== false ? '/montealto' : '';
    $baseUrl = $protocol . '://' . $host . $baseSubfolder;

    // Fetch all active Accommodations
    $stmtRooms = $pdo->query("SELECT a.slug, a.name_pt, a.created_at, 
        (SELECT photo_url FROM accommodation_photos WHERE accommodation_id = a.id ORDER BY is_cover DESC, order_index ASC LIMIT 1) as cover_photo
        FROM accommodations a 
        WHERE a.is_active = 1 
        ORDER BY a.id ASC");
    $rooms = $stmtRooms->fetchAll();

    // Fetch all published Blog Posts
    $stmtBlog = $pdo->query("SELECT slug, title_pt, featured_image, published_at 
        FROM blog_posts 
        WHERE is_published = 1 
        ORDER BY published_at DESC");
    $posts = $stmtBlog->fetchAll();

    $today = date('Y-m-d');

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
    echo '        xmlns:xhtml="http://www.w3.org/1999/xhtml"' . "\n";
    echo '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n\n";

    // 1. Home Page
    echo "  <!-- Página Inicial -->\n";
    echo "  <url>\n";
    echo "    <loc>{$baseUrl}/</loc>\n";
    echo "    <lastmod>{$today}</lastmod>\n";
    echo "    <changefreq>daily</changefreq>\n";
    echo "    <priority>1.0</priority>\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"pt-BR\" href=\"{$baseUrl}/\" />\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"en-US\" href=\"{$baseUrl}/?lng=en\" />\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"es-ES\" href=\"{$baseUrl}/?lng=es\" />\n";
    echo "    <image:image>\n";
    echo "      <image:loc>https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&amp;fit=crop&amp;w=1200&amp;q=80</image:loc>\n";
    echo "      <image:title>Pousada Monte Alto - Arraial do Cabo RJ</image:title>\n";
    echo "    </image:image>\n";
    echo "  </url>\n\n";

    // 2. Accommodations Listing
    echo "  <!-- Listagem de Acomodações -->\n";
    echo "  <url>\n";
    echo "    <loc>{$baseUrl}/acomodacoes</loc>\n";
    echo "    <lastmod>{$today}</lastmod>\n";
    echo "    <changefreq>daily</changefreq>\n";
    echo "    <priority>0.9</priority>\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"pt-BR\" href=\"{$baseUrl}/acomodacoes\" />\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"en-US\" href=\"{$baseUrl}/acomodacoes?lng=en\" />\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"es-ES\" href=\"{$baseUrl}/acomodacoes?lng=es\" />\n";
    echo "  </url>\n\n";

    // 3. Dynamic Accommodations (Suítes & Lofts)
    echo "  <!-- Suítes e Lofts Dinâmicos -->\n";
    foreach ($rooms as $room) {
        $lastmod = !empty($room['created_at']) ? substr($room['created_at'], 0, 10) : $today;
        $roomUrl = $baseUrl . '/acomodacoes/' . htmlspecialchars($room['slug'], ENT_QUOTES, 'UTF-8');
        $roomName = htmlspecialchars($room['name_pt'] ?? 'Suíte', ENT_QUOTES, 'UTF-8');
        
        echo "  <url>\n";
        echo "    <loc>{$roomUrl}</loc>\n";
        echo "    <lastmod>{$lastmod}</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>0.85</priority>\n";
        echo "    <xhtml:link rel=\"alternate\" hreflang=\"pt-BR\" href=\"{$roomUrl}\" />\n";
        echo "    <xhtml:link rel=\"alternate\" hreflang=\"en-US\" href=\"{$roomUrl}?lng=en\" />\n";
        echo "    <xhtml:link rel=\"alternate\" hreflang=\"es-ES\" href=\"{$roomUrl}?lng=es\" />\n";
        if (!empty($room['cover_photo'])) {
            $photo = htmlspecialchars($room['cover_photo'], ENT_QUOTES, 'UTF-8');
            echo "    <image:image>\n";
            echo "      <image:loc>{$photo}</image:loc>\n";
            echo "      <image:title>{$roomName} - Pousada Monte Alto</image:title>\n";
            echo "    </image:image>\n";
        }
        echo "  </url>\n";
    }
    echo "\n";

    // 4. About / Location
    echo "  <!-- Quem Somos e Localização -->\n";
    echo "  <url>\n";
    echo "    <loc>{$baseUrl}/sobre-localizacao</loc>\n";
    echo "    <lastmod>{$today}</lastmod>\n";
    echo "    <changefreq>monthly</changefreq>\n";
    echo "    <priority>0.8</priority>\n";
    echo "  </url>\n\n";

    // 5. Blog Listing
    echo "  <!-- Blog Listagem -->\n";
    echo "  <url>\n";
    echo "    <loc>{$baseUrl}/blog</loc>\n";
    echo "    <lastmod>{$today}</lastmod>\n";
    echo "    <changefreq>weekly</changefreq>\n";
    echo "    <priority>0.85</priority>\n";
    echo "  </url>\n\n";

    // 6. Dynamic Blog Posts
    echo "  <!-- Artigos do Blog Dinâmicos -->\n";
    foreach ($posts as $post) {
        $lastmod = !empty($post['published_at']) ? substr($post['published_at'], 0, 10) : $today;
        $postUrl = $baseUrl . '/blog/' . htmlspecialchars($post['slug'], ENT_QUOTES, 'UTF-8');
        $postTitle = htmlspecialchars($post['title_pt'] ?? 'Dica de Viagem', ENT_QUOTES, 'UTF-8');

        echo "  <url>\n";
        echo "    <loc>{$postUrl}</loc>\n";
        echo "    <lastmod>{$lastmod}</lastmod>\n";
        echo "    <changefreq>monthly</changefreq>\n";
        echo "    <priority>0.75</priority>\n";
        echo "    <xhtml:link rel=\"alternate\" hreflang=\"pt-BR\" href=\"{$postUrl}\" />\n";
        echo "    <xhtml:link rel=\"alternate\" hreflang=\"en-US\" href=\"{$postUrl}?lng=en\" />\n";
        echo "    <xhtml:link rel=\"alternate\" hreflang=\"es-ES\" href=\"{$postUrl}?lng=es\" />\n";
        if (!empty($post['featured_image'])) {
            $img = htmlspecialchars($post['featured_image'], ENT_QUOTES, 'UTF-8');
            echo "    <image:image>\n";
            echo "      <image:loc>{$img}</image:loc>\n";
            echo "      <image:title>{$postTitle}</image:title>\n";
            echo "    </image:image>\n";
        }
        echo "  </url>\n";
    }
    echo "\n";

    // 7. Contact
    echo "  <!-- Contato -->\n";
    echo "  <url>\n";
    echo "    <loc>{$baseUrl}/contato</loc>\n";
    echo "    <lastmod>{$today}</lastmod>\n";
    echo "    <changefreq>monthly</changefreq>\n";
    echo "    <priority>0.7</priority>\n";
    echo "  </url>\n\n";

    echo '</urlset>';
    exit();
}
