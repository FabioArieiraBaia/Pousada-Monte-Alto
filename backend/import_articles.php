<?php
// backend/import_articles.php
require_once __DIR__ . '/api/config/database.php';

$pdo = getDatabaseConnection();

$batches = ['batch_1.json', 'batch_2.json', 'batch_3.json'];
$importedCount = 0;
$updatedCount = 0;

$stmtInsert = $pdo->prepare("
    INSERT OR REPLACE INTO blog_posts 
    (slug, title_pt, title_en, title_es, excerpt_pt, excerpt_en, excerpt_es, content_pt, content_en, content_es, featured_image, gallery_photos, youtube_video_url, tags, is_published, published_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
");

foreach ($batches as $b) {
    $filePath = __DIR__ . '/data/' . $b;
    if (!file_exists($filePath)) {
        echo "Arquivo $filePath não encontrado!\n";
        continue;
    }

    $json = file_get_contents($filePath);
    $articles = json_decode($json, true);
    if (!is_array($articles)) {
        echo "Erro ao decodificar $filePath\n";
        continue;
    }

    foreach ($articles as $art) {
        $slug = trim($art['slug'] ?? '');
        if (empty($slug)) continue;

        $galleryPhotos = isset($art['gallery_photos']) 
            ? (is_array($art['gallery_photos']) ? json_encode($art['gallery_photos'], JSON_UNESCAPED_UNICODE) : $art['gallery_photos']) 
            : '[]';

        $stmtInsert->execute([
            $slug,
            $art['title_pt'] ?? 'Artigo Sem Título',
            $art['title_en'] ?? $art['title_pt'] ?? 'Untitled Article',
            $art['title_es'] ?? $art['title_pt'] ?? 'Artículo Sin Título',
            $art['excerpt_pt'] ?? '',
            $art['excerpt_en'] ?? '',
            $art['excerpt_es'] ?? '',
            $art['content_pt'] ?? '',
            $art['content_en'] ?? '',
            $art['content_es'] ?? '',
            $art['featured_image'] ?? '',
            $galleryPhotos,
            $art['youtube_video_url'] ?? '',
            $art['tags'] ?? 'arraial do cabo, monte alto, turismo',
            isset($art['is_published']) ? intval($art['is_published']) : 0
        ]);

        $importedCount++;
        echo "Importado: [{$slug}] - {$art['title_pt']}\n";
    }
}

echo "\nTotal de matérias processadas e salvas com sucesso no banco SQLite: {$importedCount}!\n";
