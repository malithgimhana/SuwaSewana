const noticeEl = document.getElementById('notice');
const doctorsTbody = document.getElementById('doctorsTbody');
const addDoctorBtn = document.getElementById('addDoctorBtn');
const doctorModal = document.getElementById('doctorModal');
const doctorModalTitle = document.getElementById('doctorModalTitle');
const closeDoctorModalBtn = document.getElementById('closeDoctorModal');
const cancelDoctorBtn = document.getElementById('cancelDoctorBtn');
const doctorForm = document.getElementById('doctorForm');
const doctorFormMessage = document.getElementById('doctorFormMessage');
const saveDoctorBtn = document.getElementById('saveDoctorBtn');
const passwordLabel = document.getElementById('passwordLabel');
const doctorIdInput = document.getElementById('doctorIdInput');

const firstNameInput = document.getElementById('firstNameInput');
const lastNameInput = document.getElementById('lastNameInput');
const specialtyInput = document.getElementById('specialtyInput');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const emailInput = document.getElementById('emailInput');
const phoneInput = document.getElementById('phoneInput');
const genderInput = document.getElementById('genderInput');
const nicInput = document.getElementById('nicInput');
const photoInput = document.getElementById('photoInput');
const experienceYearsInput = document.getElementById('experienceYearsInput');
const profileBioInput = document.getElementById('profileBioInput');

const API = '../api';
const validators = {
  personName: (value) => /^[A-Za-z][A-Za-z\s'-]{0,11}$/.test(value),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^0\d{9}$/.test(value),
  username: (value) => /^[A-Za-z0-9]{1,10}$/.test(value),
  password: (value) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8}$/.test(value),
  nic: (value) => /^\d{12}$/.test(value)
};
const nicFormatMessage = 'NIC format: 12 digits only (example: 200012345678)';
const phoneFormatMessage = 'Phone format: starts with 0 and has exactly 10 digits (example: 0771234567)';
const passwordFormatMessage = 'Password policy: exactly 8 characters, letters and numbers only';
const passwordRequiredMessage = 'Password is mandatory when adding a doctor';
const photoSizeMessage = 'Doctor photo must be 5MB or less';
const photoRequiredMessage = 'Doctor photo is required when adding a new doctor';
const experienceMessage = 'Experience years must be between 1 and 60';
const profileBioMessage = 'Public profile bio must be between 30 and 255 characters';
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
let doctorsCache = [];
let editingDoctorId = null;
let editingPhotoPath = '';

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

function clearNotice() {
  noticeEl.innerHTML = '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toAssetUrl(path) {
  if (!path) return '../img/meddical_team.png';
  return `../${path}`;
}

function showFormMessage(message, type = 'error') {
  doctorFormMessage.innerHTML = message;
  doctorFormMessage.classList.remove('hidden', 'success', 'error');
  doctorFormMessage.classList.add(type);
}

function clearFormMessage() {
  doctorFormMessage.innerHTML = '';
  doctorFormMessage.classList.add('hidden');
  doctorFormMessage.classList.remove('success', 'error');
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

function enableModalDrag(modalEl) {
  const card = modalEl.querySelector('.modal-card');
  const handle = modalEl.querySelector('.modal-head');
  if (!card || !handle) return () => {};

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;

  function onMouseMove(event) {
    if (!dragging) return;
    offsetX = event.clientX - startX;
    offsetY = event.clientY - startY;
    card.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }

  function onMouseUp() {
    dragging = false;
    document.body.style.userSelect = '';
  }

  handle.style.cursor = 'move';
  handle.addEventListener('mousedown', (event) => {
    if (event.target.closest('.btn-close')) return;
    dragging = true;
    startX = event.clientX - offsetX;
    startY = event.clientY - offsetY;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  return () => {
    offsetX = 0;
    offsetY = 0;
    card.style.transform = 'translate(0, 0)';
  };
}

const resetDoctorModalPosition = enableModalDrag(doctorModal);

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    ...options
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    const snippet = raw.slice(0, 160).replace(/\s+/g, ' ').trim();
    throw new Error(`Invalid API response from ${path}${snippet ? `: ${snippet}` : ''}`);
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

async function ensureAdmin() {
  const data = await apiFetch('/auth/session.php', { body: JSON.stringify({}) });
  if (!data.authenticated || data.user.role !== 'admin') {
    window.location.href = '../login/login.html';
    return false;
  }
  return true;
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

function renderDoctors(doctors) {
  doctorsTbody.innerHTML = doctors.map((doctor) => `
    <tr>
      <td><img class="doctor-thumb" src="${escapeHtml(toAssetUrl(doctor.photo_path))}" alt="Doctor photo"></td>
      <td>${doctor.id}</td>
      <td>${escapeHtml(doctor.first_name)}</td>
      <td>${escapeHtml(doctor.last_name)}</td>
      <td>${escapeHtml(doctor.specialty)}</td>
      <td>${Number(doctor.experience_years || 0)} years</td>
      <td>${escapeHtml(doctor.username)}</td>
      <td>${escapeHtml(doctor.email)}</td>
      <td>${escapeHtml(doctor.phone)}</td>
      <td>${escapeHtml(doctor.gender)}</td>
      <td>${escapeHtml(doctor.nic_number)}</td>
      <td>
        <div class="actions">
          <button class="btn btn-muted" onclick="editDoctor(${Number(doctor.id)})">Edit</button>
          <button class="btn btn-danger" onclick="deleteDoctor(${Number(doctor.id)})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function loadDoctors() {
  const data = await apiFetch('/doctors.php', { body: JSON.stringify({ action: 'list' }) });
  doctorsCache = data.doctors || [];
  renderDoctors(doctorsCache);
}

function openAddDoctorModal() {
  clearNotice();
  clearFormMessage();
  resetDoctorModalPosition();
  editingDoctorId = null;
  editingPhotoPath = '';
  doctorModalTitle.textContent = 'Add Doctor';
  saveDoctorBtn.textContent = 'Save Doctor';
  passwordLabel.textContent = 'Password *';
  passwordInput.required = true;
  passwordInput.placeholder = 'Ex: Nimal1234';
  passwordInput.value = '';
  doctorIdInput.value = '';
  doctorForm.reset();
  resetPasswordVisibility();
  doctorModal.classList.remove('hidden');
}

function openEditDoctorModal(doctor) {
  clearNotice();
  clearFormMessage();
  resetDoctorModalPosition();
  editingDoctorId = Number(doctor.id);
  editingPhotoPath = doctor.photo_path || '';

  doctorModalTitle.textContent = 'Edit Doctor / Update Password';
  saveDoctorBtn.textContent = 'Update Doctor';
  passwordLabel.textContent = 'Password (optional, only if changing login password)';
  passwordInput.required = false;
  passwordInput.placeholder = 'Enter new password to update (leave blank to keep current)';

  doctorIdInput.value = String(doctor.id);
  firstNameInput.value = doctor.first_name || '';
  lastNameInput.value = doctor.last_name || '';
  specialtyInput.value = doctor.specialty || '';
  usernameInput.value = doctor.username || '';
  passwordInput.value = '';
  emailInput.value = doctor.email || '';
  phoneInput.value = doctor.phone || '';
  genderInput.value = doctor.gender || '';
  nicInput.value = doctor.nic_number || '';
  experienceYearsInput.value = doctor.experience_years || '';
  profileBioInput.value = doctor.profile_bio || '';
  photoInput.value = '';
  resetPasswordVisibility();

  doctorModal.classList.remove('hidden');
}

function closeDoctorModal() {
  doctorModal.classList.add('hidden');
  doctorForm.reset();
  resetPasswordVisibility();
  clearFormMessage();
  resetDoctorModalPosition();
  editingDoctorId = null;
  editingPhotoPath = '';
}

window.editDoctor = function editDoctor(id) {
  const doctor = doctorsCache.find((item) => Number(item.id) === Number(id));
  if (!doctor) return;
  openEditDoctorModal(doctor);
};

window.deleteDoctor = async function deleteDoctor(id) {
  if (!confirm('Delete this doctor? This will also remove related schedules and appointments.')) return;
  try {
    await apiFetch('/doctors.php', { body: JSON.stringify({ action: 'delete', id: Number(id) }) });
    showNotice('Doctor deleted successfully');
    await loadDoctors();
  } catch (error) {
    showNotice(error.message, 'error');
  }
};

nicInput.addEventListener('input', () => {
  nicInput.value = nicInput.value.replace(/\D/g, '').slice(0, 12);
});

phoneInput.addEventListener('input', () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
});

doctorForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    clearFormMessage();
    const errors = [];

    if (!validators.personName(firstNameInput.value.trim())) {
      errors.push('First name must be letters only and up to 12 characters');
    }
    if (!validators.personName(lastNameInput.value.trim())) {
      errors.push('Last name must be letters only and up to 12 characters');
    }
    if (!validators.username(usernameInput.value.trim())) {
      errors.push('Username must be alphanumeric and up to 10 characters');
    }
    if (!validators.email(emailInput.value.trim())) {
      errors.push('Email format must be valid (example: name@example.com)');
    }
    if (!validators.phone(phoneInput.value.trim())) {
      errors.push(phoneFormatMessage);
    }
    if (!validators.nic(nicInput.value.trim())) {
      errors.push(nicFormatMessage);
    }
    const experienceYears = Number(experienceYearsInput.value || 0);
    if (!Number.isInteger(experienceYears) || experienceYears < 1 || experienceYears > 60) {
      errors.push(experienceMessage);
    }
    const profileBio = profileBioInput.value.trim();
    if (profileBio.length < 30 || profileBio.length > 255) {
      errors.push(profileBioMessage);
    }
    if (!editingDoctorId && passwordInput.value.trim() === '') {
      errors.push(passwordRequiredMessage);
    }
    if (!editingDoctorId && passwordInput.value.trim() !== '' && !validators.password(passwordInput.value)) {
      errors.push(passwordFormatMessage);
    }
    if (editingDoctorId && passwordInput.value && !validators.password(passwordInput.value)) {
      errors.push(passwordFormatMessage);
    }

    if (!editingDoctorId && (!photoInput.files || !photoInput.files[0])) {
      errors.push(photoRequiredMessage);
    }

    if (errors.length > 0) {
      const uniqueErrors = [...new Set(errors)];
      throw new Error(`<strong>Please fix the following:</strong><br>${uniqueErrors.join('<br>')}`);
    }

    clearFormMessage();
    let photoPath = editingPhotoPath;
    if (photoInput.files && photoInput.files[0]) {
      if (photoInput.files[0].size > MAX_PHOTO_SIZE_BYTES) {
        throw new Error(photoSizeMessage);
      }
      photoPath = await uploadPhoto(photoInput.files[0]);
    }

    const payload = {
      action: editingDoctorId ? 'update' : 'create',
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      specialty: specialtyInput.value,
      username: usernameInput.value.trim(),
      password: passwordInput.value,
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      gender: genderInput.value,
      nic_number: nicInput.value.trim(),
      experience_years: Number(experienceYearsInput.value || 0),
      profile_bio: profileBioInput.value.trim(),
      photo_path: photoPath
    };

    if (editingDoctorId) {
      payload.id = editingDoctorId;
    }

    await apiFetch('/doctors.php', { body: JSON.stringify(payload) });
    showNotice(editingDoctorId ? 'Doctor updated successfully' : 'Doctor created successfully');
    closeDoctorModal();
    await loadDoctors();
  } catch (error) {
    showFormMessage(error.message, 'error');
  }
});

addDoctorBtn.addEventListener('click', openAddDoctorModal);
closeDoctorModalBtn.addEventListener('click', closeDoctorModal);
cancelDoctorBtn.addEventListener('click', closeDoctorModal);

doctorModal.addEventListener('click', (event) => {
  if (event.target === doctorModal) {
    closeDoctorModal();
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await apiFetch('/auth/logout.php', { method: 'POST' });
  window.location.href = '../home/home.html';
});

(async function init() {
  try {
    initPasswordToggles();
    if (!await ensureAdmin()) return;
    await loadDoctors();
  } catch (error) {
    showNotice(error.message, 'error');
  }
})();
