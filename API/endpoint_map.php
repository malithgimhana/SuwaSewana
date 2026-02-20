<?php
declare(strict_types=1);

header('Content-Type: application/json');

echo json_encode([
    'ok' => true,
    'message' => 'Simple endpoint map for viva/demo explanation',
    'auth' => [
        'POST /api/auth/login.php' => ['identifier', 'password'],
        'POST /api/auth/register_patient.php' => ['fullName', 'email', 'phone', 'username', 'password', 'gender'],
        'POST /api/auth/session.php' => [],
        'POST /api/auth/logout.php' => [],
    ],
    'doctors' => [
        'POST /api/doctors.php (action=list)' => [],
        'POST /api/doctors.php (action=profile)' => ['id?'],
        'POST /api/doctors.php (action=create)' => ['admin only'],
        'POST /api/doctors.php (action=update)' => ['admin only'],
        'POST /api/doctors.php (action=delete)' => ['admin only'],
        'POST /api/upload_doctor_photo.php' => ['photo file'],
    ],
    'patients' => [
        'POST /api/patients.php (action=list)' => ['admin only'],
        'POST /api/patients.php (action=create)' => ['admin only'],
    ],
    'schedules' => [
        'POST /api/schedules.php (action=list_available)' => ['doctor_id', 'date?'],
        'POST /api/schedules.php (action=list)' => ['doctor/admin'],
        'POST /api/schedules.php (action=create)' => ['doctor/admin'],
        'POST /api/schedules.php (action=update)' => ['doctor/admin'],
        'POST /api/schedules.php (action=delete)' => ['doctor/admin'],
    ],
    'appointments' => [
        'POST /api/appointments.php (action=list)' => ['role-based output'],
        'POST /api/appointments.php (action=create)' => ['patient/admin'],
        'POST /api/appointments.php (action=update)' => ['patient/doctor/admin'],
        'POST /api/appointments.php (action=delete)' => ['patient/admin'],
    ],
    'contact' => [
        'POST /api/contact_messages.php' => ['firstName', 'lastName', 'email', 'phone?', 'subject', 'message'],
    ],
], JSON_PRETTY_PRINT);
