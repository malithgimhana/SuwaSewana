const noticeEl = document.getElementById('notice');
const welcomeText = document.getElementById('welcomeText');
const doctorPhoto = document.getElementById('doctorPhoto');
const doctorName = document.getElementById('doctorName');
const doctorSpecialty = document.getElementById('doctorSpecialty');
const doctorUsername = document.getElementById('doctorUsername');
const doctorPassword = document.getElementById('doctorPassword');
const doctorEmail = document.getElementById('doctorEmail');
const doctorPhone = document.getElementById('doctorPhone');
const doctorGender = document.getElementById('doctorGender');
const doctorNic = document.getElementById('doctorNic');
const doctorProfileForm = document.getElementById('doctorProfileForm');
const doctorProfileMessage = document.getElementById('doctorProfileMessage');
const profilePhotoInput = document.getElementById('profilePhotoInput');
const scheduleForm = document.getElementById('scheduleForm');
const schedulesTbody = document.getElementById('schedulesTbody');
const appointmentsTbody = document.getElementById('appointmentsTbody');

const scheduleIdInput = document.getElementById('scheduleId');
const dateInput = document.getElementById('dateInput');
const startTimeInput = document.getElementById('startTimeInput');
const endTimeInput = document.getElementById('endTimeInput');

const API = '../api';
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
let schedules = [];
let currentSpecialty = '';

function showNotice(message, type = 'success') {
  noticeEl.innerHTML = `<p class="notice ${type}">${message}</p>`;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    ...options
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

async function ensureDoctor() {
  const data = await apiFetch('/auth/session.php', { body: JSON.stringify({}) });
  if (!data.authenticated || data.user.role !== 'doctor') {
    window.location.href = '../login/login.html';
    return false;
  }
  welcomeText.textContent = `Hi ${data.user.name}`;
  return true;
}

function showProfileMessage(message, type = 'error') {
  doctorProfileMessage.innerHTML = message;
  doctorProfileMessage.classList.remove('hidden', 'success', 'error');
  doctorProfileMessage.classList.add(type);
}

function clearProfileMessage() {
  doctorProfileMessage.innerHTML = '';
  doctorProfileMessage.classList.add('hidden');
  doctorProfileMessage.classList.remove('success', 'error');
}

function toAssetUrl(path) {
  if (!path) return '../img/meddical_team.png';
  return `../${path}`;
}

async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch(`${API}/upload_doctor_photo.php`, {
    method: 'POST',
    body: formData
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    throw new Error('Photo upload returned invalid response');
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.message || 'Photo upload failed');
  }

  return data.photo_path;
}

async function loadDoctorProfile() {
  const data = await apiFetch('/doctor_profile.php', { body: JSON.stringify({ action: 'get' }) });
  const doctor = data.profile || {};
  const fullName = [doctor.first_name, doctor.last_name].filter(Boolean).join(' ').trim() || doctor.full_name || 'Doctor Profile';
  doctorName.textContent = fullName;
  currentSpecialty = doctor.department || '';
  doctorSpecialty.textContent = currentSpecialty || 'Specialty not set';
  doctorPhoto.src = toAssetUrl(doctor.photo_path);
  doctorUsername.textContent = doctor.username || '-';
  doctorPassword.textContent = 'Hidden for security';
  doctorEmail.textContent = doctor.email || '-';
  doctorPhone.textContent = doctor.phone || '-';
  doctorGender.textContent = doctor.gender || '-';
  doctorNic.textContent = doctor.nic_number || '-';
}

function clearForm() {
  scheduleIdInput.value = '';
  scheduleForm.reset();
}

async function loadSchedules() {
  const data = await apiFetch('/schedules.php', { body: JSON.stringify({ action: 'list' }) });
  schedules = data.schedules || [];
  schedulesTbody.innerHTML = schedules.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.date}</td>
      <td>${s.start_time} - ${s.end_time}</td>
      <td>${s.department || ''}</td>
      <td>${Number(s.is_available) === 1 ? 'Yes' : 'No (Booked)'}</td>
      <td>
        <div class="actions">
          <button class="btn btn-muted" onclick="editSchedule(${s.id})">Edit</button>
          <button class="btn btn-danger" onclick="deleteSchedule(${s.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.editSchedule = function editSchedule(id) {
  const item = schedules.find(s => Number(s.id) === Number(id));
  if (!item) return;
  scheduleIdInput.value = item.id;
  dateInput.value = item.date;
  startTimeInput.value = item.start_time?.slice(0, 5) || '';
  endTimeInput.value = item.end_time?.slice(0, 5) || '';
};

window.deleteSchedule = async function deleteSchedule(id) {
  if (!confirm('Delete this schedule?')) return;
  try {
    await apiFetch('/schedules.php', { body: JSON.stringify({ action: 'delete', id: Number(id) }) });
    showNotice('Schedule deleted');
    await loadSchedules();
    clearForm();
  } catch (error) {
    showNotice(error.message, 'error');
  }
};

scheduleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (dateInput.value && startTimeInput.value && endTimeInput.value) {
    const start = `${dateInput.value}T${startTimeInput.value}`;
    const end = `${dateInput.value}T${endTimeInput.value}`;
    if (new Date(end) <= new Date(start)) {
      showNotice('End time must be later than start time', 'error');
      return;
    }
  }

  const payload = {
    date: dateInput.value,
    start_time: startTimeInput.value,
    end_time: endTimeInput.value,
    department: currentSpecialty
  };
  const id = scheduleIdInput.value;

  try {
    if (id) {
      await apiFetch('/schedules.php', { body: JSON.stringify({ action: 'update', id: Number(id), ...payload }) });
      showNotice('Schedule updated');
    } else {
      await apiFetch('/schedules.php', { body: JSON.stringify({ action: 'create', ...payload }) });
      showNotice('Schedule created');
    }
    await loadSchedules();
    clearForm();
  } catch (error) {
    showNotice(error.message, 'error');
  }
});

async function loadAppointments() {
  const data = await apiFetch('/appointments.php', { body: JSON.stringify({ action: 'list' }) });
  const appointments = data.appointments || [];
  appointmentsTbody.innerHTML = appointments.map(a => `
    <tr>
      <td>${a.id}</td>
      <td>${a.patient_name}</td>
      <td>${a.appointment_date || ''}</td>
      <td>${a.start_time || ''} - ${a.end_time || ''}</td>
      <td>${a.status}</td>
      <td>
        <select onchange="updateStatus(${a.id}, this.value)">
          <option value="booked" ${a.status === 'booked' ? 'selected' : ''}>booked</option>
          <option value="completed" ${a.status === 'completed' ? 'selected' : ''}>completed</option>
          <option value="cancelled" ${a.status === 'cancelled' ? 'selected' : ''}>cancelled</option>
        </select>
      </td>
    </tr>
  `).join('');
}

window.updateStatus = async function updateStatus(id, status) {
  try {
    await apiFetch('/appointments.php', {
      body: JSON.stringify({ action: 'update', id: Number(id), status })
    });
    showNotice('Appointment status updated');
    await loadAppointments();
    await loadSchedules();
  } catch (error) {
    showNotice(error.message, 'error');
  }
};

document.getElementById('clearBtn').addEventListener('click', clearForm);

doctorProfileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    clearProfileMessage();

    const photoFile = profilePhotoInput.files && profilePhotoInput.files[0] ? profilePhotoInput.files[0] : null;
    const errors = [];

    if (!photoFile) {
      errors.push('Please select a profile photo to upload');
    }
    if (photoFile && photoFile.size > MAX_PHOTO_SIZE_BYTES) {
      errors.push('Profile photo must be 5MB or less');
    }
    if (errors.length > 0) {
      throw new Error(`<strong>Please fix the following:</strong><br>${[...new Set(errors)].join('<br>')}`);
    }

    let photoPath = '';
    if (photoFile) {
      photoPath = await uploadPhoto(photoFile);
    }

    await apiFetch('/doctor_profile.php', {
      body: JSON.stringify({
        action: 'update',
        photo_path: photoPath
      })
    });

    showProfileMessage('Profile updated successfully', 'success');
    profilePhotoInput.value = '';
    await loadDoctorProfile();
  } catch (error) {
    showProfileMessage(error.message, 'error');
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await apiFetch('/auth/logout.php', { method: 'POST' });
  window.location.href = '../home/home.html';
});

(async function init() {
  try {
    if (!await ensureDoctor()) return;
    await loadDoctorProfile();
    await loadSchedules();
    await loadAppointments();
  } catch (error) {
    showNotice(error.message, 'error');
  }
})();
