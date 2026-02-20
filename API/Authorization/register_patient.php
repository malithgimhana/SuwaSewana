<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../validation.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$data = json_input();
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
    respond(['ok' => false, 'message' => 'Invalid email address'], 422);
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

$pdo = db();

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

$userId = (int) $pdo->lastInsertId();
$_SESSION['user'] = [
    'id' => $userId,
    'role' => 'patient',
    'name' => $fullName,
    'username' => $username,
];

respond([
    'ok' => true,
    'user' => $_SESSION['user'],
]);
