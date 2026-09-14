<?php
// backend/api/controllers/ChatController.php

class ChatController {

    private static $defaultKeys = [];

    /**
     * Public chat endpoint: POST /api/chat
     */
    public static function handleChat($pdo) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $messages = $data['messages'] ?? [];
        $leadContext = $data['lead'] ?? [];

        if (empty($messages)) {
            http_response_code(400);
            echo json_encode(['error' => 'Histórico de mensagens não informado']);
            return;
        }

        // 1. Fetch AI settings and active keys
        $aiConfig = self::getAiSettingsFromDb($pdo);
        if (!$aiConfig['is_active']) {
            echo json_encode([
                'success' => true,
                'response' => 'Nosso atendimento automático está temporariamente em manutenção. Por favor, fale conosco diretamente pelo WhatsApp!',
                'action' => 'open_whatsapp'
            ]);
            return;
        }

        // 2. Fetch Knowledge Base from SQLite (accommodations, prices, settings, attractions)
        $knowledge = self::buildKnowledgeBase($pdo);

        // 3. Build System Prompt for Sales & Pre-reservation
        $systemPrompt = self::buildSystemPrompt($aiConfig, $knowledge);

        // 4. Send request to Gemini 2.5 Flash with Key Rotation and Failover
        $geminiResponse = self::callGeminiWithRotation($aiConfig['keys'], $systemPrompt, $messages);

        if (!$geminiResponse['success']) {
            // Intelligent local concierge engine fallback when Gemini is offline or quota-limited
            $fallback = self::generateLocalChatResponse($pdo, $messages, $knowledge, $aiConfig);
            echo json_encode($fallback);
            return;
        }

        $rawText = $geminiResponse['text'];

        // 5. Parse any structured Actions emitted by Gemini (e.g., PRE_RESERVATION or QUOTE)
        $parsed = self::parseModelAction($rawText, $pdo, $messages, $knowledge);

        echo json_encode([
            'success' => true,
            'response' => $parsed['displayText'],
            'action' => $parsed['action'],
            'lead_saved' => $parsed['lead_saved'] ?? false,
            'pre_reservation' => $parsed['pre_reservation'] ?? null,
            'whatsapp_url' => $parsed['whatsapp_url'] ?? null
        ]);
    }

    /**
     * Calculate price estimation for given accommodation and date range
     */
    public static function calculateStayPrice($pdo, $accommodationId, $checkIn, $checkOut) {
        $stmt = $pdo->prepare("SELECT * FROM accommodations WHERE id = ?");
        $stmt->execute([$accommodationId]);
        $acc = $stmt->fetch();
        if (!$acc) return null;

        $startDate = new DateTime($checkIn);
        $endDate = new DateTime($checkOut);
        if ($endDate <= $startDate) return null;

        $nights = $startDate->diff($endDate)->days;
        if ($nights <= 0) return null;

        // Fetch seasonal prices
        $stmtSeason = $pdo->prepare("SELECT * FROM seasonal_prices WHERE accommodation_id = ?");
        $stmtSeason->execute([$accommodationId]);
        $seasons = $stmtSeason->fetchAll();

        $total = 0;
        $current = clone $startDate;

        for ($i = 0; $i < $nights; $i++) {
            $dateStr = $current->format('Y-m-d');
            $nightPrice = (float)$acc['base_price'];

            foreach ($seasons as $s) {
                if ($dateStr >= $s['start_date'] && $dateStr <= $s['end_date']) {
                    $nightPrice = (float)$s['price_per_night'];
                    break;
                }
            }

            $total += $nightPrice;
            $current->modify('+1 day');
        }

        return [
            'accommodation' => $acc['name_pt'],
            'nights' => $nights,
            'total' => $total,
            'average_per_night' => round($total / $nights, 2)
        ];
    }

    /**
     * Admin: GET /api/leads
     */
    public static function getLeads($pdo) {
        requireAuth($pdo);
        $stmt = $pdo->query("
            SELECT l.*, a.name_pt as accommodation_name, r.status as reservation_status
            FROM leads_capture l
            LEFT JOIN accommodations a ON l.accommodation_id = a.id
            LEFT JOIN reservations r ON l.reservation_id = r.id
            ORDER BY l.created_at DESC
        ");
        $leads = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $leads]);
    }

    /**
     * Admin: PUT /api/leads/{id}
     */
    public static function updateLeadStatus($pdo, $id) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $data['status'] ?? 'new';
        $notes = $data['notes'] ?? null;

        $stmt = $pdo->prepare("UPDATE leads_capture SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$status, $notes, $id]);

        echo json_encode(['success' => true, 'message' => 'Status do lead atualizado com sucesso']);
    }

    /**
     * Public endpoint: GET /api/ai-config
     */
    public static function getPublicConfig($pdo) {
        $config = self::getAiSettingsFromDb($pdo);
        echo json_encode([
            'success' => true,
            'data' => [
                'is_active' => $config['is_active'],
                'agent_name' => $config['agent_name'],
                'agent_avatar' => $config['agent_avatar'] ?? '',
                'welcome_message_pt' => $config['welcome_message_pt'],
                'welcome_message_en' => $config['welcome_message_en'],
                'welcome_message_es' => $config['welcome_message_es']
            ]
        ]);
    }

    /**
     * Admin: GET /api/ai-settings
     */
    public static function getAiSettings($pdo) {
        requireAuth($pdo);
        $config = self::getAiSettingsFromDb($pdo);
        echo json_encode(['success' => true, 'data' => $config]);
    }

    /**
     * Admin: PUT /api/ai-settings
     */
    public static function updateAiSettings($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $keysJson = isset($data['api_keys']) && is_array($data['api_keys']) 
            ? json_encode(array_values(array_filter($data['api_keys']))) 
            : null;

        $stmt = $pdo->prepare("
            UPDATE ai_settings 
            SET agent_name = COALESCE(?, agent_name),
                agent_avatar = ?,
                is_active = COALESCE(?, is_active),
                system_instructions = ?,
                welcome_message_pt = COALESCE(?, welcome_message_pt),
                welcome_message_en = COALESCE(?, welcome_message_en),
                welcome_message_es = COALESCE(?, welcome_message_es),
                api_keys_json = COALESCE(?, api_keys_json),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        ");

        $stmt->execute([
            $data['agent_name'] ?? null,
            isset($data['agent_avatar']) ? $data['agent_avatar'] : '',
            isset($data['is_active']) ? (int)$data['is_active'] : null,
            $data['system_instructions'] ?? null,
            $data['welcome_message_pt'] ?? null,
            $data['welcome_message_en'] ?? null,
            $data['welcome_message_es'] ?? null,
            $keysJson
        ]);

        echo json_encode(['success' => true, 'message' => 'Configurações de IA salvas com sucesso']);
    }

    /**
     * Admin: POST /api/ai-settings/test-keys
     */
    public static function testAiKeys($pdo) {
        requireAuth($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $keys = $data['keys'] ?? [];

        if (empty($keys) || !is_array($keys)) {
            $config = self::getAiSettingsFromDb($pdo);
            $keys = $config['keys'];
        }

        $results = [];
        $workingCount = 0;

        foreach ($keys as $idx => $key) {
            $key = trim($key);
            if (empty($key)) continue;

            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $key;
            $payload = json_encode(['contents' => [['role' => 'user', 'parts' => [['text' => 'ping']]]]]);

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_TIMEOUT, 4);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $res = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $isOk = ($httpCode === 200);
            if ($isOk) $workingCount++;

            $json = json_decode($res, true);
            $err = $json['error']['message'] ?? ($isOk ? 'Chave Ativa e Operacional' : "Erro HTTP {$httpCode}");

            $results[] = [
                'index' => $idx + 1,
                'key_prefix' => substr($key, 0, 8) . '...',
                'status' => $isOk ? 'active' : 'error',
                'http_code' => $httpCode,
                'message' => $err
            ];
        }

        echo json_encode([
            'success' => true,
            'working_count' => $workingCount,
            'total' => count($results),
            'details' => $results
        ]);
    }

    // --- PRIVATE HELPERS ---

    public static function getAiSettingsFromDb($pdo) {
        $stmt = $pdo->query("SELECT * FROM ai_settings LIMIT 1");
        $row = $stmt ? $stmt->fetch() : null;

        if (!$row) {
            return [
                'agent_name' => 'Marina - Concierge Monte Alto',
                'agent_avatar' => '',
                'is_active' => 1,
                'system_instructions' => '',
                'welcome_message_pt' => 'Olá! Bem-vindo à Pousada Monte Alto em Arraial do Cabo. Como posso ajudar com sua hospedagem pé na areia hoje?',
                'welcome_message_en' => 'Hello! Welcome to Pousada Monte Alto in Arraial do Cabo. How can I help with your beachfront stay today?',
                'welcome_message_es' => '¡Hola! Bienvenido a Posada Monte Alto en Arraial do Cabo. ¿Cómo puedo ayudarte con tu estadía frente al mar hoy?',
                'keys' => self::$defaultKeys
            ];
        }

        $keys = json_decode($row['api_keys_json'] ?? '[]', true);
        if (empty($keys) || !is_array($keys)) {
            $keys = self::$defaultKeys;
        }

        return [
            'agent_name' => $row['agent_name'] ?? 'Marina - Concierge Monte Alto',
            'agent_avatar' => $row['agent_avatar'] ?? '',
            'is_active' => (bool)$row['is_active'],
            'system_instructions' => $row['system_instructions'] ?? '',
            'welcome_message_pt' => $row['welcome_message_pt'],
            'welcome_message_en' => $row['welcome_message_en'],
            'welcome_message_es' => $row['welcome_message_es'],
            'keys' => $keys
        ];
    }

    public static function buildKnowledgeBase($pdo) {
        // Accommodations
        $stmtAcc = $pdo->query("
            SELECT a.*, 
                (SELECT photo_url FROM accommodation_photos WHERE accommodation_id = a.id AND is_cover = 1 LIMIT 1) as cover_photo
            FROM accommodations a 
            WHERE a.is_active = 1
        ");
        $accommodations = $stmtAcc->fetchAll();

        // Seasonal Prices
        $stmtSeasons = $pdo->query("SELECT * FROM seasonal_prices WHERE end_date >= DATE('now')");
        $seasons = $stmtSeasons->fetchAll();

        // Site settings
        $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM site_settings");
        $settings = [];
        foreach ($stmtSettings->fetchAll() as $s) {
            $settings[$s['setting_key']] = $s['setting_value'];
        }

        // Attractions / Beaches
        $stmtAtt = $pdo->query("SELECT name_pt, duration_badge_pt, distance_label_pt, description_pt FROM tourist_attractions WHERE is_active = 1");
        $attractions = $stmtAtt->fetchAll();

        return [
            'accommodations' => $accommodations,
            'seasons' => $seasons,
            'settings' => $settings,
            'attractions' => $attractions
        ];
    }

    private static function buildSystemPrompt($aiConfig, $knowledge) {
        $accList = [];
        foreach ($knowledge['accommodations'] as $a) {
            $accList[] = "- ID: {$a['id']} | Nome: {$a['name_pt']} (Slug: {$a['slug']}) | Tipo: {$a['type']} | Capacidade Máx: {$a['max_guests']} pessoas | Aceita Pet: " . ($a['accepts_pets'] ? 'SIM 🐶🐱' : 'NÃO') . " | Preço Base: R$ " . number_format($a['base_price'], 2, ',', '.') . "/diária | Descrição: {$a['description_pt']}";
        }
        $accText = implode("\n", $accList);

        $promoMode = ($knowledge['settings']['promo_mode'] ?? '1') === '1';
        $promoBadge = $knowledge['settings']['promo_badge'] ?? 'Oferta Especial';
        $promoText = $knowledge['settings']['promo_text'] ?? 'Valores Promocionais Sob Consulta';
        $pousadaAddress = $knowledge['settings']['address'] ?? 'Travessa Américo Reis, Distrito de Monte Alto, Arraial do Cabo - RJ';
        $whatsappNumber = $knowledge['settings']['whatsapp'] ?? '5521969493569';

        $prompt = <<<PROMPT
Você é a {$aiConfig['agent_name']}, a Concierge e Vendedora Virtual oficial da "Pousada Monte Alto", localizada no charmoso distrito de Monte Alto em Arraial do Cabo - RJ.

SUA MISSÃO PRINCIPAL:
Encantar o visitante, tirar dúvidas com simpatia e autoridade local, filtrar as necessidades do lead (datas, número de hóspedes, se traz pets), ESTIMAR VALORES DE ESTADIA e CONDUZIR O CLIENTE PARA O FECHAMENTO DA PRÉ-RESERVA e contato com o WhatsApp da Pousada.

INFORMAÇÕES EXCLUSIVAS DA POUSADA MONTE ALTO (USE COMO ARGUMENTO DE VENDA IMBATÍVEL):
1. PÉ NA AREIA REAL: A pousada fica a poucos passos da orla da Praia de Monte Alto (mar calmo, restinga preservada, sem o tumulto e superlotação das praias do centro).
2. PÔR DO SOL NA LAGOA: A apenas 3 minutos a pé da orla da Lagoa de Araruama com pôr do sol cinematográfico.
3. ACESSO FÁCIL SEM ENGARRAFAMENTOS: Chegada direta pela RJ-102. Quem se hospeda aqui NÃO enfrenta as filas de horas de trânsito para entrar no centro de Arraial do Cabo ou Cabo Frio em alta temporada e feriados.
4. PET FRIENDLY: Acolhemos animais de estimação com muito carinho nas acomodações permitidas.
5. Endereço: {$pousadaAddress}. WhatsApp Oficial: {$whatsappNumber}.

SUÍTES & LOFTS CADASTRADOS NA POUSADA:
{$accText}

MODO DE TARIFAS ATUAL:
PROMO_MODE: {$promoMode} (Texto exibido no site: "{$promoBadge} - {$promoText}")

COMO TRATAR PREÇOS E ESTIMATIVAS:
- Se o cliente perguntar datas e você souber a acomodação e período, VOCÊ DEVE ESTIMAR O VALOR baseado na diária base (ou diárias calculadas). 
- Caso o promo_mode esteja ativo, mencione o valor estimado e reforce: "Estamos com valores promocionais sob consulta para fechamento direto no WhatsApp com condições exclusivas!".
- Sempre informe o valor total estimado e o número de diárias calculadas.

MECANISMO AUTOMÁTICO DE PRÉ-RESERVA (MUITO IMPORTANTE):
Quando o cliente manifestar intenção clara de reserva e você tiver (ou ele fornecer) os dados:
- Nome do cliente
- Telefone / WhatsApp
- Nome ou ID da acomodação
- Data de Check-in e Check-out (formato YYYY-MM-DD)
- Quantidade de hóspedes e se traz pets

Você DEVE incluir no FINAL da sua resposta exatamente o bloco JSON com a tag:
<<<PRE_RESERVATION_ACTION
{
  "guest_name": "Nome do Hóspede",
  "guest_phone": "Telefone ou WhatsApp",
  "guest_email": "Email se houver ou vazio",
  "accommodation_id": 1,
  "check_in": "2026-10-15",
  "check_out": "2026-10-18",
  "guests": 2,
  "has_pets": 0,
  "notes": "Observações relevantes da conversa"
}
PRE_RESERVATION_ACTION>>>

DIRETRIZES DE ATENDIMENTO:
- Tom acolhedor, profissional e caloroso (hospitalidade litorânea).
- Respostas objetivas, elegantes e com boa formatação (use negrito para destaque).
- Sempre finalize convidando o visitante a dar o próximo passo ou chamando no WhatsApp.
- Se o cliente não forneceu telefone ou datas ainda, conduza a conversa amigavelmente perguntando quando pretendem vir e quantas pessoas serão.

INSTRUÇÕES EXTRAS DO ADMINISTRADOR DA POUSADA:
{$aiConfig['system_instructions']}
PROMPT;

        return $prompt;
    }

    public static function callGeminiWithRotation($keys, $systemPrompt, $messages, $customGenConfig = []) {
        // Build Gemini conversation contents
        $contents = [];

        foreach ($messages as $msg) {
            $role = ($msg['sender'] === 'user' || $msg['role'] === 'user') ? 'user' : 'model';
            $text = $msg['text'] ?? $msg['content'] ?? '';
            if (!empty($text)) {
                $contents[] = [
                    'role' => $role,
                    'parts' => [['text' => $text]]
                ];
            }
        }

        if (empty($contents)) {
            return ['success' => false, 'error' => 'No messages'];
        }

        $defaultGenConfig = [
            'temperature' => 0.7,
            'topP' => 0.95,
            'maxOutputTokens' => 1024
        ];
        $genConfig = array_merge($defaultGenConfig, $customGenConfig);

        $payload = json_encode([
            'systemInstruction' => [
                'parts' => [['text' => $systemPrompt]]
            ],
            'contents' => $contents,
            'generationConfig' => $genConfig
        ]);

        // Shuffle or iterate keys for rotation with failover
        $keysPool = $keys;
        shuffle($keysPool); // Randomize to distribute load evenly

        $consecutiveBlocked = 0;

        foreach ($keysPool as $apiKey) {
            $apiKey = trim($apiKey);
            if (empty($apiKey)) continue;

            $models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
            foreach ($models as $model) {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $apiKey;

                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
                curl_setopt($ch, CURLOPT_TIMEOUT, 6);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

                $result = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode === 200 && $result) {
                    $json = json_decode($result, true);
                    $candidateText = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if (!empty($candidateText)) {
                        return [
                            'success' => true,
                            'text' => $candidateText,
                            'model_used' => $model,
                            'key_used' => substr($apiKey, 0, 8) . '...'
                        ];
                    }
                }
                // If leaked (403), don't retry other models with the same broken key
                if ($httpCode === 403) {
                    $consecutiveBlocked++;
                    break;
                }
            }

            // If 3 keys are permanently blocked/leaked, the entire pool is compromised - failover immediately!
            if ($consecutiveBlocked >= 3) {
                break;
            }
        }

        return ['success' => false, 'error' => 'Todas as chaves esgotaram a cota ou estão indisponíveis'];
    }

    private static function parseModelAction($rawText, $pdo, $messages, $knowledge) {
        $action = 'none';
        $leadSaved = false;
        $preReservation = null;
        $cleanText = $rawText;
        $whatsappNumber = $knowledge['settings']['whatsapp'] ?? '5521969493569';
        $whatsappUrl = null;

        // Check for PRE_RESERVATION_ACTION block
        if (preg_match('/<<<PRE_RESERVATION_ACTION\s*(\{.*?\})\s*PRE_RESERVATION_ACTION>>>/s', $rawText, $matches)) {
            $action = 'pre_reservation_created';
            $cleanText = trim(str_replace($matches[0], '', $rawText));
            $actionData = json_decode($matches[1], true);

            if ($actionData) {
                $guestName = $actionData['guest_name'] ?? 'Hóspede Interessado';
                $guestPhone = preg_replace('/\D/', '', $actionData['guest_phone'] ?? '');
                $guestEmail = $actionData['guest_email'] ?? ($guestPhone . '@lead.pousada');
                $accId = (int)($actionData['accommodation_id'] ?? 1);
                $checkIn = $actionData['check_in'] ?? date('Y-m-d', strtotime('+7 days'));
                $checkOut = $actionData['check_out'] ?? date('Y-m-d', strtotime('+10 days'));
                $guests = (int)($actionData['guests'] ?? 2);
                $hasPets = (int)($actionData['has_pets'] ?? 0);
                $notes = $actionData['notes'] ?? 'Lead e Pré-reserva captados pelo Concierge IA';

                // Calculate exact stay price
                $priceCalc = self::calculateStayPrice($pdo, $accId, $checkIn, $checkOut);
                $totalPrice = $priceCalc['total'] ?? 0;

                try {
                    // 1. Create Pending Reservation in `reservations`
                    $stmtRes = $pdo->prepare("
                        INSERT INTO reservations (
                            accommodation_id, guest_name, guest_email, guest_phone,
                            check_in, check_out, adults_count, has_pets,
                            total_price, status, payment_status, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?)
                    ");
                    $stmtRes->execute([
                        $accId, $guestName, $guestEmail, $guestPhone,
                        $checkIn, $checkOut, $guests, $hasPets,
                        $totalPrice, $notes
                    ]);
                    $resId = $pdo->lastInsertId();

                    // 2. Save into `leads_capture`
                    $stmtLead = $pdo->prepare("
                        INSERT INTO leads_capture (
                            name, whatsapp, email, checkin_date, checkout_date,
                            guests, has_pets, accommodation_id, reservation_id,
                            estimated_total, notes, status, chat_history
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
                    ");
                    $stmtLead->execute([
                        $guestName, $guestPhone, $guestEmail, $checkIn, $checkOut,
                        $guests, $hasPets, $accId, $resId,
                        $totalPrice, $notes, json_encode($messages, JSON_UNESCAPED_UNICODE)
                    ]);
                    $leadSaved = true;

                    // Get accommodation name
                    $stmtAccName = $pdo->prepare("SELECT name_pt FROM accommodations WHERE id = ?");
                    $stmtAccName->execute([$accId]);
                    $accName = $stmtAccName->fetchColumn() ?: 'Suíte/Loft';

                    // Disparar Notificações (Push no celular do Admin e WhatsApp CallMeBot)
                    try {
                        require_once __DIR__ . '/../services/NotificationService.php';
                        NotificationService::notifyNewLead($pdo, [
                            'guest_name' => $guestName,
                            'guest_phone' => $guestPhone,
                            'guest_email' => $guestEmail,
                            'accommodation_name' => $accName,
                            'check_in' => $checkIn,
                            'check_out' => $checkOut,
                            'adults_count' => $guests,
                            'has_pets' => $hasPets,
                            'total_price' => $totalPrice,
                            'source' => 'Agente de IA Concierge (Chat)',
                            'notes' => $notes
                        ]);
                    } catch (Exception $e) {
                        error_log("Erro ao disparar notificações de lead do chat: " . $e->getMessage());
                    }

                    $preReservation = [
                        'id' => $resId,
                        'guest_name' => $guestName,
                        'accommodation_name' => $accName,
                        'check_in' => $checkIn,
                        'check_out' => $checkOut,
                        'nights' => $priceCalc['nights'] ?? 0,
                        'total_price' => $totalPrice
                    ];

                    // WhatsApp link ready to confirm
                    $waMsg = "Olá! Fiz uma pré-reserva no site com a concierge virtual para a {$accName} de " . date('d/m/Y', strtotime($checkIn)) . " a " . date('d/m/Y', strtotime($checkOut)) . " ({$guests} pessoas). Meu nome é {$guestName} e gostaria de confirmar!";
                    $whatsappUrl = self::buildWhatsAppUrl($whatsappNumber, $waMsg);

                } catch (Exception $e) {
                    error_log("Erro ao salvar pré-reserva: " . $e->getMessage());
                }
            }
        }

        // Generic WhatsApp fallback link if not pre-reservation
        if (!$whatsappUrl) {
            $whatsappUrl = self::buildWhatsAppUrl($whatsappNumber, 'Olá! Estou no site da Pousada Monte Alto e gostaria de falar com um atendente.');
        }

        return [
            'displayText' => $cleanText,
            'action' => $action,
            'lead_saved' => $leadSaved,
            'pre_reservation' => $preReservation,
            'whatsapp_url' => $whatsappUrl
        ];
    }

    private static function buildWhatsAppUrl($phone, $message) {
        $cleanPhone = preg_replace('/\D/', '', $phone);
        if (substr($cleanPhone, 0, 2) !== '55') {
            $cleanPhone = '55' . $cleanPhone;
        }
        return "https://wa.me/{$cleanPhone}?text=" . urlencode($message);
    }

    /**
     * Intelligent local concierge chat response
     * Acts when Gemini is unreachable or keys are expired, guaranteeing 100% uptime for visitors!
     */
    public static function generateLocalChatResponse($pdo, $messages, $knowledge, $aiConfig) {
        $whatsappNumber = $knowledge['settings']['whatsapp'] ?? '5521969493569';
        $agentName = $aiConfig['agent_name'] ?? 'Marina';

        // Extract last user message
        $lastUserMsg = '';
        for ($i = count($messages) - 1; $i >= 0; $i--) {
            $sender = $messages[$i]['sender'] ?? $messages[$i]['role'] ?? '';
            if ($sender === 'user') {
                $lastUserMsg = mb_strtolower(trim($messages[$i]['text'] ?? $messages[$i]['content'] ?? ''), 'UTF-8');
                break;
            }
        }

        $isRomantic = preg_match('/lua de mel|casal|rom[aâ]ntic|namorad|noivad|anivers[aá]rio de casamento|comemora[cç]|hidro|banheira/i', $lastUserMsg);
        $isBreakfast = preg_match('/caf[eé]|manh[aã]|refei[cç]|comida|restaurante|almo[cç]|jantar|cozinha/i', $lastUserMsg);
        $isCheckin = preg_match('/check[- ]?in|check[- ]?out|hor[aá]rio|chegada|sa[ií]da|entrar|sair/i', $lastUserMsg);
        $isAmenities = preg_match('/estacionamento|estacionar|carro|vaga|wi[- ]?fi|internet|ar[- ]condicionado|piscina|tv|smart|frigobar/i', $lastUserMsg);
        $isAttractions = preg_match('/praia do forno|pontal do atalaia|prainha|praia grande|passeio de barco|barco|lancha|mergulho|arubinha|lagoa|p[oô]r do sol/i', $lastUserMsg);
        $isPrice = preg_match('/pre[cç]o|valor|di[aá]ria|quanto custa|quanto est[aá]|or[cç]amento|custa|tarifa|promo[cç]/i', $lastUserMsg);
        $isPet = preg_match('/pet|cachorro|gato|animal|animais|porte/i', $lastUserMsg);
        $isLocation = preg_match('/onde fica|endere[cç]o|localiza[cç][aã]o|como chegar|dist[aâ]ncia|longe|perto|praia/i', $lastUserMsg);
        $isReservation = preg_match('/reserv|vaga|dispon[ií]vel|disponibilidade|quarto|su[ií]te|loft|agendar/i', $lastUserMsg);
        $isGreeting = preg_match('/^(ol[aá]|oi|bom dia|boa tarde|boa noite|tudo bem|como vai|ola)\b/i', $lastUserMsg);
        $isThanks = preg_match('/obrigad|valeu|agrade[cç]|show|perfeito|maravilha|legal|otimo|ótimo/i', $lastUserMsg);

        // Check if phone was provided in the message to automatically capture lead!
        $leadSaved = false;
        if (preg_match('/(\(?\d{2}\)?\s*9?\d{4}[-.\s]?\d{4})/', $lastUserMsg, $phoneMatches)) {
            $capturedPhone = preg_replace('/\D/', '', $phoneMatches[1]);
            $capturedName = 'Hóspede Interessado (Chat)';
            try {
                $stmtLead = $pdo->prepare("
                    INSERT INTO leads_capture (
                        name, whatsapp, email, checkin_date, checkout_date,
                        guests, has_pets, accommodation_id, reservation_id,
                        estimated_total, notes, status, chat_history
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NULL, 0, 'Captado via Concierge Marina', 'new', ?)
                ");
                $stmtLead->execute([
                    $capturedName, $capturedPhone, $capturedPhone . '@lead.pousada',
                    date('Y-m-d', strtotime('+7 days')), date('Y-m-d', strtotime('+10 days')),
                    2, 0, json_encode($messages, JSON_UNESCAPED_UNICODE)
                ]);
                $leadSaved = true;

                // Notificar admin imediatamente
                try {
                    require_once __DIR__ . '/../services/NotificationService.php';
                    NotificationService::notifyNewLead($pdo, [
                        'guest_name' => $capturedName,
                        'guest_phone' => $capturedPhone,
                        'accommodation_name' => 'Suíte Romântica / Master',
                        'source' => 'Chat Concierge Virtual',
                        'notes' => 'Contato deixado no chat: ' . $lastUserMsg
                    ]);
                } catch (Exception $e) {}

            } catch (Exception $e) {}
        }

        $waMsg = "Olá! Estive conversando com a Concierge virtual no site da Pousada Monte Alto e gostaria de mais informações!";

        if ($isRomantic) {
            $text = "🎉 **Parabéns pela Lua de Mel!** Que momento especial e abençoado! 🥂✨\n\n"
                  . "A **Pousada Monte Alto** é o destino dos sonhos para casais que buscam romance, tranquilidade e privacidade pé na areia em Arraial do Cabo.\n\n"
                  . "Para a sua Lua de Mel, recomendamos com carinho:\n"
                  . "🌹 **Suíte Romântica Sunset:** Nossa suíte mais apaixonante! Conta com banheira de hidromassagem privativa, varanda e uma vista inesquecível para o pôr do sol mais deslumbrante da Lagoa de Araruama.\n"
                  . "🌊 **Suíte Master Pé na Areia:** Cama king size, hidromassagem, ar-condicionado silencioso e a poucos passos da praia de Monte Alto.\n\n"
                  . "✨ *Dica dos noivos:* Mediante reserva antecipada, podemos organizar mimos especiais no quarto (espumante gelado, pétalas e arranjo romântico)!\n\n"
                  . "Vocês já definiram o período de **Check-in e Check-out**? Toque no botão do WhatsApp abaixo para falar com nossa recepção e garantir essa data mágica!";
            $waMsg = "Olá! Estou em Lua de Mel e gostaria de reservar uma suíte romântica com hidromassagem na Pousada Monte Alto!";

        } elseif ($isBreakfast) {
            $text = "🥐 **Alimentação & Gastronomia em Monte Alto:**\n\n"
                  . "• Nossas diárias proporcionam momentos deliciosos e tranquilos para começar bem o dia!\n"
                  . "• Se você busca total autonomia gastronômica para a família, nosso **Loft Massambaba** conta com cozinha privativa completa (geladeira, fogão, micro-ondas e utensílios).\n"
                  . "• Além disso, a poucos metros da pousada temos excelentes restaurantes e quiosques beira-mar com o melhor peixe fresco e frutos do mar de Arraial do Cabo!\n\n"
                  . "Gostaria de consultar as opções de acomodação para as suas datas?";
            $waMsg = "Olá! Gostaria de saber mais sobre as acomodações e alimentação na Pousada Monte Alto!";

        } elseif ($isCheckin) {
            $text = "⏰ **Horários e Políticas de Estadia:**\n\n"
                  . "• **Check-in:** A partir das **14:00h**;\n"
                  . "• **Check-out:** Até as **12:00h**;\n"
                  . "• *Chegada antecipada ou saída tardia:* Caso chegue antes, guardamos suas bagagens com segurança enquanto você já aproveita a praia em frente!\n\n"
                  . "Qual a data prevista para a sua chegada na Pousada Monte Alto?";
            $waMsg = "Olá! Gostaria de consultar horários e disponibilidade para me hospedar na Pousada Monte Alto!";

        } elseif ($isAmenities) {
            $text = "🏖️ **Comodidades & Conforto da Pousada Monte Alto:**\n\n"
                  . "🚗 **Estacionamento Privativo:** Vagas seguras e gratuitas para seu veículo na pousada;\n"
                  . "📶 **Wi-Fi de Alta Velocidade:** Cobertura rápida em todas as suítes e áreas comuns (ideal para home office na praia);\n"
                  . "❄️ **Climatização:** Ar-condicionado Split silencioso em todos os quartos;\n"
                  . "📺 **Smart TV & Frigobar:** Para seus momentos de relaxamento após um dia de sol;\n"
                  . "🛁 **Hidromassagem:** Disponível na *Suíte Romântica Sunset* e na *Suíte Master Pé na Areia*.\n\n"
                  . "Deseja conferir a disponibilidade para quantos hóspedes?";
            $waMsg = "Olá! Gostaria de saber detalhes das comodidades da Pousada Monte Alto!";

        } elseif ($isAttractions) {
            $text = "🌊 **Passeios & As Praias Mais Famosas de Arraial:**\n\n"
                  . "A Pousada Monte Alto é a melhor base para explorar toda a Região dos Lagos:\n"
                  . "🏖️ **Praia de Monte Alto:** Pé na areia, águas límpidas e tranquilas para relaxar sem muvuca;\n"
                  . "🌅 **Pôr do Sol da Lagoa de Araruama:** A apenas 3 minutos a pé da pousada;\n"
                  . "⛵ **Praia dos Anjos / Saída de Barcos:** A 15 min de carro para os passeios de barco até a Praia do Farol e Gruta Azul;\n"
                  . "🌴 **Prainhas do Atalaia & Praia do Forno:** A cerca de 18 min de carro;\n"
                  . "🚗 **Grande Vantagem:** Ficando em Monte Alto, você **não pega o trânsito quilométrico** de entrada de Arraial nos fins de semana e feriados!\n\n"
                  . "Para quais datas você planeja vir nos visitar?";
            $waMsg = "Olá! Gostaria de dicas de passeios e reserva na Pousada Monte Alto!";

        } elseif ($isPet) {
            $text = "Sim! Somos apaixonados por animais e a **Pousada Monte Alto é 100% Pet Friendly**! 🐶🐱\n\nTemos suítes e lofts com espaço perfeito para o seu pet relaxar e aproveitar as férias com a família, além de estarmos a poucos passos da Praia de Monte Alto, perfeita para passeios matinais com seu companheiro de 4 patas.\n\nQual o porte do seu pet e para quais datas vocês pretendem vir? Terei o maior prazer em indicar a melhor acomodação!";
            $waMsg = "Olá! Gostaria de viajar com meu pet e reservar na Pousada Monte Alto!";

        } elseif ($isPrice) {
            $text = "Nossas tarifas oferecem o melhor custo-benefício pé na areia da Região dos Lagos! Nossas opções incluem:\n\n"
                  . "• **Suíte Master Pé na Areia:** Cama king, ar-condicionado, banheira de hidromassagem e vista mar (a partir de R$ 380/diária);\n"
                  . "• **Loft Massambaba Família:** Cozinha equipada completa, acomoda até 4 pessoas e varanda com rede (a partir de R$ 420/diária);\n"
                  . "• **Suíte Jardim Tropical:** Ambiente romântico e privativo para casais (a partir de R$ 280/diária);\n"
                  . "• **Suíte Romântica Sunset:** Hidromassagem e vista deslumbrante do pôr do sol da Lagoa de Araruama.\n\n"
                  . "✨ **Estamos com condições promocionais exclusivas para reservas diretas!** Para quantas pessoas e qual o período desejado? Toque no WhatsApp para falar com nossa equipe!";
            $waMsg = "Olá! Gostaria de solicitar um orçamento de diárias na Pousada Monte Alto!";

        } elseif ($isLocation) {
            $text = "A **Pousada Monte Alto** fica na Travessa Américo Reis, no tranquilo distrito de Monte Alto em **Arraial do Cabo - RJ**.\n\n"
                  . "Nossa localização é um verdadeiro privilégio:\n"
                  . "🌊 **Pé na Areia:** A poucos passos da praia de Monte Alto (mar calmo, areia branquinha e sem superlotação);\n"
                  . "🌅 **Pôr do Sol da Lagoa:** A 3 minutos a pé da orla da Lagoa de Araruama com o pôr do sol mais espetacular do Rio;\n"
                  . "🚗 **Zero Engarrafamento:** Acesso direto pela RJ-102 sem pegar os congestionamentos de horas para entrar no centro de Arraial ou de Cabo Frio em feriados e alta temporada!\n"
                  . "📍 As praias centrais (Praia dos Anjos, Praia Grande, Prainha, Forno e Pontal do Atalaia) ficam a apenas 12 a 18 minutos de carro.";
            $waMsg = "Olá! Gostaria de saber como chegar e valores na Pousada Monte Alto!";

        } elseif ($isReservation) {
            $text = "Com certeza! Será um enorme prazer receber você na **Pousada Monte Alto**! 🎉\n\n"
                  . "Para verificarmos a disponibilidade e garantirmos a melhor tarifa promocional sem taxas de intermediários:\n\n"
                  . "1️⃣ Quais as datas de **Check-in e Check-out** desejadas?\n"
                  . "2️⃣ Quantos adultos e crianças virão?\n"
                  . "3️⃣ Pretende trazer algum pet?\n\n"
                  . "Você também pode tocar no botão do WhatsApp abaixo para falar agora mesmo com nossa equipe e garantir sua reserva de imediato!";
            $waMsg = "Olá! Gostaria de verificar disponibilidade para reservar na Pousada Monte Alto!";

        } elseif ($isThanks) {
            $text = "Eu que agradeço pelo carinho! 😊 É uma alegria imensa poder ajudar a planejar sua viagem para este paraíso que é Arraial do Cabo.\n\n"
                  . "Estarei sempre por aqui caso precise de mais dicas ou queira consultar acomodações. E se preferir um atendimento personalizado em tempo real, nossa equipe está pronta no WhatsApp!";
            $waMsg = "Olá! Estive no site da Pousada Monte Alto e gostaria de falar com a equipe!";

        } elseif ($isGreeting) {
            $text = "Olá! Seja muito bem-vindo(a) à **Pousada Monte Alto**! 🌊✨\n\n"
                  . "Como posso ajudar você hoje? Gostaria de saber sobre nossos valores promocionais, conhecer as suítes com hidromassagem ou verificar disponibilidade para uma data específica?";
            $waMsg = "Olá! Gostaria de informações sobre hospedagem na Pousada Monte Alto!";

        } else {
            // Contextual continuation - NEVER repeating the initial greeting block!
            $text = "Entendi perfeitamente! Como sua Concierge aqui na **Pousada Monte Alto**, posso te ajudar com:\n\n"
                  . "🛏️ **Conhecer nossas Suítes & Lofts:** Opções pé na areia com hidromassagem e lofts com cozinha;\n"
                  . "💰 **Consultar Valores & Disponibilidade:** Promoções especiais para reservas diretas;\n"
                  . "📍 **Dicas de Arraial do Cabo:** Praias, passeios de barco e pôr do sol na Lagoa de Araruama.\n\n"
                  . "O que você gostaria de explorar primeiro? Ou se preferir, toque no botão do WhatsApp abaixo para falar com nossa recepção!";
            $waMsg = "Olá! Gostaria de informações sobre reservas na Pousada Monte Alto: " . substr($lastUserMsg, 0, 80);
        }

        $whatsappUrl = self::buildWhatsAppUrl($whatsappNumber, $waMsg);

        return [
            'success' => true,
            'response' => $text,
            'action' => 'none',
            'lead_saved' => $leadSaved,
            'pre_reservation' => null,
            'whatsapp_url' => $whatsappUrl
        ];
    }
}
