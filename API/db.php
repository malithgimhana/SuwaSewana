<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $attempts = [];
    $hosts = [DB_HOST, 'localhost', '127.0.0.1'];
    $ports = [DB_PORT, '3306', '3307'];
    $candidates = [];
    foreach ($hosts as $host) {
        foreach ($ports as $port) {
            $candidates[] = [$host, $port];
        }
    }

    $seen = [];
    foreach ($candidates as $candidate) {
        [$host, $port] = $candidate;
        $key = $host . ':' . $port;
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;

        try {
            $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, DB_NAME);
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            return $pdo;
        } catch (PDOException $e) {
            $attempts[] = $key;
        }
    }

    throw new RuntimeException(
        'Database connection failed. Ensure MySQL is running and update api/config.php if needed. Tried: ' . implode(', ', $attempts)
    );
}
