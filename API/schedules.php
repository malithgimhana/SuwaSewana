<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$pdo = db();
$data = json_input();
$action = (string) ($data['action'] ?? '');

function is_valid_date_value(string $date): bool
{
    $dt = DateTime::createFromFormat('Y-m-d', $date);
    return $dt instanceof DateTime && $dt->format('Y-m-d') === $date;
}

function is_valid_time_value(string $time): bool
{
    return (bool) preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $time);
}

if ($action === 'list_available') {
    $doctorId = (int) ($data['doctor_id'] ?? 0);
    $date = (string) ($data['date'] ?? '');
    if ($doctorId <= 0) {
        respond(['ok' => false, 'message' => 'doctor_id is required'], 422);
    }

    if ($date !== '') {
        $stmt = $pdo->prepare(
            'SELECT s.id, s.date, s.start_time, s.end_time, s.department
             FROM schedules s
             WHERE s.doctor_id = :doctor_id
               AND s.date = :date
               AND s.is_available = 1
             ORDER BY s.start_time ASC'
        );
        $stmt->execute(['doctor_id' => $doctorId, 'date' => $date]);
    } else {
        $stmt = $pdo->prepare(
            'SELECT s.id, s.date, s.start_time, s.end_time, s.department
             FROM schedules s
             WHERE s.doctor_id = :doctor_id
               AND s.date >= CURDATE()
               AND s.is_available = 1
             ORDER BY s.date ASC, s.start_time ASC'
        );
        $stmt->execute(['doctor_id' => $doctorId]);
    }
    respond(['ok' => true, 'schedules' => $stmt->fetchAll()]);
}

if ($action === 'list_available_dates') {
    $doctorId = (int) ($data['doctor_id'] ?? 0);
    if ($doctorId <= 0) {
        respond(['ok' => false, 'message' => 'doctor_id is required'], 422);
    }

    $stmt = $pdo->prepare(
        'SELECT s.date,
                COUNT(s.id) AS available_slots,
                COALESCE(dc.booked_count, 0) AS booked_count,
                CASE WHEN COALESCE(dc.booked_count, 0) >= 15 THEN 1 ELSE 0 END AS is_full
         FROM schedules s
         LEFT JOIN (
            SELECT s2.doctor_id, s2.date, COUNT(a2.id) AS booked_count
            FROM appointments a2
            INNER JOIN schedules s2 ON s2.id = a2.schedule_id
            WHERE a2.status <> "cancelled"
            GROUP BY s2.doctor_id, s2.date
         ) dc ON dc.doctor_id = s.doctor_id AND dc.date = s.date
         WHERE s.doctor_id = :doctor_id
           AND s.date >= CURDATE()
           AND s.is_available = 1
         GROUP BY s.date, dc.booked_count
         ORDER BY s.date ASC'
    );
    $stmt->execute(['doctor_id' => $doctorId]);
    respond(['ok' => true, 'dates' => $stmt->fetchAll()]);
}

if ($action === 'list') {
    $user = require_role(['doctor', 'admin']);
    $doctorId = $user['role'] === 'doctor' ? (int) $user['id'] : (int) ($data['doctor_id'] ?? 0);

    if ($user['role'] === 'admin' && $doctorId === 0) {
        $stmt = $pdo->query(
            'SELECT s.id, s.doctor_id, u.full_name AS doctor_name, s.date, s.start_time, s.end_time, s.department, s.is_available
             FROM schedules s
             INNER JOIN users u ON u.id = s.doctor_id
             ORDER BY s.date DESC, s.start_time DESC'
        );
        respond(['ok' => true, 'schedules' => $stmt->fetchAll()]);
    }

    $stmt = $pdo->prepare(
        'SELECT s.id, s.doctor_id, s.date, s.start_time, s.end_time, s.department, s.is_available
         FROM schedules s
         WHERE s.doctor_id = :doctor_id
         ORDER BY s.date DESC, s.start_time DESC'
    );
    $stmt->execute(['doctor_id' => $doctorId]);
    respond(['ok' => true, 'schedules' => $stmt->fetchAll()]);
}

if ($action === 'create') {
    $user = require_role(['doctor', 'admin']);

    $doctorId = $user['role'] === 'doctor' ? (int) $user['id'] : (int) ($data['doctor_id'] ?? 0);
    $date = trim((string) ($data['date'] ?? ''));
    $startTime = trim((string) ($data['start_time'] ?? ''));
    $endTime = trim((string) ($data['end_time'] ?? ''));
    $department = trim((string) ($data['department'] ?? ''));

    if ($doctorId <= 0 || $date === '' || $startTime === '' || $endTime === '') {
        respond(['ok' => false, 'message' => 'doctor/date/start_time/end_time are required'], 422);
    }

    if (!is_valid_date_value($date) || !is_valid_time_value($startTime) || !is_valid_time_value($endTime)) {
        respond(['ok' => false, 'message' => 'Invalid date or time format'], 422);
    }

    if (strtotime($date . ' ' . $endTime) <= strtotime($date . ' ' . $startTime)) {
        respond(['ok' => false, 'message' => 'End time must be later than start time'], 422);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO schedules (doctor_id, date, start_time, end_time, department, is_available)
         VALUES (:doctor_id, :date, :start_time, :end_time, :department, 1)'
    );
    $stmt->execute([
        'doctor_id' => $doctorId,
        'date' => $date,
        'start_time' => $startTime,
        'end_time' => $endTime,
        'department' => $department !== '' ? $department : null,
    ]);
    respond(['ok' => true, 'id' => (int) $pdo->lastInsertId()], 201);
}

if ($action === 'update') {
    $user = require_role(['doctor', 'admin']);
    $id = (int) ($data['id'] ?? 0);
    $date = trim((string) ($data['date'] ?? ''));
    $startTime = trim((string) ($data['start_time'] ?? ''));
    $endTime = trim((string) ($data['end_time'] ?? ''));
    $department = trim((string) ($data['department'] ?? ''));

    if ($id <= 0 || $date === '' || $startTime === '' || $endTime === '') {
        respond(['ok' => false, 'message' => 'id/date/start_time/end_time are required'], 422);
    }

    if (!is_valid_date_value($date) || !is_valid_time_value($startTime) || !is_valid_time_value($endTime)) {
        respond(['ok' => false, 'message' => 'Invalid date or time format'], 422);
    }

    if (strtotime($date . ' ' . $endTime) <= strtotime($date . ' ' . $startTime)) {
        respond(['ok' => false, 'message' => 'End time must be later than start time'], 422);
    }

    $ownerCheck = $pdo->prepare('SELECT doctor_id, is_available FROM schedules WHERE id = :id LIMIT 1');
    $ownerCheck->execute(['id' => $id]);
    $schedule = $ownerCheck->fetch();
    if (!$schedule) {
        respond(['ok' => false, 'message' => 'Schedule not found'], 404);
    }
    if ($user['role'] === 'doctor' && (int) $schedule['doctor_id'] !== (int) $user['id']) {
        respond(['ok' => false, 'message' => 'Forbidden'], 403);
    }
    if ((int) $schedule['is_available'] === 0) {
        respond(['ok' => false, 'message' => 'Booked schedules cannot be edited'], 409);
    }

    $stmt = $pdo->prepare(
        'UPDATE schedules
         SET date = :date, start_time = :start_time, end_time = :end_time, department = :department
         WHERE id = :id'
    );
    $stmt->execute([
        'date' => $date,
        'start_time' => $startTime,
        'end_time' => $endTime,
        'department' => $department !== '' ? $department : null,
        'id' => $id,
    ]);

    respond(['ok' => true]);
}

if ($action === 'delete') {
    $user = require_role(['doctor', 'admin']);
    $id = (int) ($data['id'] ?? 0);
    if ($id <= 0) {
        respond(['ok' => false, 'message' => 'id is required'], 422);
    }

    $ownerCheck = $pdo->prepare('SELECT doctor_id, is_available FROM schedules WHERE id = :id LIMIT 1');
    $ownerCheck->execute(['id' => $id]);
    $schedule = $ownerCheck->fetch();
    if (!$schedule) {
        respond(['ok' => false, 'message' => 'Schedule not found'], 404);
    }
    if ($user['role'] === 'doctor' && (int) $schedule['doctor_id'] !== (int) $user['id']) {
        respond(['ok' => false, 'message' => 'Forbidden'], 403);
    }
    if ((int) $schedule['is_available'] === 0) {
        respond(['ok' => false, 'message' => 'Booked schedules cannot be deleted'], 409);
    }

    $stmt = $pdo->prepare('DELETE FROM schedules WHERE id = :id');
    $stmt->execute(['id' => $id]);
    respond(['ok' => true]);
}

respond(['ok' => false, 'message' => 'Invalid action'], 422);
