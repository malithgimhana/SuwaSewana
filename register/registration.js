const form = document.getElementById('registrationForm');
const successMessage = document.getElementById('successMessage');

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

initPasswordToggles();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  document.querySelectorAll('.form-group').forEach(group => group.classList.remove('error-active'));
  document.getElementById('termsError').style.display = 'none';

  const fullName = document.getElementById('fullName');
  const email = document.getElementById('email');
  const phone = document.getElementById('phone');
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  const gender = document.getElementById('gender');
  const terms = document.getElementById('terms');

  let isValid = true;
  if (!validators.fullName(fullName.value.trim())) {
    fullName.parentElement.classList.add('error-active');
    isValid = false;
  }
  if (!validators.email(email.value.trim())) {
    email.parentElement.classList.add('error-active');
    isValid = false;
  }
  if (phone.value.trim() !== '' && !validators.phone(phone.value.trim())) {
    phone.parentElement.classList.add('error-active');
    isValid = false;
  }
  if (!validators.username(username.value.trim())) {
    username.parentElement.classList.add('error-active');
    isValid = false;
  }
  if (!validators.password(password.value)) {
    password.parentElement.classList.add('error-active');
    isValid = false;
  }
  if (confirmPassword.value !== password.value) {
    confirmPassword.parentElement.classList.add('error-active');
    isValid = false;
  }
  if (!terms.checked) {
    document.getElementById('termsError').style.display = 'block';
    isValid = false;
  }
  if (!isValid) return;

  try {
    const response = await fetch('../api/auth/register_patient.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: fullName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        username: username.value.trim(),
        password: password.value,
        gender: gender.value
      })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.message || 'Registration failed');
    }

    successMessage.style.display = 'block';
    setTimeout(() => {
      window.location.href = '../home/home.html';
    }, 800);
  } catch (error) {
    alert(error.message);
  }
});
