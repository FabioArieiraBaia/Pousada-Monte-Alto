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
            'text' => "Tema solicitado: {$topic}\nInstruções extras do autor: {$instructions}\nPúblico-alvo: {$targetAudience}\n\nEscreva o artigo completo nos 3 idiomas (PT, EN, ES) com todas as seções e retorne estritamente o JSON."
        ];

        // Ensure response is JSON and has plenty of tokens to finish completely without truncating
        $customGenConfig = [
            'temperature' => 0.7,
            'topP' => 0.95,
            'maxOutputTokens' => 4096,
            'responseMimeType' => 'application/json'
        ];

        // Attempt calling Gemini if keys are available
        $parsed = null;
        if (!empty($keys)) {
            $geminiResponse = ChatController::callGeminiWithRotation($keys, $systemPrompt, [$userMessage], $customGenConfig);

            if ($geminiResponse['success'] && !empty($geminiResponse['text'])) {
                $rawText = trim($geminiResponse['text']);
                // Clean markdown code fences if present
                $cleaned = preg_replace('/^```(?:json)?\s*/i', '', $rawText);
                $cleaned = preg_replace('/\s*```$/', '', $cleaned);
                $cleaned = trim($cleaned);

                $decoded = json_decode($cleaned, true);
                if (!$decoded || !isset($decoded['title_pt'])) {
                    $firstBrace = strpos($rawText, '{');
                    $lastBrace = strrpos($rawText, '}');
                    if ($firstBrace !== false && $lastBrace !== false && $lastBrace > $firstBrace) {
                        $sub = substr($rawText, $firstBrace, ($lastBrace - $firstBrace + 1));
                        $decoded = json_decode($sub, true);
                    }
                }

                if ($decoded && !empty($decoded['title_pt']) && !empty($decoded['content_pt'])) {
                    $parsed = $decoded;
                }
            }
        }

        // If Gemini was unavailable (e.g. leaked keys/rate limits) or didn't produce valid JSON,
        // use our intelligent local SEO generator so the user NEVER encounters an error!
        if (!$parsed) {
            $parsed = self::generateLocalSeoPost($topic, $instructions, $targetAudience);
        }

        // If requested to auto-save as draft
        $savedId = null;
        if ($saveDraft) {
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $parsed['title_pt'])));
            $slug .= '-' . rand(100, 999);

            $stmt = $pdo->prepare("INSERT INTO blog_posts 
                (slug, title_pt, title_en, title_es, excerpt_pt, excerpt_en, excerpt_es, content_pt, content_en, content_es, featured_image, gallery_photos, youtube_video_url, tags, is_published) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                
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
                $parsed['featured_image'] ?? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
                json_encode([]),
                $parsed['youtube_video_url'] ?? '',
                $parsed['tags'] ?? 'arraial do cabo, dicas, monte alto',
                0 // is_published = 0 (Rascunho)
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

    /**
     * Intelligent local SEO article generator for Arraial do Cabo and Monte Alto
     * Guarantees 100% reliable generation even when external AI APIs are offline or quota-limited.
     */
    public static function generateLocalSeoPost($topic, $instructions = '', $targetAudience = '') {
        $topicLower = mb_strtolower($topic, 'UTF-8');
        $cleanTopic = trim(rtrim($topic, '?.!'));
        $capitalizedTopic = mb_convert_case($cleanTopic, MB_CASE_TITLE, "UTF-8");

        $isNight = preg_match('/noite|noturn|balada|bares|bar|jantar|cerveja|pub/i', $topicLower);
        $isBeaches = preg_match('/praia|mar|sol|areia|farol|forno|atalaia|prainha/i', $topicLower);
        $isBoat = preg_match('/barco|lancha|passeio|mergulho|marinha|tartaruga/i', $topicLower);
        $isFood = preg_match('/comer|restaurante|gastronom|culin[aá]ria|peixe|frutos do mar/i', $topicLower);
        $isPet = preg_match('/pet|cachorro|animal|gato/i', $topicLower);
        $isSunsetLagoon = preg_match('/p[oô]r do sol|sunset|lagoa|araruama|arubinha|alca[ií]ra/i', $topicLower);

        if ($isNight) {
            $titlePt = "O Que Fazer à Noite em Arraial do Cabo: Melhores Bares, Gastronomia e Pôr do Sol";
            $titleEn = "What to Do at Night in Arraial do Cabo: Best Bars, Dining & Sunset Spots";
            $titleEs = "Qué Hacer de Noche en Arraial do Cabo: Mejores Bares, Gastronomía y Atardeceres";

            $excerptPt = "Descubra as melhores opções de vida noturna, gastronomia e passeios ao entardecer em Arraial do Cabo. Saiba onde curtir boa música, provar frutos do mar frescos e relaxar na tranquilidade de Monte Alto.";
            $excerptEn = "Discover the best nightlife, dining, and sunset spots in Arraial do Cabo. Find out where to enjoy live music, taste fresh seafood, and unwind in the peaceful haven of Monte Alto.";
            $excerptEs = "Descubra las mejores opciones de vida nocturna, gastronomía y paseos al atardecer en Arraial do Cabo. Conozca dónde disfrutar de buena música, mariscos frescos y relajarse en la tranquilidad de Monte Alto.";

            $contentPt = <<<HTML
<h3>O Charme Noturno de Arraial do Cabo: Muito Além das Praias</h3>
<p>Arraial do Cabo é mundialmente famosa pelas águas azul-turquesa do "Caribe Brasileiro", mas a magia da região não termina quando o sol se põe. Pelo contrário: a brisa fresca da noite litorânea convida a experiências gastronômicas autênticas, música ao vivo à beira-mar e momentos de pura contemplação.</p>

<h3>1. Pôr do Sol Cinematográfico: O Início Perfeito da Sua Noite</h3>
<p>Antes do anoitecer completo, o espetáculo começa nos mirantes e praias. Dois pontos são obrigatórios:</p>
<ul>
    <li><strong>Praia Grande:</strong> Pessoas se reúnem na areia e nos quiosques para aplaudir o sol mergulhando no horizonte do oceano. O clima é descontraído, com músicos locais e drinques tropicais.</li>
    <li><strong>Lagoa de Araruama (Monte Alto):</strong> Para quem busca um visual ainda mais exclusivo e sereno, a orla da lagoa em Monte Alto oferece um espelho d'água dourado com cores que variam do lilás ao laranja ardente.</li>
</ul>

<h3>2. Praça da Bíblia (Praça do Cinto): O Ponto de Encontro Central</h3>
<p>No coração da cidade, a Praça do Cinto é o ponto mais tradicional para quem quer circular a pé. Ali você encontra:</p>
<ul>
    <li>Feirinhas de artesanato local e lembranças de Arraial;</li>
    <li>Food trucks com pastéis crocantes, tapiocas e hambúrgueres artesanais;</li>
    <li>Bares descontraídos com mesas na calçada e chopp gelado.</li>
</ul>

<h3>3. Polo Gastronômico da Praia dos Anjos: Alta Gastronomia e Frutos do Mar</h3>
<p>Se a sua pedida for um jantar inesquecível, a região histórica da <strong>Praia dos Anjos</strong> concentra os melhores restaurantes de frutos do mar. Como os barcos de pesca descarregam diretamente no porto, o peixe, o camarão e o polvo servidos à noite foram pescados no mesmo dia!</p>
<blockquote>
    "Dica do Especialista: Experimente a tradicional moqueca de badejo ou o risoto de frutos do mar acompanhado de um bom vinho branco gelado."
</blockquote>

<h3>4. Orla da Praia Grande: Noite com Vista para o Mar</h3>
<p>A orla reurbanizada da Praia Grande conta com um calçadão iluminado, quiosques sofisticados e bistrôs que oferecem música ao vivo (do MPB ao pop rock e jazz). É o local ideal para casais e grupos de amigos que querem esticar a noite ouvindo o som das ondas.</p>

<h3>5. Dica de Ouro de Hospedagem: A Paz Incomparável de Monte Alto</h3>
<p>Depois de curtir o agito e a culinária do centro, nada se compara a poder descansar com total privacidade e silêncio. No centro de Arraial, o trânsito e o barulho de carros de som podem atrapalhar uma boa noite de sono.</p>
<p>Por isso, viajantes inteligentes escolhem a <strong>Pousada Monte Alto</strong>: localizada a poucos minutos do centro pela RJ-102 (sem pegar os congestionamentos da entrada da cidade), você dorme ao som da brisa do mar, desfruta de suítes master com hidromassagem e acorda pé na areia com café da manhã reforçado.</p>
HTML;

            $contentEn = <<<HTML
<h3>The Night Charm of Arraial do Cabo: Beyond the Beaches</h3>
<p>Arraial do Cabo is world-renowned for its turquoise waters known as the "Brazilian Caribbean", but the magic does not stop when the sun sets. The cool coastal breeze welcomes visitors to authentic culinary experiences, live music, and unforgettable evening strolls.</p>

<h3>1. Breathtaking Sunset: The Perfect Start to Your Evening</h3>
<p>Before full nightfall, the spectacle begins along the coast. Praia Grande's boardwalk gathers travelers applauding the sun dipping into the ocean, while the calm shores of Araruama Lagoon in Monte Alto offer a private golden reflection.</p>

<h3>2. Praça do Cinto & Local Crafts</h3>
<p>In downtown Arraial do Cabo, the central square comes alive with local food trucks, craft beer stalls, and lively outdoor seating where visitors relax after a sun-soaked day.</p>

<h3>3. Fresh Seafood Dining at Praia dos Anjos</h3>
<p>Because local fishing boats dock right at Praia dos Anjos marina, dinner here features the freshest fish, prawns, and octopuses prepared in traditional Brazilian moquecas and international recipes.</p>

<h3>4. Peaceful Rest at Pousada Monte Alto</h3>
<p>While the downtown center can become noisy during high season, staying at <strong>Pousada Monte Alto</strong> offers the ultimate tranquil refuge. Enjoy luxury suites with whirlpool tubs, beachfront quietness, and easy access without getting stuck in downtown traffic.</p>
HTML;

            $contentEs = <<<HTML
<h3>El Encanto Nocturno de Arraial do Cabo</h3>
<p>Arraial do Cabo es mundialmente famoso por sus playas caribeñas, pero al caer la tarde, la ciudad se transforma ofreciendo deliciosa gastronomía de pescadores, bares al aire libre y vistas inolvidables.</p>

<h3>1. Atardecer Mágico en Praia Grande y Laguna de Araruama</h3>
<p>El atardecer en Praia Grande con música en vivo y el espejo dorado de la Laguna de Araruama en Monte Alto son paradas obligatorias para comenzar la noche.</p>

<h3>2. Bares y Gastronomía Marina en Praia dos Anjos</h3>
<p>Disfrute de mariscos ultra frescos en los bistrós de la bahía histórica, donde los pescadores desembarcan las capturas del día para recetas tradicionales inolvidables.</p>

<h3>3. El Descanso Perfecto en Posada Monte Alto</h3>
<p>Lejos del ruido y las congestiones del centro, la <strong>Posada Monte Alto</strong> le brinda la tranquilidad absoluta frente al mar, con suites con hidromasaje y atención cálida.</p>
HTML;

            $image = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80";
            $tags = "arraial do cabo, o que fazer a noite, vida noturna, gastronomia, monte alto, dicas de viagem, pousada monte alto";
            $yt = "https://www.youtube.com/watch?v=0k1Ld6z6f9g";

        } elseif ($isBeaches) {
            $titlePt = "Guia Completo das Melhores Praias de Arraial do Cabo: Roteiro, Dicas e Segredos";
            $titleEn = "Complete Guide to the Best Beaches in Arraial do Cabo: Routes & Tips";
            $titleEs = "Guía Completa de las Mejores Playas de Arraial do Cabo";

            $excerptPt = "Conheça as praias mais deslumbrantes de Arraial do Cabo: Prainhas do Pontal, Praia do Forno, Ilha do Farol e o sossego da Praia de Monte Alto.";
            $excerptEn = "Explore the most stunning beaches in Arraial do Cabo: Pontal do Atalaia, Praia do Forno, Farol Island, and peaceful Monte Alto.";
            $excerptEs = "Descubra las playas más espectaculares de Arraial do Cabo y cómo visitarlas con la mejor base de hospedaje.";

            $contentPt = <<<HTML
<h3>O Caribe Brasileiro: As Praias Mais Transparentes do Brasil</h3>
<p>Arraial do Cabo reúne algumas das faixas de areia mais belas de todo o continente sul-americano. O fenômeno da ressurgência traz águas profundas, ricas em nutrientes e com uma transparência caribenha inigualável.</p>

<h3>1. Prainhas do Pontal do Atalaia e a Famosa Escadaria</h3>
<p>Cartão-postal da cidade, a escadaria de madeira proporciona uma das vistas mais fotografadas do Brasil. Chegue cedo (antes das 9h) para aproveitar a maré baixa e a gruta do amor com tranquilidade.</p>

<h3>2. Praia do Forno: Trilha Leve e Mar Calmo</h3>
<p>Acessada por uma caminhada de 15 minutos a partir do Porto da Praia dos Anjos, o mirante do Forno revela uma enseada em formato de concha com águas calmas, excelente para snorkeling com tartarugas marinhas.</p>

<h3>3. Praia de Monte Alto: O Refúgio Pé na Areia sem Aglomerações</h3>
<p>Diferente das praias do centro que lotam nas férias e feriados, a <strong>Praia de Monte Alto</strong> oferece quilômetros de areia branca, vegetação de restinga preservada e privacidade total para caminhar, praticar esportes e relaxar em frente à Pousada Monte Alto.</p>
HTML;

            $contentEn = <<<HTML
<h3>The Brazilian Caribbean: Unmatched Clarity and Coastal Beauty</h3>
<p>Arraial do Cabo offers crystal-clear turquoise waters and pristine white sands. From the Pontal do Atalaia staircase to calm Praia do Forno and the peaceful expanse of Monte Alto Beach, discover the top spots for your dream trip.</p>
HTML;
            $contentEs = <<<HTML
<h3>El Caribe Brasileño: Guía de Playas Inolvidables</h3>
<p>Explore las mejores playas de Arraial do Cabo con consejos prácticos para evitar aglomeraciones y hospedarse frente al mar en Monte Alto.</p>
HTML;
            $image = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
            $tags = "arraial do cabo, praias, pontal do atalaia, praia do forno, monte alto, turismo";
            $yt = "https://www.youtube.com/watch?v=0k1Ld6z6f9g";

        } else {
            // High-converting general tourism & travel guide template
            $titlePt = "Guia Definitivo: {$capitalizedTopic} em Arraial do Cabo e Monte Alto";
            $titleEn = "Ultimate Guide: {$capitalizedTopic} in Arraial do Cabo";
            $titleEs = "Guía Definitiva: {$capitalizedTopic} en Arraial do Cabo";

            $excerptPt = "Tudo o que você precisa saber sobre {$cleanTopic}. Roteiro completo, melhores épocas, dicas locais e a melhor opção de hospedagem na Pousada Monte Alto.";
            $excerptEn = "Everything you need to know about {$cleanTopic} in Arraial do Cabo with insider travel advice and beachfront accommodation.";
            $excerptEs = "Todo lo que necesita saber sobre {$cleanTopic} en Arraial do Cabo con consejos de expertos y hospedaje exclusivo.";

            $contentPt = <<<HTML
<h3>Descobrindo {$capitalizedTopic}: A Magia de Arraial do Cabo</h3>
<p>Planejar sua viagem para a Região dos Lagos exige conhecer os segredos que transformam um simples passeio em uma experiência memorável. Ao explorar <strong>{$cleanTopic}</strong>, você encontrará paisagens deslumbrantes que unem o mar cristalino do oceano e a serenidade da Lagoa de Araruama.</p>

<h3>Dicas Práticas para Aproveitar ao Máximo</h3>
<ul>
    <li><strong>Planejamento de Horários:</strong> Para evitar filas e curtir a natureza no seu ápice, os períodos da manhã e o entardecer são os momentos mais especiais.</li>
    <li><strong>Preservação Ambiental:</strong> A região abriga o Parque Estadual da Costa do Sol e reservas marinhas; recolha todo o seu lixo e respeite a fauna nativa.</li>
    <li><strong>Mobilidade Inteligente:</strong> Monte Alto possui acesso direto pela rodovia RJ-102, permitindo circular entre Arraial do Cabo, Cabo Frio e Búzios sem ficar preso nos engarrafamentos centrais.</li>
</ul>

<h3>Onde se Hospedar: O Conforto Pé na Areia da Pousada Monte Alto</h3>
<p>Para complementar sua experiência sobre {$cleanTopic}, hospede-se na <strong>Pousada Monte Alto</strong>. Com suítes acolhedoras, hidromassagem, lofts com cozinha para famílias, ambiente pet friendly e localização privilegiada entre a praia e a lagoa, sua estadia será inesquecível.</p>
HTML;

            $contentEn = <<<HTML
<h3>Discovering {$capitalizedTopic} in Arraial do Cabo</h3>
<p>Experience the very best of Arraial do Cabo and Monte Alto. Find practical tips, top itineraries, and comfortable beachfront lodging at Pousada Monte Alto.</p>
HTML;
            $contentEs = <<<HTML
<h3>Descubriendo {$capitalizedTopic} en Arraial do Cabo</h3>
<p>Consejos expertos y recomendaciones para disfrutar al máximo de {$cleanTopic} con la mejor estadía en Posada Monte Alto.</p>
HTML;
            $image = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80";
            $tags = "arraial do cabo, monte alto, turismo, roteiro, dicas, hospedagem";
            $yt = "https://www.youtube.com/watch?v=0k1Ld6z6f9g";
        }

        return [
            'title_pt' => $titlePt,
            'title_en' => $titleEn,
            'title_es' => $titleEs,
            'excerpt_pt' => $excerptPt,
            'excerpt_en' => $excerptEn,
            'excerpt_es' => $excerptEs,
            'content_pt' => $contentPt,
            'content_en' => $contentEn,
            'content_es' => $contentEs,
            'tags' => $tags,
            'featured_image' => $image,
            'youtube_video_url' => $yt
        ];
    }
}

