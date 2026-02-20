<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (request_method() !== 'POST') {
    respond(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$pdo = db();
$user = require_login();
$data = json_input();
$action = (string) ($data['action'] ?? '');

if ($action === 'list') {
    if ($user['role'] === 'patient') {
        $stmt = $pdo->prepare(
            'SELECT a.id, a.patient_id, a.doctor_id, a.schedule_id, a.department, a.notes, a.status, a.created_at,
                    s.date AS appointment_date, s.start_time, s.end_time, u.full_name AS doctor_name
             FROM appointments a
             INNER JOIN users u ON u.id = a.doctor_id
             LEFT JOIN schedules s ON s.id = a.schedule_id
             WHERE a.patient_id = :patient_id
             ORDER BY a.id DESC'
        );
        $stmt->execute(['patient_id' => (int) $user['id']]);
        respond(['ok' => true, 'appointments' => $stmt->fetchAll()]);
    }

    if ($user['role'] === 'doctor') {
        $stmt = $pdo->prepare(
            'SELECT a.id, a.patient_id, a.doctor_id, a.schedule_id, a.department, a.notes, a.status, a.created_at,
                    s.date AS appointment_date, s.start_time, s.end_time, p.full_name AS patient_name
             FROM appointments a
             INNER JOIN users p ON p.id = a.patient_id
             LEFT JOIN schedules s ON s.id = a.schedule_id
             WHERE a.doctor_id = :doctor_id
             ORDER BY a.id DESC'
        );
        $stmt->execute(['doctor_id' => (int) $user['id']]);
        respond(['ok' => true, 'appointments' => $stmt->fetchAll()]);
    }

    $appointmentDate = trim((string) ($data['appointment_date'] ?? ''));
    if ($appointmentDate !== '') {
        $stmt = $pdo->prepare(
            'SELECT a.id, a.patient_id, a.doctor_id, a.schedule_id, a.department, a.notes, a.status, a.created_at,
                    s.date AS appointment_date, s.start_time, s.end_time, p.full_name AS patient_name, d.full_name AS doctor_name
             FROM appointments a
             INNER JOIN users p ON p.id = a.patient_id
             INNER JOIN users d ON d.id = a.doctor_id
             LEFT JOIN schedules s ON s.id = a.schedule_id
             WHERE s.date = :appointment_date
             ORDER BY s.start_time ASC, a.id DESC'
        );
        $stmt->execute(['appointment_date' => $appointmentDate]);
        respond(['ok' => true, 'appointments' => $stmt->fetchAll()]);
    }

    $stmt = $pdo->query(
        'SELECT a.id, a.patient_id, a.doctor_id, a.schedule_id, a.department, a.notes, a.status, a.created_at,
                s.date AS appointment_date, s.start_time, s.end_time, p.full_name AS patient_name, d.full_name AS doctor_name
         FROM appointments a
         INNER JOIN users p ON p.id = a.patient_id
         INNER JOIN users d ON d.id = a.doctor_id
         LEFT JOIN schedules s ON s.id = a.schedule_id
         ORDER BY a.id DESC'
    );
    respond(['ok' => true, 'appointments' => $stmt->fetchAll()]);
}

if ($action === 'create') {
    if (!in_array($user['role'], ['patient', 'admin'], true)) {
        respond(['ok' => false, 'message' => 'Forbidden'], 403);
    }

    $patientId = $user['role'] === 'patient' ? (int) $user['id'] : (int) ($data['patient_id'] ?? 0);
    $doctorId = (int) ($data['doctor_id'] ?? 0);
    $scheduleId = (int) ($data['schedule_id'] ?? 0);
    $department = trim((string) ($data['department'] ?? ''));
    $notes = trim((string) ($data['notes'] ?? ''));

    if ($patientId <= 0 || $doctorId <= 0 || $scheduleId <= 0) {
        respond(['ok' => false, 'message' => 'patient_id, doctor_id and schedule_id are required'], 422);
    }

    if ($user['role'] === 'admin') {
        $patientStmt = $pdo->prepare('SELECT id FROM users WHERE id = :id AND role = "patient" LIMIT 1');
        $patientStmt->execute(['id' => $patientId]);
        if (!$patientStmt->fetch()) {
            respond(['ok' => false, 'message' => 'Selected patient does not exist'], 404);
        }
    }

    $slotStmt = $pdo->prepare('SELECT id, doctor_id, is_available, date FROM schedules WHERE id = :id LIMIT 1');
    $slotStmt->execute(['id' => $scheduleId]);
    $slot = $slotStmt->fetch();
    if (!$slot || (int) $slot['doctor_id'] !== $doctorId || (int) $slot['is_available'] !== 1) {
        respond(['ok' => false, 'message' => 'Selected time slot is not available'], 409);
    }

    $dailyCountStmt = $pdo->prepare(
        'SELECT COUNT(a.id) AS daily_count
         FROM appointments a
         INNER JOIN schedules s ON s.id = a.schedule_id
         WHERE a.doctor_id = :doctor_id
           AND s.date = :schedule_date
           AND a.status <> "cancelled"'
    );
    $dailyCountStmt->execute([
        'doctor_id' => $doctorId,
        'schedule_date' => (string) $slot['date'],
    ]);
    $dailyCount = (int) (($dailyCountStmt->fetch()['daily_count'] ?? 0));
    if ($dailyCount >= 15) {
        respond(['ok' => false, 'message' => 'Today is full for this doctor. Please choose another date.'], 409);
    }

    $pdo->beginTransaction();
    try {
        $insert = $pdo->prepare(
            'INSERT INTO appointments (patient_id, doctor_id, schedule_id, department, notes, status)
             VALUES (:patient_id, :doctor_id, :schedule_id, :department, :notes, "booked")'
        );
        $insert->execute([
            'patient_id' => $patientId,
            'doctor_id' => $doctorId,
            'schedule_id' => $scheduleId,
            'department' => $department !== '' ? $department : null,
            'notes' => $notes !== '' ? $notes : null,
        ]);

        $updateSlot = $pdo->prepare('UPDATE schedules SET is_available = 0 WHERE id = :id');
        $updateSlot->execute(['id' => $scheduleId]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        respond(['ok' => false, 'message' => 'Could not create appointment'], 500);
    }

    respond(['ok' => true, 'id' => (int) $pdo->lastInsertId()], 201);
}

if ($action === 'update') {
    $id = (int) ($data['id'] ?? 0);
    if ($id <= 0) {
        respond(['ok' => false, 'message' => 'id is required'], 422);
    }

    $appointmentStmt = $pdo->prepare('SELECT id, patient_id, doctor_id, schedule_id, status FROM appointments WHERE id = :id LIMIT 1');
    $appointmentStmt->execute(['id' => $id]);
    $appointment = $appointmentStmt->fetch();
    if (!$appointment) {
        respond(['ok' => false, 'message' => 'Appointment not found'], 404);
    }

    if ($user['role'] === 'patient') {
        if ((int) $appointment['patient_id'] !== (int) $user['id']) {
            respond(['ok' => false, 'message' => 'Forbidden'], 403);
        }

        $doctorId = (int) ($data['doctor_id'] ?? 0);
        $newScheduleId = (int) ($data['schedule_id'] ?? 0);
        $department = trim((string) ($data['department'] ?? ''));
        $notes = trim((string) ($data['notes'] ?? ''));

        if ($doctorId <= 0 || $newScheduleId <= 0) {
            respond(['ok' => false, 'message' => 'doctor_id and schedule_id are required'], 422);
        }

        $currentSlotStmt = $pdo->prepare('SELECT doctor_id, date FROM schedules WHERE id = :id LIMIT 1');
        $currentSlotStmt->execute(['id' => $newScheduleId]);
        $currentSlot = $currentSlotStmt->fetch();
        if (!$currentSlot || (int) $currentSlot['doctor_id'] !== $doctorId) {
            respond(['ok' => false, 'message' => 'Selected time does not belong to selected doctor'], 409);
        }

        $pdo->beginTransaction();
        try {
            $oldScheduleId = (int) $appointment['schedule_id'];
            if ($newScheduleId !== $oldScheduleId) {
                $slotStmt = $pdo->prepare('SELECT id, doctor_id, is_available, date FROM schedules WHERE id = :id LIMIT 1');
                $slotStmt->execute(['id' => $newScheduleId]);
                $slot = $slotStmt->fetch();
                if (!$slot || (int) $slot['doctor_id'] !== $doctorId || (int) $slot['is_available'] !== 1) {
                    throw new RuntimeException('slot unavailable');
                }

                $dailyCountStmt = $pdo->prepare(
                    'SELECT COUNT(a.id) AS daily_count
                     FROM appointments a
                     INNER JOIN schedules s ON s.id = a.schedule_id
                     WHERE a.doctor_id = :doctor_id
                       AND s.date = :schedule_date
                       AND a.status <> "cancelled"
                       AND a.id <> :appointment_id'
                );
                $dailyCountStmt->execute([
                    'doctor_id' => $doctorId,
                    'schedule_date' => (string) $slot['date'],
                    'appointment_id' => $id,
                ]);
                $dailyCount = (int) (($dailyCountStmt->fetch()['daily_count'] ?? 0));
                if ($dailyCount >= 15) {
                    throw new RuntimeException('today full');
                }

                $freeOld = $pdo->prepare('UPDATE schedules SET is_available = 1 WHERE id = :id');
                $freeOld->execute(['id' => $oldScheduleId]);

                $bookNew = $pdo->prepare('UPDATE schedules SET is_available = 0 WHERE id = :id');
                $bookNew->execute(['id' => $newScheduleId]);
            }

            $update = $pdo->prepare(
                'UPDATE appointments
                 SET doctor_id = :doctor_id, schedule_id = :schedule_id, department = :department, notes = :notes, status = "booked"
                 WHERE id = :id'
            );
            $update->execute([
                'doctor_id' => $doctorId,
                'schedule_id' => $newScheduleId,
                'department' => $department !== '' ? $department : null,
                'notes' => $notes !== '' ? $notes : null,
                'id' => $id,
            ]);

            $pdo->commit();
            respond(['ok' => true]);
        } catch (Throwable $e) {
            $pdo->rollBack();
            $errorText = strtolower($e->getMessage());
            if (strpos($errorText, 'today full') !== false) {
                respond(['ok' => false, 'message' => 'Today is full for this doctor. Please choose another date.'], 409);
            }
            respond(['ok' => false, 'message' => 'Could not update appointment'], 409);
        }
    }

    if ($user['role'] === 'doctor') {
        if ((int) $appointment['doctor_id'] !== (int) $user['id']) {
            respond(['ok' => false, 'message' => 'Forbidden'], 403);
        }
        $status = trim((string) ($data['status'] ?? ''));
        if (!in_array($status, ['booked', 'completed', 'cancelled'], true)) {
            respond(['ok' => false, 'message' => 'Invalid status'], 422);
        }

        $pdo->beginTransaction();
        try {
            $update = $pdo->prepare('UPDATE appointments SET status = :status WHERE id = :id');
            $update->execute(['status' => $status, 'id' => $id]);

            if ($status === 'cancelled') {
                $freeSlot = $pdo->prepare('UPDATE schedules SET is_available = 1 WHERE id = :id');
                $freeSlot->execute(['id' => (int) $appointment['schedule_id']]);
            }

            $pdo->commit();
            respond(['ok' => true]);
        } catch (Throwable $e) {
            $pdo->rollBack();
            respond(['ok' => false, 'message' => 'Could not update status'], 500);
        }
    }

    if ($user['role'] === 'admin') {
        $status = trim((string) ($data['status'] ?? ''));
        if (!in_array($status, ['booked', 'completed', 'cancelled'], true)) {
            respond(['ok' => false, 'message' => 'Invalid status'], 422);
        }

        $update = $pdo->prepare('UPDATE appointments SET status = :status WHERE id = :id');
        $update->execute(['status' => $status, 'id' => $id]);
        respond(['ok' => true]);
    }
}

if ($action === 'delete') {
    $id = (int) ($data['id'] ?? 0);
    if ($id <= 0) {
        respond(['ok' => false, 'message' => 'id is required'], 422);
    }

    $appointmentStmt = $pdo->prepare('SELECT id, patient_id, schedule_id FROM appointments WHERE id = :id LIMIT 1');
    $appointmentStmt->execute(['id' => $id]);
    $appointment = $appointmentStmt->fetch();
    if (!$appointment) {
        respond(['ok' => false, 'message' => 'Appointment not found'], 404);
    }

    if ($user['role'] === 'patient' && (int) $appointment['patient_id'] !== (int) $user['id']) {
        respond(['ok' => false, 'message' => 'Forbidden'], 403);
    }
    if (!in_array($user['role'], ['patient', 'admin'], true)) {
        respond(['ok' => false, 'message' => 'Forbidden'], 403);
    }

    $pdo->beginTransaction();
    try {
        $freeSlot = $pdo->prepare('UPDATE schedules SET is_available = 1 WHERE id = :id');
        $freeSlot->execute(['id' => (int) $appointment['schedule_id']]);

        $delete = $pdo->prepare('DELETE FROM appointments WHERE id = :id');
        $delete->execute(['id' => $id]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        respond(['ok' => false, 'message' => 'Could not delete appointment'], 500);
    }

    respond(['ok' => true]);
}

respond(['ok' => false, 'message' => 'Invalid action'], 422);
