<?php
// backend/api/middleware/AuthMiddleware.php

function requireAuth($pdo) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: No token provided']);
        exit();
    }
    
    $token = $matches[1];
    $tokenParts = explode(':', base64_decode($token));
    
    if (count($tokenParts) !== 2) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: Invalid token format']);
        exit();
    }
    
    list($userId, $userEmail) = $tokenParts;
    
    $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE id = ? AND email = ?");
    $stmt->execute([$userId, $userEmail]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: User not found']);
        exit();
    }
    
    return $user;
}
