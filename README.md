#SuwaSewana - Doctor and Patient Management System

<img src="img/Github Description voer phot.png" alt="Cover image" width="100%" title="Cover photo">


<p align="center">
SuwaSewana is a web-based Doctor and Patient Management System developed to streamline clinic and small hospital operations. The system provides a centralized platform to manage doctors, patients, and appointments efficiently while reducing manual paperwork.

This project was developed as a group assignment for our Web Application Development module.
</p>



## Project Overview

SuwaSewana digitalizes healthcare management by allowing administrators, doctors, and patients to interact through a secure and user-friendly web application.

The system helps:

* Manage doctor and patient records
* Schedule and track appointments
* Store data securely in a structured database
* Users to send inquiries via contact forms

The system replaces manual paperwork with a secure, structured, and easy-to-use web application.



## Features

###  Admin Panel

* Secure login authentication
* Add / Update / Delete doctors
* Add / Update / Delete patients
* Manage appointments
* View system records

### Doctor Panel

* Secure login
* View scheduled appointments
* Access patient details
* Update medical information

### Patient Panel

* Register account
* Book appointments
* View appointment history
* Update personal details



##  Technologies Used

| Technology | Purpose       |
| ---------- | ------------- |
| HTML5      | Structure     |
| CSS3       | Styling       |
| PHP        | Backend Logic |
| MySQL      | Database      |
| XAMPP      | Local Server  |



##  Database Structure

Main Tables:

* `user`
* `schedules`
* `appointments`
* `contant`

The system uses relational database design with foreign key relationships between patients, doctors, and appointments.



## Installation Guide

1. Clone the repository:

```bash
git clone https://github.com/your-username/suwasewana.git
```

2. Move the project folder to:

```
xampp/htdocs/
```

3. Import the database file (`suwasewana.sql`) into phpMyAdmin.

4. Start Apache and MySQL using XAMPP.

5. Open in browser:

```
http://localhost/suwasewana/
```



## Future Improvements

* Password encryption (bcrypt)
* Email/SMS appointment notifications
* Online payment integration
* Prescription management module
* Deploy to live hosting server



## Team Members

* Member 1 – Frontend Development
* Member 2 – Backend Development
* Member 3 – Database Design
* Member 4 – Appointment Module
* Member 5 – Testing & Documentation



##License

This project is developed for educational purposes only.

---

<p align="center">
  <img src="https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
</p>
