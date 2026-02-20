const API = '../api';

const appointmentForm = document.getElementById('appointmentForm');
const fullNameInput = document.getElementById('fullNameInput');
const emailInput = document.getElementById('emailInput');
const phoneInput = document.getElementById('phoneInput');
const departmentSelect = document.getElementById('departmentSelect');
const appointmentDate = document.getElementById('appointmentDate');
const doctorSelect = document.getElementById('doctorSelect');
const timeSelect = document.getElementById('timeSelect');
const notesInput = document.getElementById('notesInput');
const validators = {
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^0\d{9}$/.test(value)
};

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

async function loadSessionUser() {
  const data = await apiFetch('/auth/session.php', { body: JSON.stringify({}) });
  if (!data.authenticated) {
    return null;
  }
  return data.user;
}

async function loadDoctors() {
  const data = await apiFetch('/doctors.php', { body: JSON.stringify({ action: 'list' }) });
  const doctors = data.doctors || [];
  doctorSelect.innerHTML = '<option value="" disabled selected>Select Doctor</option>' +
    doctors.map(d => `<option value="${d.id}">${d.full_name}${d.department ? ` (${d.department})` : ''}</option>`).join('');
}

async function loadSlots() {
  const doctorId = doctorSelect.value;
  const date = appointmentDate.value;
  if (!doctorId || !date) {
    if (!doctorId) {
      timeSelect.innerHTML = '<option value="" disabled selected>Select Available Time</option>';
      return;
    }
  }

  const data = await apiFetch('/schedules.php', {
    body: JSON.stringify({
      action: 'list_available',
      doctor_id: Number(doctorId),
      date: date || ''
    })
  });
  const slots = data.schedules || [];
  timeSelect.innerHTML = '<option value="" disabled selected>Select Available Time</option>' +
    slots.map(s => `<option value="${s.id}" data-date="${s.date}">${s.date} | ${s.start_time} - ${s.end_time}</option>`).join('');
}

appointmentDate.addEventListener('change', loadSlots);
doctorSelect.addEventListener('change', loadSlots);

timeSelect.addEventListener('change', () => {
  const selected = timeSelect.options[timeSelect.selectedIndex];
  const slotDate = selected?.getAttribute('data-date');
  if (slotDate) {
    appointmentDate.value = slotDate;
  }
});

appointmentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const user = await loadSessionUser();
    if (!user || user.role !== 'patient') {
      alert('Please login as a patient to book appointments.');
      window.location.href = '../login/login.html';
      return;
    }

    if (!validators.email(emailInput.value.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    if (phoneInput.value.trim() !== '' && !validators.phone(phoneInput.value.trim())) {
      alert('Phone number must start with 0 and contain exactly 10 digits.');
      return;
    }

    if (!doctorSelect.value || !timeSelect.value) {
      alert('Please select doctor and available time.');
      return;
    }

    await apiFetch('/appointments.php', {
      body: JSON.stringify({
        action: 'create',
        doctor_id: Number(doctorSelect.value),
        schedule_id: Number(timeSelect.value),
        department: departmentSelect.value,
        notes: notesInput.value.trim()
      })
    });

    alert('Appointment booked successfully.');
    appointmentForm.reset();
    fullNameInput.value = user.name || '';
    timeSelect.innerHTML = '<option value="" disabled selected>Select Available Time</option>';
  } catch (error) {
    alert(error.message);
  }
});

(async function init() {
  try {
    const user = await loadSessionUser();
    if (user && user.role === 'patient') {
      fullNameInput.value = user.name || '';
    } else {
      fullNameInput.value = '';
    }
    await loadDoctors();
  } catch (error) {
    console.error(error);
  }
})();
