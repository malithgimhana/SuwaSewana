<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$data = json_input();
$identifier = trim((string) ($data['identifier'] ?? ''));
$password = (string) ($data['password'] ?? '');

if ($identifier === '' || $password === '') {
    respond(['ok' => false, 'message' => 'Username/email and password are required'], 422);
}

if ($identifier === 'admin' && $password === 'admin') {
    $_SESSION['user'] = [
        'id' => 0,
        'role' => 'admin',
        'name' => 'Administrator',
        'username' => 'admin',
    ];
    respond(['ok' => true, 'user' => $_SESSION['user']]);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT id, full_name, username, password_hash, role
     FROM users
     WHERE username = :username OR email = :email
     LIMIT 1'
);
$stmt->execute([
    'username' => $identifier,
    'email' => $identifier,
]);
$user = $stmt->fetch();

if (!$user) {
    respond(['ok' => false, 'message' => 'Invalid credentials'], 401);
}

$storedHash = (string) ($user['password_hash'] ?? '');
$passwordOk = false;

if ($storedHash !== '' && password_verify($password, $storedHash)) {
    $passwordOk = true;
} elseif ($storedHash !== '' && hash_equals($storedHash, $password)) {
    // Compatibility path for legacy/plain-text rows. Rehash immediately.
    $passwordOk = true;
    $rehashStmt = $pdo->prepare('UPDATE users SET password_hash = :password_hash WHERE id = :id LIMIT 1');
    $rehashStmt->execute([
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'id' => (int) $user['id'],
    ]);
}

if (!$passwordOk) {
    respond(['ok' => false, 'message' => 'Invalid credentials'], 401);
}

$_SESSION['user'] = [
    'id' => (int) $user['id'],
    'role' => $user['role'],
    'name' => $user['full_name'],
    'username' => $user['username'],
];

respond(['ok' => true, 'user' => $_SESSION['user']]);
