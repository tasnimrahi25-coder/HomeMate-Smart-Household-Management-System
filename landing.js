import { watchAuth, routes } from "./firebase.js";

const primary = document.querySelector("[data-landing-primary]");
const secondary = document.querySelector("[data-landing-secondary]");
const status = document.querySelector("[data-landing-status]");

watchAuth((user) => {
  if (!user) {
    if (primary) {
      primary.textContent = "Create your account";
      primary.href = routes.login;
    }
    if (secondary) {
      secondary.textContent = "Explore the dashboard";
      secondary.href = routes.dashboard;
    }
    if (status) status.textContent = "Free household account";
    return;
  }

  const name = user.displayName || user.email?.split("@")[0] || "your account";
  if (primary) {
    primary.textContent = "Open your dashboard";
    primary.href = routes.dashboard;
  }
  if (secondary) {
    secondary.textContent = "Review expenses";
    secondary.href = routes.expenses;
  }
  if (status) status.textContent = `Signed in as ${name}`;
});
