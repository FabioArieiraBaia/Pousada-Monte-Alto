<?php
// backend/api/controllers/BlogController.php

class BlogController {

    public static function getAll($pdo, $publicOnly = true) {
        $fields = $publicOnly 
            ? "id, slug, title_pt, title_en, title_es, excerpt_pt, excerpt_en, excerpt_es, featured_image, gallery_photos, youtube_video_url, tags, is_published, published_at"
            : "id, slug, title_pt, title_en, title_es, excerpt_pt, excerpt_en, excerpt_es, content_pt, content_en, content_es, featured_image, gallery_photos, youtube_video_url, tags, is_published, published_at";
        
        $sql = "SELECT {$fields} FROM blog_posts";
        if ($publicOnly) {
            // 1 = Publicado no feed do blog. 0 = Rascunho (apenas admin). 2 = Não listado (acessível via link direto, mas oculto da listagem pública).
            $sql .= " WHERE is_published = 1";
        }
        $sql .= " ORDER BY published_at DESC";
        
        $stmt = $pdo->query($sql);
        $posts = $stmt->fetchAll();

        foreach ($posts as &$p) {
            if (!empty($p['gallery_photos'])) {
                $decoded = json_decode($p['gallery_photos'], true);
                $p['gallery_photos'] = is_array($decoded) ? $decoded : [];
            } else {
                $p['gallery_photos'] = [];
            }
        }
        
        echo json_encode(['success' => true, 'data' => $posts]);
    }

    public static function getBySlug($pdo, $slug) {
        $stmt = $pdo->prepare("SELECT * FROM blog_posts WHERE slug = ?");
        $stmt->execute([$slug]);
        $post = $stmt->fetch();
        
        if (!$post) {
            http_response_code(404);
            echo json_encode(['error' => 'Artigo não encontrado']);
            return;
        }

        if (!empty($post['gallery_photos'])) {
            $decoded = json_decode($post['gallery_photos'], true);
            $post['gallery_photos'] = is_array($decoded) ? $decoded : [];
        } else {
            $post['gallery_photos'] = [];
        }
        
        echo json_encode(['success' => true, 'data' => $post]);
    }

    public static function create($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $slug = trim($data['slug'] ?? '');
        if (empty($slug)) {
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['title_pt'] ?? 'artigo-' . time())));
        }
        
        $galleryPhotos = isset($data['gallery_photos']) ? (is_array($data['gallery_photos']) ? json_encode($data['gallery_photos']) : $data['gallery_photos']) : null;
        
        $stmt = $pdo->prepare("INSERT INTO blog_posts 
            (slug, title_pt, title_en, title_es, excerpt_pt, excerpt_en, excerpt_es, content_pt, content_en, content_es, featured_image, gallery_photos, youtube_video_url, tags, is_published) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
        $stmt->execute([
            $slug,
            $data['title_pt'] ?? 'Novo Artigo',
            $data['title_en'] ?? $data['title_pt'] ?? 'New Article',
            $data['title_es'] ?? $data['title_pt'] ?? 'Nuevo Artículo',
            $data['excerpt_pt'] ?? '',
            $data['excerpt_en'] ?? '',
            $data['excerpt_es'] ?? '',
            $data['content_pt'] ?? '',
            $data['content_en'] ?? '',
            $data['content_es'] ?? '',
            $data['featured_image'] ?? '',
            $galleryPhotos,
            $data['youtube_video_url'] ?? '',
            $data['tags'] ?? '',
            isset($data['is_published']) ? intval($data['is_published']) : 1
        ]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Artigo publicado com sucesso']);
    }

    public static function update($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $galleryPhotos = isset($data['gallery_photos']) ? (is_array($data['gallery_photos']) ? json_encode($data['gallery_photos']) : $data['gallery_photos']) : null;

        $stmt = $pdo->prepare("UPDATE blog_posts SET 
            title_pt = ?, title_en = ?, title_es = ?,
            excerpt_pt = ?, excerpt_en = ?, excerpt_es = ?,
            content_pt = ?, content_en = ?, content_es = ?,
            featured_image = ?, gallery_photos = ?, youtube_video_url = ?, tags = ?,
            is_published = ?
            WHERE id = ?");
            
        $stmt->execute([
            $data['title_pt'] ?? '',
            $data['title_en'] ?? $data['title_pt'] ?? '',
            $data['title_es'] ?? $data['title_pt'] ?? '',
            $data['excerpt_pt'] ?? '',
            $data['excerpt_en'] ?? '',
            $data['excerpt_es'] ?? '',
            $data['content_pt'] ?? '',
            $data['content_en'] ?? '',
            $data['content_es'] ?? '',
            $data['featured_image'] ?? '',
            $galleryPhotos,
            $data['youtube_video_url'] ?? '',
            $data['tags'] ?? '',
            isset($data['is_published']) ? intval($data['is_published']) : 1,
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Artigo atualizado com sucesso']);
    }

    public static function delete($pdo, $id) {
        requireAuth($pdo);
        $pdo->prepare("DELETE FROM blog_posts WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Artigo excluído com sucesso']);
    }

    /**
     * AI Writer Agent: POST /api/blog/generate-ai
     * Receives topic / keywords / instructions and generates a complete, high-converting SEO post.
     * Optionally saves directly as draft (is_published = 0).
     */
    public static function generateWithAi($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $topic = trim($data['topic'] ?? '');
        $instructions = trim($data['instructions'] ?? '');
        $targetAudience = trim($data['target_audience'] ?? 'Turistas, casais e famílias buscando tranquilidade em Arraial do Cabo');
        $saveDraft = !empty($data['save_draft']);

        if (empty($topic)) {
            http_response_code(400);
            echo json_encode(['error' => 'Por favor, informe o tema ou título desejado para a matéria']);
            return;
        }

        // Fetch AI keys from ChatController
        require_once __DIR__ . '/ChatController.php';
        $aiConfig = ChatController::getAiSettingsFromDb($pdo);
        $keys = $aiConfig['keys'];

        $systemPrompt = <<<PROMPT
Você é o Redator Chefe de Conteúdo & Especialista Sênior em SEO da "Pousada Monte Alto", localizada na Praia de Monte Alto em Arraial do Cabo - RJ.
Monte Alto é um paraíso tranquilo localizado entre a praia oceânica de areias brancas (pé na areia) e a Lagoa de Araruama (com o pôr do sol mais espetacular da Região dos Lagos), permitindo fugir do trânsito do centro de Arraial do Cabo e Cabo Frio. A pousada possui suítes master com hidromassagem, lofts com cozinha para famílias e é pet friendly.

Sua missão é escrever um artigo de blog COMPLETO, profundo, persuasivo, com alto apelo de conversão para reservas e altamente otimizado para SEO no Google.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON PURO):
Você DEVE responder APENAS com um objeto JSON válido (sem blocos markdown ```json, sem comentários), contendo exatamente os seguintes campos:
{
  "title_pt": "Título chamativo e otimizado para SEO em Português",
  "title_en": "Catchy SEO Title in English",
  "title_es": "Título atractivo optimizado para SEO en Español",
  "excerpt_pt": "Resumo persuasivo de 2 ou 3 frases em Português para prender a atenção do leitor",
  "excerpt_en": "Persuasive 2-3 sentence summary in English",
  "excerpt_es": "Resumen persuasivo de 2-3 oraciones en Español",
  "content_pt": "HTML rico do artigo em Português (use <h3>, <p>, <strong>, <ul>, <li>, <blockquote>, etc. Mínimo 4 seções detalhadas com dicas práticas, distâncias e mencionando a Pousada Monte Alto como a melhor base de hospedagem)",
  "content_en": "Full rich HTML article in English (structured with <h3>, <p>, <strong>, <ul>, <li>, <blockquote>)",
  "content_es": "Artículo completo en HTML en Español (estructurado con <h3>, <p>, <strong>, <ul>, <li>, <blockquote>)",
  "tags": "tags separadas por virgula (ex: arraial do cabo, praias, pousada monte alto, dicas)",
  "featured_image": "URL de foto de alta qualidade do Unsplash relevante sobre praia/lagoa/natureza",
  "suggested_youtube_search": "termo para busca de vídeo no YouTube sobre o assunto"
}
PROMPT;

        $userMessage = [
            'sender' => 'user',
            'text' => "Tema solicitado: {$topic}\nInstruções extras do autor: {$instructions}\nPúblico-alvo: {$targetAudience}\n\nEscreva agora o artigo completo com todas as seções e retorne estritamente o JSON."
        ];

        $geminiResponse = ChatController::callGeminiWithRotation($keys, $systemPrompt, [$userMessage]);

        if (!$geminiResponse['success']) {
            http_response_code(500);
            echo json_encode(['error' => 'Não foi possível gerar o conteúdo com o agente de IA: ' . ($geminiResponse['error'] ?? 'Falha de comunicação')]);
            return;
        }

        $rawText = trim($geminiResponse['text']);
        // Clean possible markdown code fences if emitted
        $cleanedJson = preg_replace('/^```(?:json)?\s*/i', '', $rawText);
        $cleanedJson = preg_replace('/\s*```$/', '', $cleanedJson);

        $parsed = json_decode($cleanedJson, true);
        if (!$parsed || !isset($parsed['title_pt'])) {
            // Fallback attempt: find JSON block inside text
            if (preg_match('/\{[\s\S]*\}/', $rawText, $matches)) {
                $parsed = json_decode($matches[0], true);
            }
        }

        if (!$parsed || !isset($parsed['title_pt'])) {
            http_response_code(500);
            echo json_encode(['error' => 'Resposta do modelo não pôde ser interpretada como JSON válido. Tente novamente.', 'raw' => $rawText]);
            return;
        }

        // If requested to auto-save as draft
        $savedId = null;
        if ($saveDraft) {
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $parsed['title_pt'])));
            $slug .= '-' . rand(100, 999);

            $stmt = $pdo->prepare("INSERT INTO blog_posts 
                (slug, title_pt, title_en, title_es, excerpt_pt, excerpt_en, excerpt_es, content_pt, content_en, content_es, featured_image, gallery_photos, youtube_video_url, tags, is_published) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)");
                
            $stmt->execute([
                $slug,
                $parsed['title_pt'],
                $parsed['title_en'] ?? $parsed['title_pt'],
                $parsed['title_es'] ?? $parsed['title_pt'],
                $parsed['excerpt_pt'] ?? '',
                $parsed['excerpt_en'] ?? '',
                $parsed['excerpt_es'] ?? '',
                $parsed['content_pt'] ?? '',
                $parsed['content_en'] ?? '',
                $parsed['content_es'] ?? '',
                $parsed['featured_image'] ?? '',
                json_encode([]),
                '',
                $parsed['tags'] ?? 'arraial do cabo, dicas, monte alto',
                0 // Draft!
            ]);
            $savedId = $pdo->lastInsertId();
        }

        echo json_encode([
            'success' => true,
            'message' => $saveDraft ? 'Artigo gerado pela IA e salvo como Rascunho com sucesso!' : 'Artigo gerado pela IA com sucesso!',
            'draft_saved' => $saveDraft,
            'post_id' => $savedId,
            'data' => $parsed
        ]);
    }
}
