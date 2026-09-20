<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$data_file      = 'sensor_data.json';
$setpoints_file = 'setpoints.json';

// ============================================================
// POST — Recebe dados do ESP32
// ============================================================
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($input) {
        $input['timestamp'] = date('Y-m-d H:i:s');
        file_put_contents($data_file, json_encode($input));

        // ✅ NOVO: salva setpoints separadamente, se vieram no pacote
        $setpoints = [];
        if (file_exists($setpoints_file)) {
            $setpoints = json_decode(file_get_contents($setpoints_file), true) ?: [];
        }
        if (isset($input['setpoint_ph'])) $setpoints['setpoint_ph'] = $input['setpoint_ph'];
        if (isset($input['setpoint_ec'])) $setpoints['setpoint_ec'] = $input['setpoint_ec'];
        if ($setpoints) {
            file_put_contents($setpoints_file, json_encode($setpoints));
        }

        echo json_encode(['status' => 'success', 'message' => 'Dados recebidos']);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Dados inválidos']);
    }
    exit;
}

// ============================================================
// GET — Retorna dados para o dashboard
// ============================================================
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        if (!file_exists($data_file)) {
        echo json_encode(['status' => 'waiting', 'message' => 'Aguardando ESP32']);
        exit;
    }

    $response = json_decode(file_get_contents($data_file), true) ?: [];

    // Aplica setpoints salvos (sobrescreve o que veio no POST, se houver)
    if (file_exists($setpoints_file)) {
        $setpoints = json_decode(file_get_contents($setpoints_file), true) ?: [];
        $response['setpoint_ph'] = $setpoints['setpoint_ph'] ?? 7.0;
        $response['setpoint_ec'] = $setpoints['setpoint_ec'] ?? 1.2;
    }

    echo json_encode($response);
    exit;
}

// Método não suportado
http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Método não permitido']);
