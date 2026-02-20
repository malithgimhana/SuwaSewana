const noticeEl = document.getElementById('notice');
const patientsTbody = document.getElementById('patientsTbody');
const addPatientBtn = document.getElementById('addPatientBtn');
const patientModal = document.getElementById('patientModal');
const patientModalTitle = document.getElementById('patientModalTitle');
const closePatientModalBtn = document.getElementById('closePatientModal');
const cancelPatientBtn = document.getElementById('cancelPatientBtn');
const patientForm = document.getElementById('patientForm');
const patientFormMessage = document.getElementById('patientFormMessage');
const savePatientBtn = document.getElementById('savePatientBtn');
const patientIdInput = document.getElementById('patientIdInput');

const fullNameInput = document.getElementById('fullNameInput');
const emailInput = document.getElementById('emailInput');
const phoneInput = document.getElementById('phoneInput');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const passwordLabel = document.getElementById('passwordLabel');
const confirmPasswordInput = document.getElementById('confirmPasswordInput');
const confirmPasswordLabel = document.getElementById('confirmPasswordLabel');
const genderInput = document.getElementById('genderInput');
const termsField = document.getElementById('termsField');
const termsInput = document.getElementById('termsInput');

const API = '../api';
const validators = {
  fullName: (value) => {
    if (!/^[A-Za-z][A-Za-z\s'-]{0,29}$/.test(value)) return false;
    return value.trim().split(/\s+/).every((part) => part.length <= 12);
  },
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^0\d{9}$/.test(value),
  username: (value) => /^[A-Za-z0-9]{1,10}$/.test(value),
  password: (value) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8}$/.test(value)
};
const phoneFormatMessage = 'Phone format: starts with 0 and has exactly 10 digits (example: 0771234567)';
const passwordFormatMessage = 'Password policy: exactly 8 characters, letters and numbers only';
let patientsCache = [];
let editingPatientId = null;

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

function showFormMessage(message, type = 'error') {
  patientFormMessage.innerHTML = message;
  patientFormMessage.classList.remove('hidden', 'success', 'error');
  patientFormMessage.classList.add(type);
}

function clearFormMessage() {
  patientFormMessage.innerHTML = '';
  patientFormMessage.classList.add('hidden');
  patientFormMessage.classList.remove('success', 'error');
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

const resetPatientModalPosition = enableModalDrag(patientModal);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

async function ensureAdmin() {
  const data = await apiFetch('/auth/session.php', { body: JSON.stringify({}) });
  if (!data.authenticated || data.user.role !== 'admin') {
    window.location.href = '../login/login.html';
    return false;
  }
  return true;
}

function openPatientModal() {
  clearNotice();
  clearFormMessage();
  resetPatientModalPosition();
  patientModalTitle.textContent = 'Add Patient';
  savePatientBtn.textContent = 'Register Patient';
  editingPatientId = null;
  patientIdInput.value = '';
  passwordLabel.textContent = 'Password *';
  confirmPasswordLabel.textContent = 'Confirm Password *';
  passwordInput.required = true;
  confirmPasswordInput.required = true;
  termsField.classList.remove('hidden');
  termsInput.required = true;
  passwordInput.placeholder = 'Ex: Nimal1234';
  confirmPasswordInput.placeholder = 'Re-enter password';
  patientModal.classList.remove('hidden');
  patientForm.reset();
  resetPasswordVisibility();
}

function closePatientModal() {
  patientModal.classList.add('hidden');
  patientForm.reset();
  resetPasswordVisibility();
  clearFormMessage();
  resetPatientModalPosition();
  editingPatientId = null;
}

function openEditPatientModal(patient) {
  clearNotice();
  clearFormMessage();
  resetPatientModalPosition();
  editingPatientId = Number(patient.id);
  patientModalTitle.textContent = 'Edit Patient';
  savePatientBtn.textContent = 'Update Patient';
  patientIdInput.value = String(patient.id);

  fullNameInput.value = patient.full_name || '';
  emailInput.value = patient.email || '';
  phoneInput.value = patient.phone || '';
  usernameInput.value = patient.username || '';
  genderInput.value = patient.gender || '';
  passwordInput.value = '';
  confirmPasswordInput.value = '';

  passwordLabel.textContent = 'Password (optional, only if changing login password)';
  confirmPasswordLabel.textContent = 'Confirm Password (required only if new password entered)';
  passwordInput.required = false;
  confirmPasswordInput.required = false;
  passwordInput.placeholder = 'Leave blank to keep current password';
  confirmPasswordInput.placeholder = 'Re-enter new password';
  termsInput.checked = false;
  termsInput.required = false;
  termsField.classList.add('hidden');
  resetPasswordVisibility();
  patientModal.classList.remove('hidden');
}

function renderPatients(patients) {
  patientsTbody.innerHTML = patients.map((patient) => `
    <tr>
      <td>${patient.id}</td>
      <td>${escapeHtml(patient.full_name)}</td>
      <td>${escapeHtml(patient.email)}</td>
      <td>${escapeHtml(patient.phone)}</td>
      <td>${escapeHtml(patient.username)}</td>
      <td>${escapeHtml(patient.gender)}</td>
      <td>${escapeHtml(patient.created_at)}</td>
      <td>
        <div class="actions">
          <button class="btn btn-muted" onclick="editPatient(${Number(patient.id)})">Edit</button>
          <button class="btn btn-danger" onclick="deletePatient(${Number(patient.id)})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function loadPatients() {
  const data = await apiFetch('/patients.php', { body: JSON.stringify({ action: 'list' }) });
  patientsCache = data.patients || [];
  renderPatients(patientsCache);
}

phoneInput.addEventListener('input', () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
});

usernameInput.addEventListener('input', () => {
  usernameInput.value = usernameInput.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 10);
});

window.deletePatient = async function deletePatient(id) {
  if (!confirm('Delete this patient? This will also remove related appointments.')) return;
  try {
    await apiFetch('/patients.php', {
      body: JSON.stringify({
        action: 'delete',
        id: Number(id)
      })
    });
    showNotice('Patient deleted successfully');
    await loadPatients();
  } catch (error) {
    showNotice(error.message, 'error');
  }
};

window.editPatient = function editPatient(id) {
  const patient = patientsCache.find((item) => Number(item.id) === Number(id));
  if (!patient) return;
  openEditPatientModal(patient);
};

patientForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    clearFormMessage();
    const errors = [];

    if (!validators.fullName(fullNameInput.value.trim())) {
      errors.push('Full name must use letters only, max 30 chars, with each name part up to 12 chars');
    }
    if (!validators.email(emailInput.value.trim())) {
      errors.push('Email format must be valid (example: name@example.com)');
    }
    if (phoneInput.value.trim() !== '' && !validators.phone(phoneInput.value.trim())) {
      errors.push(phoneFormatMessage);
    }
    if (!validators.username(usernameInput.value.trim())) {
      errors.push('Username must be alphanumeric and up to 10 characters');
    }
    if (!editingPatientId && !validators.password(passwordInput.value)) {
      errors.push(passwordFormatMessage);
    }
    if (editingPatientId && passwordInput.value !== '' && !validators.password(passwordInput.value)) {
      errors.push(passwordFormatMessage);
    }
    if (!editingPatientId && confirmPasswordInput.value !== passwordInput.value) {
      errors.push('Confirm password must match password');
    }
    if (editingPatientId && passwordInput.value !== '' && confirmPasswordInput.value !== passwordInput.value) {
      errors.push('Confirm password must match new password');
    }
    if (!editingPatientId && !termsInput.checked) {
      errors.push('You must agree to the terms and conditions');
    }

    if (errors.length > 0) {
      const uniqueErrors = [...new Set(errors)];
      throw new Error(`<strong>Please fix the following:</strong><br>${uniqueErrors.join('<br>')}`);
    }

    const payload = {
      action: editingPatientId ? 'update' : 'create',
      fullName: fullNameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      username: usernameInput.value.trim(),
      password: passwordInput.value,
      gender: genderInput.value
    };
    if (editingPatientId) {
      payload.id = editingPatientId;
    }

    await apiFetch('/patients.php', {
      body: JSON.stringify({
        ...payload
      })
    });

    showNotice(editingPatientId ? 'Patient updated successfully' : 'Patient registered successfully');
    closePatientModal();
    await loadPatients();
  } catch (error) {
    showFormMessage(error.message, 'error');
  }
});

addPatientBtn.addEventListener('click', openPatientModal);
closePatientModalBtn.addEventListener('click', closePatientModal);
cancelPatientBtn.addEventListener('click', closePatientModal);

patientModal.addEventListener('click', (event) => {
  if (event.target === patientModal) {
    closePatientModal();
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
    await loadPatients();
  } catch (error) {
    showNotice(error.message, 'error');
  }
})();
