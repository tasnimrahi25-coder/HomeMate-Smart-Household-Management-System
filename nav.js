/* ============================================================
   HomeMate — shared navigation behaviour
   - mobile menu
   - active page highlight
   - signed-in user chip + logout
   ============================================================ */

import { watchAuth, logoutUser, routes } from "./firebase.js";

const nav = document.querySelector("[data-hm-nav]");

function initials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "U";
}

if (nav) {
  const toggle = nav.querySelector("[data-nav-toggle]");
  const links = nav.querySelector("[data-nav-links]");
  const account = nav.querySelector("[data-nav-user]");
  const authLink = nav.querySelector("[data-nav-auth]");
  const logoutButton = nav.querySelector("[data-nav-logout]");
  const avatar = nav.querySelector("[data-nav-avatar]");
  const nameLabel = nav.querySelector("[data-nav-name]");
  const page = document.body.dataset.page || "";

  // Highlight the current module.
  nav.querySelectorAll("[data-nav]").forEach((link) => {
    if (page && link.dataset.nav === page) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  // On the login page, the "Sign in" shortcut is redundant.
  if (page === "login" && authLink) {
    authLink.hidden = true;
  }

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    links.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target)) {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  watchAuth((user) => {
    if (!user) {
      if (account) account.hidden = true;
      if (logoutButton) logoutButton.hidden = true;
      if (authLink && page !== "login") authLink.hidden = false;
      return;
    }

    const name = user.displayName || user.email?.split("@")[0] || "Account";
    if (account) account.hidden = false;
    if (logoutButton) logoutButton.hidden = false;
    if (authLink) authLink.hidden = true;
    if (nameLabel) nameLabel.textContent = name;
    if (avatar) avatar.textContent = initials(name);
  });

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = "Signing out…";
      try {
        await logoutUser();
      } finally {
        window.location.href = routes.login;
      }
    });
  }
}
