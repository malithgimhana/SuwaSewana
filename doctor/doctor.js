const API = '../api';

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

async function apiFetch(path, body) {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function buildDoctorCard(doctor) {
  const fullName = doctor.full_name || 'Doctor';
  const specialty = String(doctor.specialty || doctor.department || '').trim() || 'General Medicine';
  const years = Number(doctor.experience_years || 0);
  const profileBio = String(doctor.profile_bio || '').trim();
  const bio = profileBio !== '' ? profileBio : `Experienced ${specialty} consultant dedicated to quality patient care at SuwaSewana.`;

  return `
    <div class="doctor-card">
      <div class="doctor-img-wrapper">
        <img src="${escapeHtml(toAssetUrl(doctor.photo_path))}" alt="${escapeHtml(fullName)}" />
      </div>
      <h3>${escapeHtml(fullName)}</h3>
      <span class="specialty">${escapeHtml(specialty)}</span>
      <p class="bio">${escapeHtml(bio)}</p>
      <div class="doctor-meta">
        <span><i class="icon">&#128100;</i> ${years > 0 ? `${years}+ Years Experience` : 'Verified Specialist'}</span>
        <span><i class="icon">&#127973;</i> ${escapeHtml(specialty)} Dept.</span>
      </div>
      <a href="../appointment/appointment.html" class="btn-book">Book Appointment</a>
    </div>
  `;
}

async function loadDoctorsGrid() {
  const grid = document.getElementById('doctorsGrid');
  if (!grid) return;

  try {
    const data = await apiFetch('/doctors.php', { action: 'list' });
    const doctors = data.doctors || [];
    if (doctors.length === 0) {
      grid.innerHTML = '<p>No doctors available at the moment.</p>';
      return;
    }

    grid.innerHTML = doctors.map(buildDoctorCard).join('');
  } catch (error) {
    console.error('Failed to load doctors:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadDoctorsGrid);
