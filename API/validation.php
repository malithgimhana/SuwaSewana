<?php
declare(strict_types=1);

function is_valid_email(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function is_valid_phone(string $phone): bool
{
    return (bool) preg_match('/^0\d{9}$/', $phone);
}

function is_valid_nic(string $nic): bool
{
    return (bool) preg_match('/^\d{12}$/', $nic);
}

function is_valid_username(string $username): bool
{
    return (bool) preg_match('/^[A-Za-z0-9]{1,10}$/', $username);
}

function is_valid_password(string $password): bool
{
    return (bool) preg_match('/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8}$/', $password);
}

function is_valid_person_name(string $name, int $maxLength = 12): bool
{
    if ($name === '' || strlen($name) > $maxLength) {
        return false;
    }
    return (bool) preg_match("/^[A-Za-z][A-Za-z\\s'-]*$/", $name);
}

function is_valid_full_name(string $name, int $maxLength = 30): bool
{
    if ($name === '' || strlen($name) > $maxLength) {
        return false;
    }
    if (!preg_match("/^[A-Za-z][A-Za-z\\s'-]*$/", $name)) {
        return false;
    }

    $parts = preg_split('/\s+/', trim($name)) ?: [];
    foreach ($parts as $part) {
        if ($part !== '' && strlen($part) > 12) {
            return false;
        }
    }

    return true;
}
