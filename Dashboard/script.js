const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menu-button");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const themeButton = document.getElementById("theme-button");
const groceryForm = document.getElementById("grocery-form");
const groceryInput = document.getElementById("grocery-input");
const groceryList = document.getElementById("grocery-list");

const choreItems = Array.from(document.querySelectorAll(".chore-item"));
const choreProgress = document.getElementById("chores-progress");
const choreCount = document.getElementById("chores-completed");
const choreSummary = document.getElementById("progress-label");
const chorePercent = document.getElementById("progress-percent");
const choreFoot = document.getElementById("chores-foot");

function updateGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    document.querySelector(".welcome-row h1").firstChild.textContent = `${greeting}`;
    document.getElementById("today-label").textContent = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    }).format(new Date());
}

function updateChoreProgress() {
    const completed = choreItems.filter((item) => item.querySelector("input").checked).length;
    const total = choreItems.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    choreCount.textContent = completed;
    choreSummary.textContent = `${completed} of ${total} completed`;
    chorePercent.textContent = `${percent}%`;
    choreProgress.style.width = `${percent}%`;
    choreFoot.textContent = completed === total ? "Everything is done. Nice work!" : "A good start today";

    choreItems.forEach((item) => {
        const checkbox = item.querySelector("input");
        const tag = item.querySelector(".chore-tag");
        item.classList.toggle("done", checkbox.checked);
        if (checkbox.checked) {
            tag.textContent = "Done";
            tag.className = "chore-tag tag-green";
        } else {
            tag.textContent = tag.dataset.duration;
            tag.className = `chore-tag ${tag.dataset.tag}`;
        }
    });
}

function updateGroceryCount() {
    const count = groceryList.children.length;
    document.getElementById("grocery-total").textContent = count;
    document.getElementById("grocery-badge-count").textContent = count;
    document.getElementById("grocery-nav-count").textContent = count;
}

function createGroceryItem(name) {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const checkmark = document.createElement("span");
    const text = document.createElement("span");
    const removeButton = document.createElement("button");
    const removeIcon = document.createElement("span");

    checkbox.type = "checkbox";
    checkmark.className = "custom-check";
    text.textContent = name;
    removeButton.className = "remove-item";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Remove ${name}`);
    removeIcon.className = "material-icons-sharp";
    removeIcon.textContent = "close";

    label.append(checkbox, checkmark, text);
    removeButton.append(removeIcon);
    item.append(label, removeButton);
    groceryList.append(item);
}

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("visible");
    menuButton.setAttribute("aria-expanded", "false");
}

updateGreeting();
updateChoreProgress();
updateGroceryCount();

choreItems.forEach((item) => {
    item.querySelector("input").addEventListener("change", updateChoreProgress);
});

groceryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = groceryInput.value.trim();
    if (!name) return;
    createGroceryItem(name);
    groceryInput.value = "";
    updateGroceryCount();
    groceryInput.focus();
});

groceryList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-item");
    if (!removeButton) return;
    removeButton.closest("li").remove();
    updateGroceryCount();
});

menuButton.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    sidebarBackdrop.classList.toggle("visible", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
});

sidebarBackdrop.addEventListener("click", closeSidebar);

sidebar.querySelectorAll(".nav-link[href^='#']").forEach((link) => {
    link.addEventListener("click", () => {
        sidebar.querySelectorAll(".nav-link").forEach((navLink) => navLink.classList.remove("active"));
        link.classList.add("active");
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