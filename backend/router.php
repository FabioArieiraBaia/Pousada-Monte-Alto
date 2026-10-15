<?php
// backend/router.php - Router para o Servidor de Desenvolvimento Embutido do PHP (php -S)

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Se for um arquivo estático existente na pasta api/uploads ou api/
$filePath = __DIR__ . '/api' . $uri;
if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    return false;
}

// Se for requisição direta para /uploads/...
if (preg_match('#^/uploads/(.+)$#', $uri, $m)) {
    $uploadFile = __DIR__ . '/api/uploads/' . basename($m[1]);
    if (file_exists($uploadFile) && !is_dir($uploadFile)) {
        $mime = mime_content_type($uploadFile);
        header('Content-Type: ' . $mime);
        readfile($uploadFile);
        exit();
    }
}

// Encaminha para o index.php da API
require __DIR__ . '/api/index.php';
