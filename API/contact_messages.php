<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/validation.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$data = json_input();
if ($data === []) {
    $data = $_POST;
}

$firstName = trim((string) ($data['firstName'] ?? ''));
$lastName = trim((string) ($data['lastName'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$phone = trim((string) ($data['phone'] ?? ''));
$subject = trim((string) ($data['subject'] ?? ''));
$message = trim((string) ($data['message'] ?? ''));

if ($firstName === '' || $lastName === '' || $email === '' || $subject === '' || $message === '') {
    respond(['ok' => false, 'message' => 'Required fields are missing'], 422);
}

if (!is_valid_person_name($firstName) || !is_valid_person_name($lastName)) {
    respond(['ok' => false, 'message' => 'First name and last name must be letters only and up to 12 characters'], 422);
}

if (!is_valid_email($email)) {
    respond(['ok' => false, 'message' => 'Invalid email address'], 422);
}

if ($phone !== '' && !is_valid_phone($phone)) {
    respond(['ok' => false, 'message' => 'Phone number must start with 0 and contain exactly 10 digits'], 422);
}

$pdo = db();
$pdo->exec(
    'CREATE TABLE IF NOT EXISTS contacts (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        subject VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);

$stmt = $pdo->prepare(
    'INSERT INTO contacts (first_name, last_name, email, phone, subject, message)
     VALUES (:first_name, :last_name, :email, :phone, :subject, :message)'
);
$stmt->execute([
    'first_name' => $firstName,
    'last_name' => $lastName,
    'email' => $email,
    'phone' => $phone !== '' ? $phone : null,
    'subject' => $subject,
    'message' => $message,
]);

respond(['ok' => true, 'id' => (int) $pdo->lastInsertId()], 201);
