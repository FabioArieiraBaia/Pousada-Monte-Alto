<?php
// backend/api/sitemap.php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/SitemapController.php';

$pdo = getDatabaseConnection();
renderDynamicSitemap($pdo);
