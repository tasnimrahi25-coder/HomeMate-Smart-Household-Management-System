import {
  loginUser,
  registerUser,
  redirectIfLoggedIn,
  sendPasswordReset,
  authErrorMessage
} from "../firebase.js";

// A signed-in visitor never needs to see the login form again.
redirectIfLoggedIn();

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");

function setMessage(element, text, type = "") {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message${type ? ` is-${type}` : ""}`;
}

function setLoading(button, loading, loadingText) {
  if (!button) return;
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = loading;
  button.textContent = loading ? loadingText : button.dataset.label;
}

function showTab(mode) {
  const isLogin = mode === "login";
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  tabLogin.setAttribute("aria-selected", String(isLogin));
  tabRegister.setAttribute("aria-selected", String(!isLogin));
  setMessage(loginMessage, "");
  setMessage(registerMessage, "");

  const firstField = isLogin ? document.getElementById("loginEmail") : document.getElementById("regName");
  firstField?.focus({ preventScroll: true });
}

tabLogin?.addEventListener("click", () => showTab("login"));
tabRegister?.addEventListener("click", () => showTab("register"));

document.querySelectorAll("[data-switch]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showTab(link.dataset.switch);
  });
});

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    button.textContent = show ? "🙈" : "👁";
  });
});

function nextDestination() {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next) return "../dashboard/index.html";

  try {
    const url = new URL(next);
    if (url.origin === window.location.origin && !url.pathname.includes("login-register")) {
      return url.href;
    }
  } catch {
    // Ignore malformed values and fall back to the dashboard.
  }

  return "../dashboard/index.html";
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPass").value;
  const remember = document.getElementById("loginRemember").checked;

  if (!email || !password) {
    setMessage(loginMessage, "Please enter your email and password.", "error");
    return;
  }

  setMessage(loginMessage, "");
  setLoading(loginButton, true, "Signing in…");

  try {
    await loginUser({ email, password, remember });
    window.location.replace(nextDestination());
  } catch (error) {
    setMessage(loginMessage, authErrorMessage(error), "error");
    setLoading(loginButton, false);
  }
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPass").value;
  const confirm = document.getElementById("regConfirm").value;

  if (!name || !email || !password) {
    setMessage(registerMessage, "Please fill in your name, email and password.", "error");
    return;
  }

  if (password.length < 6) {
    setMessage(registerMessage, "Password must be at least 6 characters long.", "error");
    return;
  }

  if (password !== confirm) {
    setMessage(registerMessage, "The two passwords do not match.", "error");
    return;
  }

  setMessage(registerMessage, "");
  setLoading(registerButton, true, "Creating account…");

  try {
    await registerUser({ name, email, password });
    window.location.replace(nextDestination());
  } catch (error) {
    setMessage(registerMessage, authErrorMessage(error), "error");
    setLoading(registerButton, false);
  }
});

document.getElementById("forgotPassword")?.addEventListener("click", async (event) => {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();

  if (!email) {
    setMessage(loginMessage, "Enter your email address first, then click “Forgot password?”.", "error");
    document.getElementById("loginEmail").focus();
    return;
  }

  try {
    await sendPasswordReset(email);
    setMessage(loginMessage, "Password reset email sent. Check your inbox.", "success");
  } catch (error) {
    setMessage(loginMessage, authErrorMessage(error), "error");
  }
});
