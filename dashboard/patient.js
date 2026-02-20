const noticeEl = document.getElementById('notice');
const welcomeText = document.getElementById('welcomeText');
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-tab]');
const tabPanels = document.querySelectorAll('.tab-panel');

const appointmentForm = document.getElementById('appointmentForm');
const appointmentsTbody = document.getElementById('appointmentsTbody');
const departmentSelect = document.getElementById('departmentSelect');
const doctorSelect = document.getElementById('doctorSelect');
const dateSelect = document.getElementById('dateSelect');
const scheduleSelect = document.getElementById('scheduleSelect');
const notesInput = document.getElementById('notesInput');
const appointmentIdInput = document.getElementById('appointmentId');

const profileForm = document.getElementById('profileForm');
const profileFormMessage = document.getElementById('profileFormMessage');
const profilePhotoPreview = document.getElementById('profilePhotoPreview');
const profilePhotoInput = document.getElementById('profilePhotoInput');
const fullNameInput = document.getElementById('fullNameInput');
const usernameInput = document.getElementById('usernameInput');
const emailInput = document.getElementById('emailInput');
const phoneInput = document.getElementById('phoneInput');
const passwordInput = document.getElementById('passwordInput');
const confirmPasswordInput = document.getElementById('confirmPasswordInput');

const API = '../api';
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const validators = {
  fullName: (value) => {
    if (!/^[A-Za-z][A-Za-z\s'-]{0,29}$/.test(value)) return false;
    return value.trim().split(/\s+/).every((part) => part.length <= 12);
  },
  username: (value) => /^[A-Za-z0-9]{1,10}$/.test(value),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^0\d{9}$/.test(value),
  password: (value) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8}$/.test(value)
};

let doctors = [];
let currentAppointments = [];
let currentProfile = null;
let uploadedPhotoPath = '';
let availableDatesMeta = [];

function initPasswordToggles() {
  document.querySelectorAll('.password-toggle-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;
      const openEye = button.querySelector('.eye-open');
      const closedEye = button.querySelector('.eye-closed');
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      if (openEye && closedEye) {
        openEye.classList.toggle('hidden', !showing);
        closedEye.classList.toggle('hidden', showing);
      }
    });
  });
}

function showNotice(message, type = 'success') {
  noticeEl.innerHTML = `<p class="notice ${type}">${message}</p>`;
}

function showProfileMessage(message, type = 'error') {
  profileFormMessage.innerHTML = message;
  profileFormMessage.classList.remove('hidden', 'success', 'error');
  profileFormMessage.classList.add(type);
}

function clearProfileMessage() {
  profileFormMessage.innerHTML = '';
  profileFormMessage.classList.add('hidden');
  profileFormMessage.classList.remove('success', 'error');
}

function resetPasswordVisibility() {
  document.querySelectorAll('.password-toggle-btn').forEach((button) => {
    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;
    input.type = 'password';
    const openEye = button.querySelector('.eye-open');
    const closedEye = button.querySelector('.eye-closed');
    if (openEye && closedEye) {
      openEye.classList.remove('hidden');
      closedEye.classList.add('hidden');
    }
  });
}

function toAssetUrl(path) {
  if (!path) return '../img/meddical_team.png';
  return `../${path}`;
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

function activateTab(tabId) {
  sidebarLinks.forEach((link) => {
    const isActive = link.dataset.tab === tabId;
    link.classList.toggle('active', isActive);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

async function ensurePatient() {
  const data = await apiFetch('/auth/session.php', { body: JSON.stringify({}) });
  if (!data.authenticated || data.user.role !== 'patient') {
    window.location.href = '../login/login.html';
    return false;
  }
  welcomeText.textContent = `Hi ${data.user.name}`;
  return true;
}

async function loadDoctors() {
  const data = await apiFetch('/doctors.php', { body: JSON.stringify({ action: 'list' }) });
  doctors = data.doctors || [];

  const departments = [...new Set(doctors.map((d) => String(d.department || '').trim()).filter(Boolean))].sort();
  departmentSelect.innerHTML = '<option value="">Select department</option>' +
    departments.map((dep) => `<option value="${dep}">${dep}</option>`).join('');

  doctorSelect.innerHTML = '<option value="">Select doctor</option>';
  dateSelect.innerHTML = '<option value="">Select available date</option>';
}

function populateDoctorsByDepartment(department) {
  const filtered = doctors.filter((d) => String(d.department || '').trim() === department);
  doctorSelect.innerHTML = '<option value="">Select doctor</option>' +
    filtered.map((d) => `<option value="${d.id}">${d.full_name}</option>`).join('');
  dateSelect.innerHTML = '<option value="">Select available date</option>';
}

async function loadAvailableDates(doctorId, selectedDate = '') {
  dateSelect.innerHTML = '<option value="">Select available date</option>';
  scheduleSelect.innerHTML = '<option value="">Select available time</option>';
  availableDatesMeta = [];

  if (!doctorId) return;

  const data = await apiFetch('/schedules.php', {
    body: JSON.stringify({
      action: 'list_available_dates',
      doctor_id: Number(doctorId)
    })
  });

  availableDatesMeta = data.dates || [];
  if (availableDatesMeta.length === 0) {
    showNotice('No available dates for this doctor', 'error');
    return;
  }

  dateSelect.innerHTML = '<option value="">Select available date</option>' + availableDatesMeta
    .map((item) => {
      const dateValue = String(item.date || '');
      const isFull = Number(item.is_full || 0) === 1;
      const availableSlots = Number(item.available_slots || 0);
      const bookedCount = Number(item.booked_count || 0);
      const label = `${dateValue} (${availableSlots} slot${availableSlots === 1 ? '' : 's'} available${isFull ? ', Today is full' : `, ${bookedCount}/15 booked`})`;
      return `<option value="${dateValue}" ${isFull ? 'disabled' : ''}>${label}</option>`;
    })
    .join('');

  if (selectedDate) {
    const matching = availableDatesMeta.find((item) => String(item.date) === String(selectedDate) && Number(item.is_full || 0) === 0);
    if (matching) {
      dateSelect.value = selectedDate;
    } else if (appointmentIdInput.value) {
      dateSelect.innerHTML += `<option value="${selectedDate}">${selectedDate} (current)</option>`;
      dateSelect.value = selectedDate;
    }
  }
}

async function loadAvailableSlots(doctorId, date) {
  if (!doctorId || !date) {
    scheduleSelect.innerHTML = '<option value="">Select available time</option>';
    return;
  }

  const editingId = Number(appointmentIdInput.value || 0);
  let currentScheduleOption = '';
  if (editingId) {
    const current = currentAppointments.find((a) => Number(a.id) === editingId);
    if (current?.schedule_id) {
      currentScheduleOption = `<option value="${current.schedule_id}">${current.start_time} - ${current.end_time} (current)</option>`;
    }
  }

  const data = await apiFetch('/schedules.php', {
    body: JSON.stringify({
      action: 'list_available',
      doctor_id: Number(doctorId),
      date
    })
  });
  const options = (data.schedules || [])
    .map((s) => `<option value="${s.id}">${s.start_time} - ${s.end_time}</option>`)
    .join('');
  scheduleSelect.innerHTML = `<option value="">Select available time</option>${currentScheduleOption}${options}`;
}

async function loadAppointments() {
  const data = await apiFetch('/appointments.php', { body: JSON.stringify({ action: 'list' }) });
  currentAppointments = data.appointments || [];
  appointmentsTbody.innerHTML = currentAppointments.map((a) => `
    <tr>
      <td>${a.id}</td>
      <td>${a.doctor_name}</td>
      <td>${a.appointment_date || ''}</td>
      <td>${a.start_time || ''} - ${a.end_time || ''}</td>
      <td>${a.status}</td>
      <td>
        <div class="actions">
          <button class="btn btn-muted" onclick="editAppointment(${a.id})">Edit</button>
          <button class="btn btn-danger" onclick="deleteAppointment(${a.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function clearAppointmentForm() {
  appointmentIdInput.value = '';
  appointmentForm.reset();
  doctorSelect.innerHTML = '<option value="">Select doctor</option>';
  dateSelect.innerHTML = '<option value="">Select available date</option>';
  scheduleSelect.innerHTML = '<option value="">Select available time</option>';
  availableDatesMeta = [];
}

window.editAppointment = async function editAppointment(id) {
  const item = currentAppointments.find((a) => Number(a.id) === Number(id));
  if (!item) return;
  appointmentIdInput.value = item.id;
  departmentSelect.value = item.department || '';
  populateDoctorsByDepartment(departmentSelect.value);
  doctorSelect.value = item.doctor_id;
  await loadAvailableDates(item.doctor_id, item.appointment_date || '');
  notesInput.value = item.notes || '';
  await loadAvailableSlots(item.doctor_id, item.appointment_date || '');
  scheduleSelect.value = item.schedule_id;
};

window.deleteAppointment = async function deleteAppointment(id) {
  if (!confirm('Delete this appointment?')) return;
  try {
    await apiFetch('/appointments.php', { body: JSON.stringify({ action: 'delete', id: Number(id) }) });
    showNotice('Appointment deleted');
    await loadAppointments();
    clearAppointmentForm();
  } catch (error) {
    showNotice(error.message, 'error');
  }
};

appointmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = appointmentIdInput.value;
  const payload = {
    doctor_id: Number(doctorSelect.value),
    schedule_id: Number(scheduleSelect.value),
    department: departmentSelect.value.trim(),
    appointment_date: dateSelect.value,
    notes: notesInput.value.trim()
  };

  try {
    if (!payload.department) throw new Error('Please select department');
    if (!payload.doctor_id) throw new Error('Please select doctor');
    if (!payload.appointment_date) throw new Error('Please select available date');
    if (!payload.schedule_id) throw new Error('Please select available time');

    if (id) {
      await apiFetch('/appointments.php', { body: JSON.stringify({ action: 'update', id: Number(id), ...payload }) });
      showNotice('Appointment updated');
    } else {
      await apiFetch('/appointments.php', { body: JSON.stringify({ action: 'create', ...payload }) });
      showNotice('Appointment created');
    }
    await loadAppointments();
    clearAppointmentForm();
  } catch (error) {
    showNotice(error.message, 'error');
  }
});

async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch(`${API}/upload_patient_photo.php`, {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || 'Photo upload failed');
  }
  return data.photo_path;
}

async function loadProfile() {
  const data = await apiFetch('/patient_profile.php', { body: JSON.stringify({ action: 'get' }) });
  currentProfile = data.profile || null;
  if (!currentProfile) return;

  fullNameInput.value = currentProfile.full_name || '';
  usernameInput.value = currentProfile.username || '';
  emailInput.value = currentProfile.email || '';
  phoneInput.value = currentProfile.phone || '';
  profilePhotoPreview.src = toAssetUrl(currentProfile.photo_path || '');
  uploadedPhotoPath = currentProfile.photo_path || '';
}

profilePhotoInput.addEventListener('change', () => {
  const file = profilePhotoInput.files?.[0];
  if (!file) return;
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    showProfileMessage('Photo must be 5MB or less', 'error');
    profilePhotoInput.value = '';
    return;
  }
  const objectUrl = URL.createObjectURL(file);
  profilePhotoPreview.src = objectUrl;
});

phoneInput.addEventListener('input', () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
});
usernameInput.addEventListener('input', () => {
  usernameInput.value = usernameInput.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 10);
});

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    clearProfileMessage();
    const errors = [];

    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!validators.fullName(fullName)) errors.push('Full name is invalid (max 30 chars; each name part max 12)');
    if (!validators.username(username)) errors.push('Username must be alphanumeric and up to 10 characters');
    if (!validators.email(email)) errors.push('Email format is invalid');
    if (!validators.phone(phone)) errors.push('Phone must start with 0 and contain exactly 10 digits');
    if (password && !validators.password(password)) errors.push('Password must be at least 8 characters and include letters and numbers');
    if (password && password !== confirmPassword) errors.push('Confirm password must match new password');

    if (errors.length > 0) {
      throw new Error(`<strong>Please fix the following:</strong><br>${[...new Set(errors)].join('<br>')}`);
    }

    let photoPath = uploadedPhotoPath;
    const file = profilePhotoInput.files?.[0];
    if (file) {
      photoPath = await uploadProfilePhoto(file);
    }

    const payload = {
      action: 'update',
      full_name: fullName,
      username,
      email,
      phone,
      photo_path: photoPath,
      password: password || ''
    };

    const data = await apiFetch('/patient_profile.php', { body: JSON.stringify(payload) });
    showNotice('Profile updated successfully');
    if (data.user?.name) {
      welcomeText.textContent = `Hi ${data.user.name}`;
    }
    passwordInput.value = '';
    confirmPasswordInput.value = '';
    profilePhotoInput.value = '';
    resetPasswordVisibility();
    await loadProfile();
  } catch (error) {
    showProfileMessage(error.message, 'error');
  }
});

document.getElementById('clearBtn').addEventListener('click', clearAppointmentForm);
departmentSelect.addEventListener('change', () => {
  populateDoctorsByDepartment(departmentSelect.value);
  dateSelect.innerHTML = '<option value="">Select available date</option>';
  scheduleSelect.innerHTML = '<option value="">Select available time</option>';
});
doctorSelect.addEventListener('change', async () => {
  await loadAvailableDates(doctorSelect.value);
});
dateSelect.addEventListener('change', async () => {
  const selectedDate = dateSelect.value;
  const dateMeta = availableDatesMeta.find((item) => String(item.date) === String(selectedDate));
  if (dateMeta && Number(dateMeta.is_full || 0) === 1) {
    showNotice('Today is full for this doctor. Please choose another date.', 'error');
    scheduleSelect.innerHTML = '<option value="">Select available time</option>';
    return;
  }
  await loadAvailableSlots(doctorSelect.value, selectedDate);
});

sidebarLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    activateTab(link.dataset.tab);
  });
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await apiFetch('/auth/logout.php', { method: 'POST' });
  window.location.href = '../home/home.html';
});

(async function init() {
  try {
    initPasswordToggles();
    resetPasswordVisibility();
    if (!await ensurePatient()) return;
    await loadDoctors();
    await loadAppointments();
    await loadProfile();
    clearAppointmentForm();
    activateTab('appointmentsPanel');
  } catch (error) {
    showNotice(error.message, 'error');
  }
})();
