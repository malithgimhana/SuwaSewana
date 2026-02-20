const noticeEl = document.getElementById('notice');
const doctorsCountEl = document.getElementById('doctorsCount');
const patientsCountEl = document.getElementById('patientsCount');
const appointmentsCountEl = document.getElementById('appointmentsCount');

const API = '../api';
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let appointmentsChart;

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

async function ensureAdmin() {
  const data = await apiFetch('/auth/session.php', { body: JSON.stringify({}) });
  if (!data.authenticated || data.user.role !== 'admin') {
    window.location.href = '../login/login.html';
    return false;
  }
  return true;
}

function renderChart(appointments) {
  const counts = Array(7).fill(0);

  appointments.forEach((appointment) => {
    const dateText = String(appointment.appointment_date || '').trim();
    if (!dateText || String(appointment.status || '').toLowerCase() === 'cancelled') {
      return;
    }

    // Parse YYYY-MM-DD safely in local time to avoid timezone shifts.
    const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return;

    counts[date.getDay()] += 1;
  });

  const ctx = document.getElementById('appointmentsChart');
  if (appointmentsChart) {
    appointmentsChart.destroy();
  }

  appointmentsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DAY_LABELS,
      datasets: [{
        label: 'Appointments',
        data: counts,
        backgroundColor: ['#6aa8ff', '#67d7f5', '#57e2bf', '#86df6f', '#ffcd56', '#ff9a59', '#ff7381'],
        borderColor: '#ffffff',
        borderWidth: 1.2,
        borderRadius: 8
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

async function loadDashboardData() {
  const [doctorData, patientData, appointmentData] = await Promise.all([
    apiFetch('/doctors.php', { body: JSON.stringify({ action: 'list' }) }),
    apiFetch('/patients.php', { body: JSON.stringify({ action: 'list' }) }),
    apiFetch('/appointments.php', { body: JSON.stringify({ action: 'list' }) })
  ]);

  const doctors = doctorData.doctors || [];
  const patients = patientData.patients || [];
  const appointments = appointmentData.appointments || [];

  renderChart(appointments);

  doctorsCountEl.textContent = String(doctors.length);
  patientsCountEl.textContent = String(patients.length);
  appointmentsCountEl.textContent = String(appointments.length);
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await apiFetch('/auth/logout.php', { method: 'POST' });
  window.location.href = '../home/home.html';
});

(async function init() {
  try {
    if (!await ensureAdmin()) return;
    await loadDashboardData();
  } catch (error) {
    showNotice(error.message, 'error');
  }
})();
