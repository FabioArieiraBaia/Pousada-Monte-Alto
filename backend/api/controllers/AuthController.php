<?php
// backend/api/controllers/AuthController.php

class AuthController {
    public static function login($pdo) {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');
        
        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => 'E-mail e senha são obrigatórios']);
            return;
        }
        
        $stmt = $pdo->prepare("SELECT id, name, email, password_hash, role FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Credenciais inválidas']);
            return;
        }
        
        // Generate Token
        $token = base64_encode($user['id'] . ':' . $user['email']);
        
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ]);
    }
    
    public static function me($pdo) {
        $user = requireAuth($pdo);
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
    }
}
