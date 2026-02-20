<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/validation.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$pdo = db();
$data = json_input();
$action = (string) ($data['action'] ?? '');

function ensure_doctor_columns(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }

    $columns = $pdo->query('SHOW COLUMNS FROM users')->fetchAll();
    $existing = [];
    foreach ($columns as $column) {
        $existing[(string) $column['Field']] = true;
    }

    $alterParts = [];
    if (!isset($existing['first_name'])) {
        $alterParts[] = 'ADD COLUMN first_name VARCHAR(80) NULL AFTER id';
    }
    if (!isset($existing['last_name'])) {
        $alterParts[] = 'ADD COLUMN last_name VARCHAR(80) NULL AFTER first_name';
    }
    if (!isset($existing['nic_number'])) {
        $alterParts[] = 'ADD COLUMN nic_number VARCHAR(30) NULL UNIQUE AFTER gender';
    }
    if (!isset($existing['photo_path'])) {
        $alterParts[] = 'ADD COLUMN photo_path VARCHAR(255) NULL AFTER nic_number';
    }
    if (!isset($existing['experience_years'])) {
        $alterParts[] = 'ADD COLUMN experience_years TINYINT UNSIGNED NULL AFTER department';
    }
    if (!isset($existing['profile_bio'])) {
        $alterParts[] = 'ADD COLUMN profile_bio VARCHAR(255) NULL AFTER experience_years';
    }

    if ($alterParts !== []) {
        $pdo->exec('ALTER TABLE users ' . implode(', ', $alterParts));
    }

    $checked = true;
}

function doctor_specialties(): array
{
    return [
        'Cardiology',
        'Neurology',
        'Gastroenterology',
        'Endocrinology',
        'Pulmonology',
        'Nephrology',
        'Rheumatology',
        'Hematology',
        'Infectious Disease',
        'General Physician (Internal Medicine)',
    ];
}

ensure_doctor_columns($pdo);

if ($action === 'profile') {
    $user = require_role(['doctor', 'admin']);
    $targetId = (int) ($data['id'] ?? 0);

    if ($user['role'] === 'doctor') {
      $targetId = (int) $user['id'];
    }

    if ($targetId <= 0) {
      respond(['ok' => false, 'message' => 'Doctor id is required'], 422);
    }

    $stmt = $pdo->prepare(
        'SELECT id,
                COALESCE(NULLIF(first_name, ""), SUBSTRING_INDEX(full_name, " ", 1)) AS first_name,
                COALESCE(NULLIF(last_name, ""), TRIM(SUBSTRING(full_name, LENGTH(SUBSTRING_INDEX(full_name, " ", 1)) + 1))) AS last_name,
                full_name, username, email, phone, gender, nic_number, photo_path, department AS specialty, experience_years, profile_bio
         FROM users
         WHERE id = :id AND role = "doctor"
         LIMIT 1'
    );
    $stmt->execute(['id' => $targetId]);
    $doctor = $stmt->fetch();

    if (!$doctor) {
        respond(['ok' => false, 'message' => 'Doctor not found'], 404);
    }

    respond(['ok' => true, 'doctor' => $doctor]);
}

if ($action === 'list') {
    $user = current_user();
    if ($user && $user['role'] === 'admin') {
        $stmt = $pdo->query(
            'SELECT id,
                    COALESCE(NULLIF(first_name, ""), SUBSTRING_INDEX(full_name, " ", 1)) AS first_name,
                    COALESCE(NULLIF(last_name, ""), TRIM(SUBSTRING(full_name, LENGTH(SUBSTRING_INDEX(full_name, " ", 1)) + 1))) AS last_name,
                    full_name, username, email, phone, gender, nic_number, photo_path, department AS specialty, experience_years, profile_bio, created_at
             FROM users
             WHERE role = "doctor"
             ORDER BY id DESC'
        );
        respond(['ok' => true, 'doctors' => $stmt->fetchAll()]);
    }

    $stmt = $pdo->query(
        'SELECT id, full_name, department, photo_path, experience_years, profile_bio
         FROM users
         WHERE role = "doctor"
         ORDER BY full_name ASC'
    );
    respond(['ok' => true, 'doctors' => $stmt->fetchAll()]);
}

if ($action === 'create') {
    require_role(['admin']);

    $firstName = trim((string) ($data['first_name'] ?? ''));
    $lastName = trim((string) ($data['last_name'] ?? ''));
    $specialty = trim((string) ($data['specialty'] ?? ''));
    $username = trim((string) ($data['username'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    $email = trim((string) ($data['email'] ?? ''));
    $phone = trim((string) ($data['phone'] ?? ''));
    $gender = trim((string) ($data['gender'] ?? ''));
    $nicNumber = trim((string) ($data['nic_number'] ?? ''));
    $photoPath = trim((string) ($data['photo_path'] ?? ''));
    $experienceYears = (int) ($data['experience_years'] ?? 0);
    $profileBio = trim((string) ($data['profile_bio'] ?? ''));

    if ($firstName === '' || $lastName === '' || $specialty === '' || $username === '' || $password === '' || $email === '' || $phone === '' || $gender === '' || $nicNumber === '' || $photoPath === '' || $experienceYears <= 0 || $profileBio === '') {
        respond(['ok' => false, 'message' => 'All fields are required.'], 422);
    }

    if (!is_valid_person_name($firstName) || !is_valid_person_name($lastName)) {
        respond(['ok' => false, 'message' => 'First name and last name must be letters only and up to 12 characters'], 422);
    }

    if (!is_valid_username($username)) {
        respond(['ok' => false, 'message' => 'Username must be alphanumeric and up to 10 characters'], 422);
    }

    if (!is_valid_password($password)) {
        respond(['ok' => false, 'message' => 'Password must be exactly 8 characters and include letters and numbers only'], 422);
    }

    if (!in_array($specialty, doctor_specialties(), true)) {
        respond(['ok' => false, 'message' => 'Invalid specialty selected'], 422);
    }

    if (!in_array($gender, ['Male', 'Female', 'Other'], true)) {
        respond(['ok' => false, 'message' => 'Invalid gender selected'], 422);
    }

    if (!is_valid_email($email)) {
        respond(['ok' => false, 'message' => 'Invalid email address'], 422);
    }

    if (!is_valid_phone($phone)) {
        respond(['ok' => false, 'message' => 'Phone number must start with 0 and contain exactly 10 digits'], 422);
    }

    if (!is_valid_nic($nicNumber)) {
        respond(['ok' => false, 'message' => 'NIC format: 12 digits only (example: 200012345678)'], 422);
    }

    if ($experienceYears < 1 || $experienceYears > 60) {
        respond(['ok' => false, 'message' => 'Experience years must be between 1 and 60'], 422);
    }

    if (strlen($profileBio) < 30 || strlen($profileBio) > 255) {
        respond(['ok' => false, 'message' => 'Profile bio must be between 30 and 255 characters'], 422);
    }

    $check = $pdo->prepare(
        'SELECT id FROM users
         WHERE username = :username OR email = :email OR nic_number = :nic_number
         LIMIT 1'
    );
    $check->execute([
        'username' => $username,
        'email' => $email,
        'nic_number' => $nicNumber,
    ]);

    if ($check->fetch()) {
        respond(['ok' => false, 'message' => 'Username, email, or NIC already exists'], 409);
    }

    $fullName = trim($firstName . ' ' . $lastName);

    $stmt = $pdo->prepare(
        'INSERT INTO users (first_name, last_name, full_name, username, email, phone, gender, nic_number, photo_path, department, experience_years, profile_bio, password_hash, role)
         VALUES (:first_name, :last_name, :full_name, :username, :email, :phone, :gender, :nic_number, :photo_path, :department, :experience_years, :profile_bio, :password_hash, "doctor")'
    );
    $stmt->execute([
        'first_name' => $firstName,
        'last_name' => $lastName,
        'full_name' => $fullName,
        'username' => $username,
        'email' => $email,
        'phone' => $phone,
        'gender' => $gender,
        'nic_number' => $nicNumber,
        'photo_path' => $photoPath !== '' ? $photoPath : null,
        'department' => $specialty,
        'experience_years' => $experienceYears,
        'profile_bio' => $profileBio,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);

    respond(['ok' => true, 'id' => (int) $pdo->lastInsertId()], 201);
}

if ($action === 'update') {
    require_role(['admin']);

    $id = (int) ($data['id'] ?? 0);
    $firstName = trim((string) ($data['first_name'] ?? ''));
    $lastName = trim((string) ($data['last_name'] ?? ''));
    $specialty = trim((string) ($data['specialty'] ?? ''));
    $username = trim((string) ($data['username'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    $email = trim((string) ($data['email'] ?? ''));
    $phone = trim((string) ($data['phone'] ?? ''));
    $gender = trim((string) ($data['gender'] ?? ''));
    $nicNumber = trim((string) ($data['nic_number'] ?? ''));
    $photoPath = trim((string) ($data['photo_path'] ?? ''));
    $experienceYears = (int) ($data['experience_years'] ?? 0);
    $profileBio = trim((string) ($data['profile_bio'] ?? ''));

    if ($id <= 0 || $firstName === '' || $lastName === '' || $specialty === '' || $username === '' || $email === '' || $phone === '' || $gender === '' || $nicNumber === '' || $experienceYears <= 0 || $profileBio === '') {
        respond(['ok' => false, 'message' => 'All fields except password are required'], 422);
    }

    if (!is_valid_person_name($firstName) || !is_valid_person_name($lastName)) {
        respond(['ok' => false, 'message' => 'First name and last name must be letters only and up to 12 characters'], 422);
    }

    if (!is_valid_username($username)) {
        respond(['ok' => false, 'message' => 'Username must be alphanumeric and up to 10 characters'], 422);
    }

    if (!in_array($specialty, doctor_specialties(), true)) {
        respond(['ok' => false, 'message' => 'Invalid specialty selected'], 422);
    }

    if (!in_array($gender, ['Male', 'Female', 'Other'], true)) {
        respond(['ok' => false, 'message' => 'Invalid gender selected'], 422);
    }

    if (!is_valid_email($email)) {
        respond(['ok' => false, 'message' => 'Invalid email address'], 422);
    }

    if (!is_valid_phone($phone)) {
        respond(['ok' => false, 'message' => 'Phone number must start with 0 and contain exactly 10 digits'], 422);
    }

    if (!is_valid_nic($nicNumber)) {
        respond(['ok' => false, 'message' => 'NIC format: 12 digits only (example: 200012345678)'], 422);
    }

    if ($password !== '' && !is_valid_password($password)) {
        respond(['ok' => false, 'message' => 'Password must be exactly 8 characters and include letters and numbers only'], 422);
    }

    if ($experienceYears < 1 || $experienceYears > 60) {
        respond(['ok' => false, 'message' => 'Experience years must be between 1 and 60'], 422);
    }

    if (strlen($profileBio) < 30 || strlen($profileBio) > 255) {
        respond(['ok' => false, 'message' => 'Profile bio must be between 30 and 255 characters'], 422);
    }

    $check = $pdo->prepare(
        'SELECT id FROM users
         WHERE id <> :id AND (username = :username OR email = :email OR nic_number = :nic_number)
         LIMIT 1'
    );
    $check->execute([
        'id' => $id,
        'username' => $username,
        'email' => $email,
        'nic_number' => $nicNumber,
    ]);

    if ($check->fetch()) {
        respond(['ok' => false, 'message' => 'Username, email, or NIC already exists'], 409);
    }

    $fullName = trim($firstName . ' ' . $lastName);

    if ($password !== '') {
        $stmt = $pdo->prepare(
            'UPDATE users
             SET first_name = :first_name, last_name = :last_name, full_name = :full_name, username = :username, email = :email, phone = :phone, gender = :gender, nic_number = :nic_number, photo_path = :photo_path, department = :department, experience_years = :experience_years, profile_bio = :profile_bio, password_hash = :password_hash
             WHERE id = :id AND role = "doctor"'
        );
        $stmt->execute([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'full_name' => $fullName,
            'username' => $username,
            'email' => $email,
            'phone' => $phone,
            'gender' => $gender,
            'nic_number' => $nicNumber,
            'photo_path' => $photoPath !== '' ? $photoPath : null,
            'department' => $specialty,
            'experience_years' => $experienceYears,
            'profile_bio' => $profileBio,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'id' => $id,
        ]);
    } else {
        $stmt = $pdo->prepare(
            'UPDATE users
             SET first_name = :first_name, last_name = :last_name, full_name = :full_name, username = :username, email = :email, phone = :phone, gender = :gender, nic_number = :nic_number, photo_path = :photo_path, department = :department, experience_years = :experience_years, profile_bio = :profile_bio
             WHERE id = :id AND role = "doctor"'
        );
        $stmt->execute([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'full_name' => $fullName,
            'username' => $username,
            'email' => $email,
            'phone' => $phone,
            'gender' => $gender,
            'nic_number' => $nicNumber,
            'photo_path' => $photoPath !== '' ? $photoPath : null,
            'department' => $specialty,
            'experience_years' => $experienceYears,
            'profile_bio' => $profileBio,
            'id' => $id,
        ]);
    }

    if ($stmt->rowCount() === 0) {
        respond(['ok' => false, 'message' => 'Doctor not found'], 404);
    }

    respond(['ok' => true]);
}

if ($action === 'delete') {
    require_role(['admin']);

    $id = (int) ($data['id'] ?? 0);
    if ($id <= 0) {
        respond(['ok' => false, 'message' => 'id is required'], 422);
    }

    $stmt = $pdo->prepare('DELETE FROM users WHERE id = :id AND role = "doctor"');
    $stmt->execute(['id' => $id]);
    if ($stmt->rowCount() === 0) {
        respond(['ok' => false, 'message' => 'Doctor not found'], 404);
    }
    respond(['ok' => true]);
}

respond(['ok' => false, 'message' => 'Invalid action'], 422);
