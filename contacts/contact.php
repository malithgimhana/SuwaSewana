<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/config.php';
require_once __DIR__ . '/../api/validation.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, (int) DB_PORT);
if ($conn->connect_error) {
    header('Location: contact.html?error=db');
    exit;
}

function sanitize($v) {
    return trim(htmlspecialchars($v, ENT_QUOTES, 'UTF-8'));
}

$first = isset($_POST['firstName']) ? sanitize($_POST['firstName']) : '';
$last  = isset($_POST['lastName'])  ? sanitize($_POST['lastName'])  : '';
$email = isset($_POST['email'])     ? sanitize($_POST['email'])     : '';
$phone = isset($_POST['phone'])     ? sanitize($_POST['phone'])     : '';
$subject = isset($_POST['subject']) ? sanitize($_POST['subject']) : '';
$message = isset($_POST['message']) ? sanitize($_POST['message']) : '';

// Basic validation
if (empty($first) || empty($last) || empty($email) || empty($subject) || empty($message)) {
    header('Location: contact.html?error=validation');
    exit;
}

if (!is_valid_person_name($first) || !is_valid_person_name($last)) {
    header('Location: contact.html?error=invalid_name');
    exit;
}

if (!is_valid_email($email)) {
    header('Location: contact.html?error=invalid_email');
    exit;
}

if ($phone !== '' && !is_valid_phone($phone)) {
    header('Location: contact.html?error=invalid_phone');
    exit;
}

// Prepared statement to avoid SQL injection
$conn->query(
    "CREATE TABLE IF NOT EXISTS contacts (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        subject VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
);

$stmt = $conn->prepare("INSERT INTO contacts (first_name, last_name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
if (!$stmt) {
    header('Location: contact.html?error=prepare');
    exit;
}

$stmt->bind_param('ssssss', $first, $last, $email, $phone, $subject, $message);
$ok = $stmt->execute();
$stmt->close();
$conn->close();

if ($ok) {
    header('Location: contact.html?success=1');
    exit;
} else {
    header('Location: contact.html?error=insert');
    exit;
}

?>
