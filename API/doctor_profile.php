<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/validation.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$user = require_role(['doctor']);
$pdo = db();
$data = json_input();
$action = (string) ($data['action'] ?? 'get');

if ($action === 'get') {
    $stmt = $pdo->prepare(
        'SELECT id, first_name, last_name, full_name, username, email, phone, gender, nic_number, photo_path, department
         FROM users
         WHERE id = :id AND role = "doctor"
         LIMIT 1'
    );
    $stmt->execute(['id' => (int) $user['id']]);
    $profile = $stmt->fetch();
    if (!$profile) {
        respond(['ok' => false, 'message' => 'Doctor not found'], 404);
    }
    respond(['ok' => true, 'profile' => $profile]);
}

if ($action === 'update') {
    $password = (string) ($data['password'] ?? '');
    $photoPath = trim((string) ($data['photo_path'] ?? ''));

    if ($password === '' && $photoPath === '') {
        respond(['ok' => false, 'message' => 'Provide a new password or profile photo'], 422);
    }

    if ($password !== '' && !is_valid_password($password)) {
        respond(['ok' => false, 'message' => 'Password must be exactly 8 characters and include letters and numbers only'], 422);
    }

    if ($photoPath !== '' && strpos($photoPath, 'uploads/doctors/') !== 0) {
        respond(['ok' => false, 'message' => 'Invalid doctor photo path'], 422);
    }

    if ($password !== '' && $photoPath !== '') {
        $stmt = $pdo->prepare(
            'UPDATE users
             SET password_hash = :password_hash, photo_path = :photo_path
             WHERE id = :id AND role = "doctor"'
        );
        $stmt->execute([
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'photo_path' => $photoPath,
            'id' => (int) $user['id'],
        ]);
    } elseif ($password !== '') {
        $stmt = $pdo->prepare(
            'UPDATE users
             SET password_hash = :password_hash
             WHERE id = :id AND role = "doctor"'
        );
        $stmt->execute([
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'id' => (int) $user['id'],
        ]);
    } else {
        $stmt = $pdo->prepare(
            'UPDATE users
             SET photo_path = :photo_path
             WHERE id = :id AND role = "doctor"'
        );
        $stmt->execute([
            'photo_path' => $photoPath,
            'id' => (int) $user['id'],
        ]);
    }

    respond(['ok' => true]);
}

respond(['ok' => false, 'message' => 'Invalid action'], 422);
