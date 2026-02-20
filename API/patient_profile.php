<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/validation.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$user = require_role(['patient']);
$pdo = db();
$data = json_input();
$action = (string) ($data['action'] ?? 'get');

if ($action === 'get') {
    $stmt = $pdo->prepare(
        'SELECT id, full_name, username, email, phone, gender, photo_path
         FROM users
         WHERE id = :id AND role = "patient"
         LIMIT 1'
    );
    $stmt->execute(['id' => (int) $user['id']]);
    $profile = $stmt->fetch();
    if (!$profile) {
        respond(['ok' => false, 'message' => 'Patient not found'], 404);
    }
    respond(['ok' => true, 'profile' => $profile]);
}

if ($action === 'update') {
    $fullName = trim((string) ($data['full_name'] ?? ''));
    $username = trim((string) ($data['username'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $phone = trim((string) ($data['phone'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    $photoPath = trim((string) ($data['photo_path'] ?? ''));

    if ($fullName === '' || $username === '' || $email === '' || $phone === '') {
        respond(['ok' => false, 'message' => 'Full name, username, email, and phone are required'], 422);
    }

    if (!is_valid_full_name($fullName)) {
        respond(['ok' => false, 'message' => 'Full name is invalid or too long'], 422);
    }
    if (!is_valid_username($username)) {
        respond(['ok' => false, 'message' => 'Username must be alphanumeric and up to 10 characters'], 422);
    }
    if (!is_valid_email($email)) {
        respond(['ok' => false, 'message' => 'Invalid email address'], 422);
    }
    if (!is_valid_phone($phone)) {
        respond(['ok' => false, 'message' => 'Phone number must start with 0 and contain exactly 10 digits'], 422);
    }
    if ($password !== '' && !is_valid_password($password)) {
        respond(['ok' => false, 'message' => 'Password must be exactly 8 characters and include letters and numbers only'], 422);
    }

    $check = $pdo->prepare(
        'SELECT id FROM users
         WHERE id <> :id AND (username = :username OR email = :email)
         LIMIT 1'
    );
    $check->execute([
        'id' => (int) $user['id'],
        'username' => $username,
        'email' => $email,
    ]);
    if ($check->fetch()) {
        respond(['ok' => false, 'message' => 'Username or email already exists'], 409);
    }

    if ($password !== '') {
        $stmt = $pdo->prepare(
            'UPDATE users
             SET full_name = :full_name, username = :username, email = :email, phone = :phone, photo_path = :photo_path, password_hash = :password_hash
             WHERE id = :id AND role = "patient"'
        );
        $stmt->execute([
            'full_name' => $fullName,
            'username' => $username,
            'email' => $email,
            'phone' => $phone,
            'photo_path' => $photoPath !== '' ? $photoPath : null,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'id' => (int) $user['id'],
        ]);
    } else {
        $stmt = $pdo->prepare(
            'UPDATE users
             SET full_name = :full_name, username = :username, email = :email, phone = :phone, photo_path = :photo_path
             WHERE id = :id AND role = "patient"'
        );
        $stmt->execute([
            'full_name' => $fullName,
            'username' => $username,
            'email' => $email,
            'phone' => $phone,
            'photo_path' => $photoPath !== '' ? $photoPath : null,
            'id' => (int) $user['id'],
        ]);
    }

    $_SESSION['user'] = [
        'id' => (int) $user['id'],
        'role' => 'patient',
        'name' => $fullName,
        'username' => $username,
    ];

    respond([
        'ok' => true,
        'user' => $_SESSION['user'],
    ]);
}

respond(['ok' => false, 'message' => 'Invalid action'], 422);
