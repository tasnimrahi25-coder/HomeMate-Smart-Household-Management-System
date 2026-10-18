const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menu-button");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const themeButton = document.getElementById("theme-button");
const addStockButton = document.getElementById("add-stock-button");
const stockFeedback = document.getElementById("stock-feedback");

function updateGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    document.querySelector(".welcome-row h1").textContent = `${greeting}, Rahman family`;
    document.getElementById("today-label").textContent = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    }).format(new Date());
}

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("visible");
    menuButton.setAttribute("aria-expanded", "false");
}

updateGreeting();

addStockButton.addEventListener("click", () => {
    const lowStockItems = [...document.querySelectorAll("#stock-list .item-row span:first-child")]
        .map((item) => item.textContent.trim());
    const addedCount = window.HomeMateData.addGroceries(lowStockItems);
    document.querySelectorAll("#stock-list .item-row").forEach((row) => {
        row.classList.add("on-list");
    });
    stockFeedback.textContent = addedCount
        ? `${addedCount} low-stock item${addedCount === 1 ? "" : "s"} added to your grocery list.`
        : "All low-stock items are already on your grocery list.";
});

menuButton.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    sidebarBackdrop.classList.toggle("visible", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
});

sidebarBackdrop.addEventListener("click", closeSidebar);

sidebar.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        if (link.hash) {
            sidebar.querySelectorAll(".nav-link").forEach((navLink) => {
                navLink.classList.remove("active");
                navLink.removeAttribute("aria-current");
            });
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }
        closeSidebar();
    });
});

themeButton.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-theme");
    themeButton.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    themeButton.querySelector(".material-icons-sharp").textContent = isDark ? "light_mode" : "dark_mode";
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeSidebar();
});
