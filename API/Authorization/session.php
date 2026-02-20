<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$user = current_user();
if (!$user) {
    respond([
        'ok' => true,
        'authenticated' => false,
    ]);
}

respond([
    'ok' => true,
    'authenticated' => true,
    'user' => $user,
]);
