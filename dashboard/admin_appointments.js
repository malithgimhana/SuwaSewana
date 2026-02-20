const noticeEl = document.getElementById('notice');
const appointmentsTbody = document.getElementById('appointmentsTbody');
const filterDateInput = document.getElementById('filterDateInput');
const clearDateFilterBtn = document.getElementById('clearDateFilterBtn');
const addAppointmentBtn = document.getElementById('addAppointmentBtn');
const appointmentModal = document.getElementById('appointmentModal');
const closeAppointmentModalBtn = document.getElementById('closeAppointmentModal');
const cancelAppointmentBtn = document.getElementById('cancelAppointmentBtn');
const appointmentForm = document.getElementById('appointmentForm');
const appointmentFormMessage = document.getElementById('appointmentFormMessage');

const patientSearchInput = document.getElementById('patientSearchInput');
const patientNameList = document.getElementById('patientNameList');
const patientIdInput = document.getElementById('patientIdInput');
const doctorSelect = document.getElementById('doctorSelect');
const dateInput = document.getElementById('dateInput');
const scheduleSelect = document.getElementById('scheduleSelect');
const departmentInput = document.getElementById('departmentInput');
const notesInput = document.getElementById('notesInput');

const API = '../api';
let patientsCache = [];

function showNotice(message, type = 'success') {
  noticeEl.innerHTML = `<p class="notice ${type}">${message}</p>`;
}

function clearNotice() {
  noticeEl.innerHTML = '';
}

function showFormMessage(message, type = 'error') {
  appointmentFormMessage.textContent = message;
  appointmentFormMessage.classList.remove('hidden', 'success', 'error');
  appointmentFormMessage.classList.add(type);
}

function clearFormMessage() {
  appointmentFormMessage.textContent = '';
  appointmentFormMessage.classList.add('hidden');
  appointmentFormMessage.classList.remove('success', 'error');
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

const resetAppointmentModalPosition = enableModalDrag(appointmentModal);

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

function renderAppointments(appointments) {
  appointmentsTbody.innerHTML = appointments.map((appointment) => {
    const status = String(appointment.status || '').toLowerCase();
    const statusClass = `status-${status}`;
    return `
      <tr>
        <td>${appointment.id}</td>
        <td>${escapeHtml(appointment.patient_name)}</td>
        <td>${escapeHtml(appointment.doctor_name)}</td>
        <td>${escapeHtml(appointment.appointment_date)}</td>
        <td>${escapeHtml(appointment.start_time)} - ${escapeHtml(appointment.end_time)}</td>
        <td>${escapeHtml(appointment.department)}</td>
        <td>${escapeHtml(appointment.notes)}</td>
        <td><span class="status-pill ${statusClass}">${escapeHtml(appointment.status)}</span></td>
      </tr>
    `;
  }).join('');
}

async function loadAppointments() {
  const payload = { action: 'list' };
  if (filterDateInput.value) {
    payload.appointment_date = filterDateInput.value;
  }

  const data = await apiFetch('/appointments.php', { body: JSON.stringify(payload) });
  renderAppointments(data.appointments || []);
}

async function loadDoctorsAndPatients() {
  const [doctorData, patientData] = await Promise.all([
    apiFetch('/doctors.php', { body: JSON.stringify({ action: 'list' }) }),
    apiFetch('/patients.php', { body: JSON.stringify({ action: 'list' }) })
  ]);

  const doctors = doctorData.doctors || [];
  patientsCache = patientData.patients || [];

  doctorSelect.innerHTML = '<option value="">Select doctor</option>' + doctors
    .map((doctor) => {
      const label = doctor.full_name || [doctor.first_name, doctor.last_name].filter(Boolean).join(' ').trim();
      return `<option value="${doctor.id}">${escapeHtml(label)}${doctor.specialty ? ` (${escapeHtml(doctor.specialty)})` : ''}</option>`;
    })
    .join('');

  patientNameList.innerHTML = patientsCache
    .map((patient) => `<option value="${escapeHtml(patient.full_name)} (${escapeHtml(patient.username)})"></option>`)
    .join('');
}

function resolvePatientIdFromInput() {
  const query = patientSearchInput.value.trim().toLowerCase();
  if (!query) {
    patientIdInput.value = '';
    return;
  }

  const exact = patientsCache.find((patient) =>
    `${patient.full_name} (${patient.username})`.toLowerCase() === query
  );
  if (exact) {
    patientIdInput.value = String(exact.id);
    return;
  }

  const exactName = patientsCache.filter((patient) => String(patient.full_name).toLowerCase() === query);
  if (exactName.length === 1) {
    patientIdInput.value = String(exactName[0].id);
    return;
  }

  patientIdInput.value = '';
}

async function loadAvailableSlots() {
  const doctorId = Number(doctorSelect.value || 0);
  const date = dateInput.value;

  if (!doctorId || !date) {
    scheduleSelect.innerHTML = '<option value="">Select available time</option>';
    return;
  }

  const data = await apiFetch('/schedules.php', {
    body: JSON.stringify({
      action: 'list_available',
      doctor_id: doctorId,
      date
    })
  });

  const options = (data.schedules || [])
    .map((slot) => `<option value="${slot.id}">${escapeHtml(slot.start_time)} - ${escapeHtml(slot.end_time)}</option>`)
    .join('');

  scheduleSelect.innerHTML = `<option value="">Select available time</option>${options}`;
}

function openModal() {
  clearNotice();
  clearFormMessage();
  resetAppointmentModalPosition();
  appointmentModal.classList.remove('hidden');
}

function closeModal() {
  appointmentModal.classList.add('hidden');
  appointmentForm.reset();
  clearFormMessage();
  resetAppointmentModalPosition();
  patientIdInput.value = '';
  scheduleSelect.innerHTML = '<option value="">Select available time</option>';
}

appointmentForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    action: 'create',
    patient_id: Number(patientIdInput.value),
    doctor_id: Number(doctorSelect.value),
    schedule_id: Number(scheduleSelect.value),
    department: departmentInput.value.trim(),
    notes: notesInput.value.trim()
  };

  try {
    if (!payload.patient_id) {
      throw new Error('Please type and select a patient from the name suggestions');
    }
    clearFormMessage();
    await apiFetch('/appointments.php', { body: JSON.stringify(payload) });
    showNotice('Appointment created successfully');
    closeModal();
    await loadAppointments();
  } catch (error) {
    showFormMessage(error.message, 'error');
  }
});

addAppointmentBtn.addEventListener('click', openModal);
closeAppointmentModalBtn.addEventListener('click', closeModal);
cancelAppointmentBtn.addEventListener('click', closeModal);

appointmentModal.addEventListener('click', (event) => {
  if (event.target === appointmentModal) {
    closeModal();
  }
});

doctorSelect.addEventListener('change', loadAvailableSlots);
dateInput.addEventListener('change', loadAvailableSlots);
patientSearchInput.addEventListener('input', resolvePatientIdFromInput);
patientSearchInput.addEventListener('change', resolvePatientIdFromInput);
filterDateInput.addEventListener('change', loadAppointments);

clearDateFilterBtn.addEventListener('click', async () => {
  filterDateInput.value = '';
  await loadAppointments();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await apiFetch('/auth/logout.php', { method: 'POST' });
  window.location.href = '../home/home.html';
});

(async function init() {
  try {
    if (!await ensureAdmin()) return;
    await loadDoctorsAndPatients();
    await loadAppointments();
  } catch (error) {
    showNotice(error.message, 'error');
  }
})();
