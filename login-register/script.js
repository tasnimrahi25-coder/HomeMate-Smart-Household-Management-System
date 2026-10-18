function show(mode) {
  document.getElementById('loginForm').classList.toggle('hidden', mode !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', mode !== 'register');
  document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
  document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
}

function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

function handleSubmit(mode) {
  if (mode === 'register') {
    const password = document.getElementById('regPass');
    const confirmation = document.getElementById('confirmPass');
    confirmation.setCustomValidity(password.value === confirmation.value ? '' : 'Passwords do not match.');
    if (!confirmation.reportValidity()) return false;
    return false;
  }

  window.location.href = '../Dashboard/index.html';
  return false;
}
