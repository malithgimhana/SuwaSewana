<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/validation.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

require_role(['admin']);
$pdo = db();
$data = json_input();
$action = (string) ($data['action'] ?? '');

if ($action === 'list') {
    $stmt = $pdo->query(
        'SELECT id, full_name, username, email, phone, gender, created_at
         FROM users
         WHERE role = "patient"
         ORDER BY id DESC'
    );
    respond(['ok' => true, 'patients' => $stmt->fetchAll()]);
}

if ($action === 'create') {
    $fullName = trim((string) ($data['fullName'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $phone = trim((string) ($data['phone'] ?? ''));
    $username = trim((string) ($data['username'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    $gender = trim((string) ($data['gender'] ?? ''));

    if ($fullName === '' || $email === '' || $username === '' || $password === '') {
        respond(['ok' => false, 'message' => 'Required fields are missing or invalid'], 422);
    }

    if (!is_valid_full_name($fullName)) {
        respond(['ok' => false, 'message' => 'Full name is invalid or too long'], 422);
    }

    if (!is_valid_email($email)) {
        respond(['ok' => false, 'message' => 'Invalid email'], 422);
    }

    if ($phone !== '' && !is_valid_phone($phone)) {
        respond(['ok' => false, 'message' => 'Phone number must start with 0 and contain exactly 10 digits'], 422);
    }

    if (!is_valid_username($username)) {
        respond(['ok' => false, 'message' => 'Username must be alphanumeric and up to 10 characters'], 422);
    }

    if (!is_valid_password($password)) {
        respond(['ok' => false, 'message' => 'Password must be exactly 8 characters and include letters and numbers only'], 422);
    }

    $check = $pdo->prepare('SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1');
    $check->execute(['username' => $username, 'email' => $email]);
    if ($check->fetch()) {
        respond(['ok' => false, 'message' => 'Username or email already exists'], 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO users (full_name, username, email, phone, gender, password_hash, role)
         VALUES (:full_name, :username, :email, :phone, :gender, :password_hash, "patient")'
    );
    $stmt->execute([
        'full_name' => $fullName,
        'username' => $username,
        'email' => $email,
        'phone' => $phone !== '' ? $phone : null,
        'gender' => $gender !== '' ? $gender : null,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);

    respond(['ok' => true, 'id' => (int) $pdo->lastInsertId()], 201);
}

if ($action === 'update') {
    $id = (int) ($data['id'] ?? 0);
    $fullName = trim((string) ($data['fullName'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $phone = trim((string) ($data['phone'] ?? ''));
    $username = trim((string) ($data['username'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    $gender = trim((string) ($data['gender'] ?? ''));

    if ($id <= 0 || $fullName === '' || $email === '' || $username === '') {
        respond(['ok' => false, 'message' => 'Required fields are missing or invalid'], 422);
    }

    if (!is_valid_full_name($fullName)) {
        respond(['ok' => false, 'message' => 'Full name is invalid or too long'], 422);
    }

    if (!is_valid_email($email)) {
        respond(['ok' => false, 'message' => 'Invalid email'], 422);
    }

    if ($phone !== '' && !is_valid_phone($phone)) {
        respond(['ok' => false, 'message' => 'Phone number must start with 0 and contain exactly 10 digits'], 422);
    }

    if (!is_valid_username($username)) {
        respond(['ok' => false, 'message' => 'Username must be alphanumeric and up to 10 characters'], 422);
    }

    if ($password !== '' && !is_valid_password($password)) {
        respond(['ok' => false, 'message' => 'Password must be exactly 8 characters and include letters and numbers only'], 422);
    }

    $check = $pdo->prepare('SELECT id FROM users WHERE id <> :id AND (username = :username OR email = :email) LIMIT 1');
    $check->execute(['id' => $id, 'username' => $username, 'email' => $email]);
    if ($check->fetch()) {
        respond(['ok' => false, 'message' => 'Username or email already exists'], 409);
    }

    if ($password !== '') {
        $stmt = $pdo->prepare(
            'UPDATE users
             SET full_name = :full_name, username = :username, email = :email, phone = :phone, gender = :gender, password_hash = :password_hash
             WHERE id = :id AND role = "patient"'
        );
        $stmt->execute([
            'full_name' => $fullName,
            'username' => $username,
            'email' => $email,
            'phone' => $phone !== '' ? $phone : null,
            'gender' => $gender !== '' ? $gender : null,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'id' => $id,
        ]);
    } else {
        $stmt = $pdo->prepare(
            'UPDATE users
             SET full_name = :full_name, username = :username, email = :email, phone = :phone, gender = :gender
             WHERE id = :id AND role = "patient"'
        );
        $stmt->execute([
            'full_name' => $fullName,
            'username' => $username,
            'email' => $email,
            'phone' => $phone !== '' ? $phone : null,
            'gender' => $gender !== '' ? $gender : null,
            'id' => $id,
        ]);
    }

    if ($stmt->rowCount() === 0) {
        $exists = $pdo->prepare('SELECT id FROM users WHERE id = :id AND role = "patient" LIMIT 1');
        $exists->execute(['id' => $id]);
        if (!$exists->fetch()) {
            respond(['ok' => false, 'message' => 'Patient not found'], 404);
        }
    }

    respond(['ok' => true]);
}

if ($action === 'delete') {
    $id = (int) ($data['id'] ?? 0);
    if ($id <= 0) {
        respond(['ok' => false, 'message' => 'id is required'], 422);
    }

    $stmt = $pdo->prepare('DELETE FROM users WHERE id = :id AND role = "patient"');
    $stmt->execute(['id' => $id]);
    if ($stmt->rowCount() === 0) {
        respond(['ok' => false, 'message' => 'Patient not found'], 404);
    }

    respond(['ok' => true]);
}

respond(['ok' => false, 'message' => 'Invalid action'], 422);
