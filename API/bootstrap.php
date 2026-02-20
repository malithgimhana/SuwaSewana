<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

session_start();
header('Content-Type: application/json');
ini_set('display_errors', '0');
error_reporting(E_ALL);

function json_input(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

set_exception_handler(function (Throwable $e): void {
    respond([
        'ok' => false,
        'message' => $e->getMessage(),
    ], 500);
});

function request_method(): string
{
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

function current_user(): ?array
{
    if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
        return null;
    }
    return $_SESSION['user'];
}

function require_login(): array
{
    $user = current_user();
    if (!$user) {
        respond(['ok' => false, 'message' => 'Unauthorized'], 401);
    }
    return $user;
}

function require_role(array $roles): array
{
    $user = require_login();
    if (!in_array($user['role'], $roles, true)) {
        respond(['ok' => false, 'message' => 'Forbidden'], 403);
    }
    return $user;
}

function read_id(): int
{
    $id = $_GET['id'] ?? null;
    if (!$id || !ctype_digit((string) $id)) {
        respond(['ok' => false, 'message' => 'Invalid or missing id'], 422);
    }
    return (int) $id;
}
