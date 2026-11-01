document.body.innerHTML = `
  <div class="layout">

    <aside class="sidebar">
      <div class="brand">
        🏠 <span>HomeMate</span>
      </div>

      <nav>
        ${PAGES.map(([id, icon, label]) => `
          <a href="${id}.html"
             class="${id === active ? "active" : ""}">
            ${icon} <span>${label}</span>
          </a>
        `).join("")}
      </nav>

      <button class="logout" id="logoutBtn" type="button">
        ⎋ <span>Logout</span>
      </button>
    </aside>

    <div class="main">

      <header class="topbar">
        <input
          type="search"
          placeholder="Search anything..."
          aria-label="Search anything"
        >

        <div class="spacer"></div>

        <span aria-label="Notifications">🔔</span>

        <div class="avatar" title="${safeName}">
          ${initial}
        </div>
      </header>

      <main class="content">
        <div class="page-head">
          <div>
            <h1>${safeTitle}</h1>
            ${subtitle ? `<small>${safeSubtitle}</small>` : ""}
          </div>

          <div id="headActions"></div>
        </div>

        <div id="page"></div>
      </main>

    </div>
  </div>
`;

const logoutButton = document.getElementById("logoutBtn");

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    await Api.logout();
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout failed:", error);
    alert("Logout failed. Please try again.");
    logoutButton.disabled = false;
  }
});

return user;