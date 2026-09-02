<?php
// backend/api/index.php

require_once __DIR__ . '/config/cors.php';
handleCORS();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/AccommodationsController.php';
require_once __DIR__ . '/controllers/ReservationsController.php';
require_once __DIR__ . '/controllers/FinanceController.php';
require_once __DIR__ . '/controllers/BlogController.php';
require_once __DIR__ . '/controllers/SettingsController.php';
require_once __DIR__ . '/controllers/UploadController.php';

$pdo = getDatabaseConnection();

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Parse URL path
$parsed = parse_url($uri, PHP_URL_PATH);

// Normalize path: strip /montealto/api, /Pousada%20Monte%20Alto/backend/api or /api
$path = preg_replace('#^/montealto/api#i', '', $parsed);
$path = preg_replace('#^/Pousada%20Monte%20Alto/backend/api#i', '', $path);
$path = preg_replace('#^/Pousada Monte Alto/backend/api#i', '', $path);
$path = preg_replace('#^/api#i', '', $path);
$path = '/' . trim($path, '/');

// Handle static uploads request directly if requested through PHP
if (preg_match('#^/uploads/(.+)$#', $path, $m)) {
    $file = __DIR__ . '/uploads/' . basename($m[1]);
    if (file_exists($file)) {
        $mime = mime_content_type($file);
        header('Content-Type: ' . $mime);
        readfile($file);
        exit();
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Arquivo não encontrado']);
        exit();
    }
}

try {
    // --- AUTH ROUTES ---
    if ($path === '/auth/login' && $method === 'POST') {
        AuthController::login($pdo);
        exit();
    }
    if ($path === '/auth/me' && $method === 'GET') {
        AuthController::me($pdo);
        exit();
    }

    // --- ACCOMMODATIONS ROUTES ---
    if ($path === '/accommodations' && $method === 'GET') {
        AccommodationsController::getAll($pdo, true);
        exit();
    }
    if ($path === '/accommodations/admin' && $method === 'GET') {
        AccommodationsController::getAll($pdo, false);
        exit();
    }
    if ($path === '/accommodations/check-availability' && ($method === 'POST' || $method === 'GET')) {
        AccommodationsController::checkAvailability($pdo);
        exit();
    }
    if ($path === '/accommodations' && $method === 'POST') {
        AccommodationsController::create($pdo);
        exit();
    }
    if (preg_match('#^/accommodations/(\d+)$#', $path, $m)) {
        if ($method === 'PUT') {
            AccommodationsController::update($pdo, $m[1]);
            exit();
        } elseif ($method === 'DELETE') {
            AccommodationsController::delete($pdo, $m[1]);
            exit();
        }
    }
    if (preg_match('#^/accommodations/(\d+)/photos$#', $path, $m) && $method === 'POST') {
        AccommodationsController::addPhoto($pdo, $m[1]);
        exit();
    }
    if (preg_match('#^/accommodations/photos/(\d+)$#', $path, $m) && $method === 'DELETE') {
        AccommodationsController::deletePhoto($pdo, $m[1]);
        exit();
    }
    if (preg_match('#^/accommodations/(\d+)/cover/(\d+)$#', $path, $m) && $method === 'PUT') {
        AccommodationsController::setCoverPhoto($pdo, $m[1], $m[2]);
        exit();
    }
    if (preg_match('#^/accommodations/([^/]+)$#', $path, $m) && $method === 'GET') {
        AccommodationsController::getBySlug($pdo, $m[1]);
        exit();
    }

    // --- RESERVATIONS ROUTES ---
    if ($path === '/reservations' && $method === 'GET') {
        ReservationsController::getAll($pdo);
        exit();
    }
    if ($path === '/reservations/calendar' && $method === 'GET') {
        ReservationsController::getCalendar($pdo);
        exit();
    }
    if ($path === '/reservations/request' && $method === 'POST') {
        ReservationsController::createPublic($pdo);
        exit();
    }
    if ($path === '/reservations/admin' && $method === 'POST') {
        ReservationsController::createAdmin($pdo);
        exit();
    }
    if (preg_match('#^/reservations/(\d+)/status$#', $path, $m) && $method === 'PUT') {
        ReservationsController::updateStatus($pdo, $m[1]);
        exit();
    }
    if (preg_match('#^/reservations/(\d+)/whatsapp$#', $path, $m) && $method === 'GET') {
        ReservationsController::getWhatsAppLink($pdo, $m[1]);
        exit();
    }
    if (preg_match('#^/reservations/(\d+)$#', $path, $m) && $method === 'DELETE') {
        ReservationsController::delete($pdo, $m[1]);
        exit();
    }

    // --- FINANCE ROUTES ---
    if ($path === '/finance/summary' && $method === 'GET') {
        FinanceController::getSummary($pdo);
        exit();
    }
    if ($path === '/finance' && $method === 'GET') {
        FinanceController::getAll($pdo);
        exit();
    }
    if ($path === '/finance' && $method === 'POST') {
        FinanceController::create($pdo);
        exit();
    }
    if (preg_match('#^/finance/(\d+)$#', $path, $m) && $method === 'DELETE') {
        FinanceController::delete($pdo, $m[1]);
        exit();
    }

    // --- BLOG ROUTES ---
    if ($path === '/blog' && $method === 'GET') {
        BlogController::getAll($pdo, true);
        exit();
    }
    if ($path === '/blog/admin' && $method === 'GET') {
        BlogController::getAll($pdo, false);
        exit();
    }
    if ($path === '/blog' && $method === 'POST') {
        BlogController::create($pdo);
        exit();
    }
    if (preg_match('#^/blog/(\d+)$#', $path, $m)) {
        if ($method === 'PUT') {
            BlogController::update($pdo, $m[1]);
            exit();
        } elseif ($method === 'DELETE') {
            BlogController::delete($pdo, $m[1]);
            exit();
        }
    }
    if (preg_match('#^/blog/([^/]+)$#', $path, $m) && $method === 'GET') {
        BlogController::getBySlug($pdo, $m[1]);
        exit();
    }

    // --- SETTINGS ROUTES ---
    if ($path === '/settings' && $method === 'GET') {
        SettingsController::getSettings($pdo);
        exit();
    }
    if ($path === '/settings' && $method === 'PUT') {
        SettingsController::updateSettings($pdo);
        exit();
    }

    // --- UPLOAD ROUTE ---
    if ($path === '/upload' && $method === 'POST') {
        UploadController::uploadImage($pdo);
        exit();
    }

    // --- HEALTH / ROOT ---
    if ($path === '/' || $path === '') {
        echo json_encode([
            'success' => true,
            'service' => 'API Pousada Monte Alto - Arraial do Cabo',
            'version' => '1.0.0',
            'timestamp' => date('c')
        ]);
        exit();
    }

    // 404 Route Not Found
    http_response_code(404);
    echo json_encode(['error' => 'Rota não encontrada: ' . $method . ' ' . $path]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erro interno do servidor',
        'details' => $e->getMessage()
    ]);
}
