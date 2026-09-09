<?php
// backend/api/controllers/ChatController.php

class ChatController {

    private static $defaultKeys = [
        'AIzaSyCHGG9m1yJJy1ffn5OXnF4QtH4GkQU8sWo',
        'AIzaSyDTq2Juy_-GBmUqUENkaMuEIT9pDaIpnyY',
        'AIzaSyBVDPCS8_oMYVQQO0eHUysi7cSKzPMeD_Q',
        'AIzaSyAW3_ob0bZSQ96GIpw3btCO_pihxSUynvg',
        'AIzaSyB-V7bHPnrKtxZuOVLorob2bLsvscRWSSA',
        'AIzaSyCDLzafLWD9P49plPqdvgjA2j3OfuWGreQ',
        'AIzaSyDrxWGEeDTKI9Qb9wI5V-7PcVAC4suNTXM',
        'AIzaSyBQRNLnzkpObcJAEipYpT9ghSlvB58f4Tg',
        'AIzaSyDphR7H4w1_GkXcoxbZ9S0a_Nogf0Ama6E',
        'AIzaSyDZFrvCFhMMlOAvIBIST0eTKT5XBC3sHrI',
        'AIzaSyCW8D7QdaHCrGLwl087vJl34tHFw_IHof0',
        'AIzaSyDBun_96_TZuoItLMkf9lSv7qvdkVmQGFo',
        'AIzaSyDOnJLiyMNThtfghZ-u9CMRd9twQUYNdos'
    ];

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
            // Fallback response if Google API is temporarily unreachable on all keys
            echo json_encode([
                'success' => true,
                'response' => 'Estou finalizando sua consulta! Para garantir o melhor atendimento e confirmar valores promocionais de imediato, toque no botão abaixo para falar com nossa equipe no WhatsApp.',
                'action' => 'open_whatsapp',
                'whatsapp_url' => self::buildWhatsAppUrl($knowledge['settings']['whatsapp'] ?? '5521969493569', 'Olá! Gostaria de informações sobre disponibilidade e reservas na Pousada Monte Alto.')
            ]);
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
            isset($data['is_active']) ? (int)$data['is_active'] : null,
            $data['system_instructions'] ?? null,
            $data['welcome_message_pt'] ?? null,
            $data['welcome_message_en'] ?? null,
            $data['welcome_message_es'] ?? null,
            $keysJson
        ]);

        echo json_encode(['success' => true, 'message' => 'Configurações de IA salvas com sucesso']);
    }

    // --- PRIVATE HELPERS ---

    private static function getAiSettingsFromDb($pdo) {
        $stmt = $pdo->query("SELECT * FROM ai_settings WHERE id = 1");
        $row = $stmt->fetch();
        if (!$row) {
            return [
                'agent_name' => 'Marina - Concierge Monte Alto',
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
            'is_active' => (bool)$row['is_active'],
            'system_instructions' => $row['system_instructions'] ?? '',
            'welcome_message_pt' => $row['welcome_message_pt'],
            'welcome_message_en' => $row['welcome_message_en'],
            'welcome_message_es' => $row['welcome_message_es'],
            'keys' => $keys
        ];
    }

    private static function buildKnowledgeBase($pdo) {
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

    private static function callGeminiWithRotation($keys, $systemPrompt, $messages) {
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

        $payload = json_encode([
            'systemInstruction' => [
                'parts' => [['text' => $systemPrompt]]
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.7,
                'topP' => 0.95,
                'maxOutputTokens' => 1024
            ]
        ]);

        // Shuffle or iterate keys for rotation with failover
        $keysPool = $keys;
        shuffle($keysPool); // Randomize to distribute load evenly

        foreach ($keysPool as $apiKey) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . trim($apiKey);

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_TIMEOUT, 12);
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
                        'key_used' => substr($apiKey, 0, 8) . '...'
                    ];
                }
            }
            // If 429 (Resource Exhausted) or 503, loop continues to next key!
        }

        return ['success' => false, 'error' => 'Todas as chaves esgotaram a cota momentaneamente'];
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
                $notes = $actionData['notes'] ?? 'Lead e Pré-reserva captados pelo Concierge IA Gemini 2.5 Flash';

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
}
