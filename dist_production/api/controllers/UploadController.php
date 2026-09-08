<?php
// backend/api/controllers/UploadController.php

class UploadController {

    public static function uploadImage($pdo) {
        requireAuth($pdo);
        
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum arquivo enviado ou erro no upload']);
            return;
        }
        
        $file = $_FILES['file'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
        if (!in_array($ext, $allowed)) {
            http_response_code(400);
            echo json_encode(['error' => 'Formato de imagem inválido. Formatos permitidos: JPG, PNG, WEBP, GIF, AVIF']);
            return;
        }
        
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $fileName = 'img_' . uniqid() . '.' . $ext;
        $targetPath = $uploadDir . $fileName;
        
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $referer = $_SERVER['HTTP_REFERER'] ?? '';
            $requestUri = $_SERVER['REQUEST_URI'] ?? '';
            $isMonteAlto = (strpos($referer, '/montealto') !== false || strpos($requestUri, '/montealto') !== false);
            
            // Relative URL that works seamlessly across dev proxy and Apache production
            $url = ($isMonteAlto ? '/montealto' : '') . '/api/uploads/' . $fileName;
            
            echo json_encode([
                'success' => true,
                'file_name' => $fileName,
                'url' => $url,
                'file_url' => $url,
                'message' => 'Imagem enviada com sucesso'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao salvar arquivo no servidor']);
        }
    }
}
