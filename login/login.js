const form = document.getElementById('loginForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

function togglePassword() {
  const passwordField = document.getElementById('password');
  const openEye = document.querySelector('.eye-icon.open');
  const closedEye = document.querySelector('.eye-icon.closed');
  
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    openEye.style.display = 'none';
    closedEye.style.display = 'block';
  } else {
    passwordField.type = 'password';
    openEye.style.display = 'block';
    closedEye.style.display = 'none';
  }
}

window.togglePassword = togglePassword;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';

  document.querySelectorAll('.form-group').forEach(group => {
    group.classList.remove('error-active');
  });

  const identifier = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  let isValid = true;

  if (!identifier) {
    document.getElementById('username').parentElement.classList.add('error-active');
    isValid = false;
  }
  if (!password) {
    document.getElementById('password').parentElement.classList.add('error-active');
    isValid = false;
  }
  if (!isValid) return;

  try {
    const response = await fetch('../api/auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.message || 'Invalid username or password');
    }

    successMessage.style.display = 'block';

    setTimeout(() => {
      if (data.user.role === 'doctor') {
        window.location.href = '../dashboard/doctor.html';
      } else if (data.user.role === 'admin') {
        window.location.href = '../dashboard/admin.html';
      } else {
        window.location.href = '../home/home.html';
      }
    }, 700);
  } catch (error) {
    showError(error.message);
  }
});

document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    form.dispatchEvent(new Event('submit'));
  }
});

// Forgot Password
const forgotPasswordLink = document.querySelector('.forgot-password');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    openForgotPasswordModal();
  });
}

function openForgotPasswordModal() {
  forgotPasswordModal.classList.add('show');
}

function closeForgotPasswordModal() {
  forgotPasswordModal.classList.remove('show');
}

window.closeForgotPasswordModal = closeForgotPasswordModal;

// Close modal when clicking outside the modal content
forgotPasswordModal.addEventListener('click', (e) => {
  if (e.target === forgotPasswordModal) {
    closeForgotPasswordModal();
  }
});
