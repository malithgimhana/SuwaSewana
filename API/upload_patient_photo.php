<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

require_role(['patient']);

if (!isset($_FILES['photo']) || !is_array($_FILES['photo'])) {
    respond(['ok' => false, 'message' => 'Photo is required'], 422);
}

$file = $_FILES['photo'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_INI_SIZE) {
        respond(['ok' => false, 'message' => 'Photo must be 5MB or less'], 422);
    }
    respond(['ok' => false, 'message' => 'Photo upload failed'], 422);
}

$maxSize = 5 * 1024 * 1024;
if ((int) $file['size'] > $maxSize) {
    respond(['ok' => false, 'message' => 'Photo must be 5MB or less'], 422);
}

$tmpPath = (string) $file['tmp_name'];
$mime = '';
if (class_exists('finfo')) {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string) $finfo->file($tmpPath);
} elseif (function_exists('mime_content_type')) {
    $mime = (string) mime_content_type($tmpPath);
}

if ($mime === '') {
    $mime = (string) ($file['type'] ?? '');
}

$allowed = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];

if (!isset($allowed[$mime])) {
    respond(['ok' => false, 'message' => 'Only JPG, PNG, and WEBP images are allowed'], 422);
}

$uploadsDir = realpath(__DIR__ . '/..');
if ($uploadsDir === false) {
    respond(['ok' => false, 'message' => 'Upload path error'], 500);
}

$patientUploadsDir = $uploadsDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'patients';
if (!is_dir($patientUploadsDir) && !mkdir($patientUploadsDir, 0775, true)) {
    respond(['ok' => false, 'message' => 'Could not create upload directory'], 500);
}

$filename = 'pat_' . bin2hex(random_bytes(10)) . '.' . $allowed[$mime];
$targetPath = $patientUploadsDir . DIRECTORY_SEPARATOR . $filename;

if (!move_uploaded_file($tmpPath, $targetPath)) {
    respond(['ok' => false, 'message' => 'Could not save photo'], 500);
}

respond([
    'ok' => true,
    'photo_path' => 'uploads/patients/' . $filename,
]);
