<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simula dados do dispositivo
$data = [
    'pH' => round(6.5 + (mt_rand(-10, 10) / 10), 1),
    'EC' => round(1.2 + (mt_rand(-5, 5) / 10), 1),
    'temperatura' => round(25 + (mt_rand(-10, 10) / 2), 1),
    'umidade' => round(60 + mt_rand(-20, 20), 1),
    'luminosidade' => round(50 + mt_rand(-30, 30), 1),
    'rele_ph' => mt_rand(0, 1),
    'rele_ec' => mt_rand(0, 1),
    'rele_bomb' => mt_rand(0, 1),
    'rssi' => mt_rand(-120, -70),
    'setpoint_ph' => 7.0,
    'setpoint_ec' => 1.2
];

echo json_encode($data);
?>