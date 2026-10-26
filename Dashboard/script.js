import {
  requireAuth,
  watchGroceries,
  watchExpenses,
  getUserProfile,
  formatTaka,
  isCurrentMonth
} from "../firebase.js";

const user = await requireAuth();

if (user) {
  init(user);
}

function init(currentUser) {
  const welcomeTitle = document.getElementById("welcome-title");
  const todayLabel = document.getElementById("today-label");
  const avatarElement = document.getElementById("user-avatar");
  const themeButton = document.getElementById("theme-button");
  const themeIcon = themeButton.querySelector(".material-icons-sharp");

  const statGroceries = document.getElementById("stat-groceries");
  const statPending = document.getElementById("stat-pending");
  const statBudget = document.getElementById("stat-budget");
  const statSpent = document.getElementById("stat-spent");

  const pendingGroceries = document.getElementById("pending-groceries");
  const groceryEmpty = document.getElementById("grocery-empty");
  const recentExpenses = document.getElementById("recent-expenses");
  const expenseEmpty = document.getElementById("expense-empty");

  const budgetSpent = document.getElementById("budget-spent");
  const budgetRemaining = document.getElementById("budget-remaining");
  const budgetFill = document.getElementById("budget-fill");
  const budgetScale = document.getElementById("budget-scale");
  const topCategories = document.getElementById("top-categories");
  const categoryEmpty = document.getElementById("category-empty");

  const state = {
    groceries: [],
    expenses: [],
    profile: null
  };

  const CATEGORY_META = {
    food: { label: "Food", icon: "restaurant", className: "food-category" },
    grocery: { label: "Grocery", icon: "shopping_basket", className: "home-category" },
    bills: { label: "Bills", icon: "receipt_long", className: "bill-category" },
    others: { label: "Others", icon: "category", className: "other-category" }
  };

  /* ---------- Theme ---------- */

  function applyTheme(isDark) {
    document.body.classList.toggle("dark-theme", isDark);
    themeIcon.textContent = isDark ? "light_mode" : "dark_mode";
    themeButton.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    localStorage.setItem("hm-theme", isDark ? "dark" : "light");
  }

  applyTheme(localStorage.getItem("hm-theme") === "dark");

  themeButton.addEventListener("click", () => {
    applyTheme(!document.body.classList.contains("dark-theme"));
  });

  /* ---------- Greeting ---------- */

  function initials(name) {
    return String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";
  }

  function updateGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const name = state.profile?.name || currentUser.displayName || "";
    welcomeTitle.textContent = name ? `${greeting}, ${name.split(" ")[0]}` : greeting;
    todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    }).format(new Date());
    avatarElement.textContent = initials(name || currentUser.email || "");
  }

  /* ---------- Helpers ---------- */

  function formatDate(value) {
    if (!value) return "No date";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(date);
  }

  function sortNewestFirst(items) {
    return [...items].sort((a, b) => {
      const aSeconds = a.createdAt?.seconds || 0;
      const bSeconds = b.createdAt?.seconds || 0;
      if (aSeconds !== bSeconds) return bSeconds - aSeconds;
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
  }

  function normalizeCategory(value) {
    const category = String(value || "").trim().toLowerCase();
    return CATEGORY_META[category] ? category : "others";
  }

  function sum(items) {
    return items.reduce((total, item) => total + Number(item.amount || 0), 0);
  }

  /* ---------- Rendering ---------- */

  function renderSummary() {
    const pending = state.groceries.filter((item) => item.status === "pending");
    const monthExpenses = state.expenses.filter((item) => isCurrentMonth(item.date));
    const spent = sum(monthExpenses);
    const budget = Number(state.profile?.monthlyBudget) || 0;
    const remaining = budget - spent;
    const usedPercent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

    statGroceries.textContent = state.groceries.length;
    statPending.textContent = pending.length;
    statBudget.textContent = formatTaka(budget);
    statSpent.textContent = formatTaka(spent);

    budgetSpent.textContent = formatTaka(spent);
    budgetRemaining.textContent = `${formatTaka(remaining)} remaining`;
    budgetRemaining.style.color = remaining < 0 ? "#c0392b" : "";
    budgetFill.style.width = `${usedPercent}%`;
    budgetScale.textContent = formatTaka(budget);
  }

  function renderPendingGroceries() {
    pendingGroceries.innerHTML = "";
    const pending = state.groceries
      .filter((item) => item.status === "pending")
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
      .slice(0, 5);

    pending.forEach((item) => {
      const row = document.createElement("li");
      row.className = "item-row";

      const name = document.createElement("span");
      name.textContent = item.name;

      const detail = document.createElement("strong");
      detail.className = "match-missing";
      detail.textContent = Number(item.price) > 0 ? formatTaka(item.price) : formatDate(item.date);

      row.append(name, detail);
      pendingGroceries.appendChild(row);
    });

    groceryEmpty.hidden = pending.length > 0;
  }

  function renderRecentExpenses() {
    recentExpenses.innerHTML = "";
    const recent = sortNewestFirst(state.expenses).slice(0, 5);

    recent.forEach((expense) => {
      const row = document.createElement("li");
      row.className = "item-row";

      const title = document.createElement("span");
      title.textContent = expense.title || `${CATEGORY_META[normalizeCategory(expense.category)].label} expense`;

      const amount = document.createElement("strong");
      amount.className = "due-later";
      amount.textContent = formatTaka(expense.amount);

      row.append(title, amount);
      recentExpenses.appendChild(row);
    });

    expenseEmpty.hidden = recent.length > 0;
  }

  function renderCategories() {
    topCategories.innerHTML = "";

    const monthExpenses = state.expenses.filter((item) => isCurrentMonth(item.date));
    const totals = { food: 0, grocery: 0, bills: 0, others: 0 };

    monthExpenses.forEach((expense) => {
      totals[normalizeCategory(expense.category)] += Number(expense.amount) || 0;
    });

    const grandTotal = Object.values(totals).reduce((sumValue, value) => sumValue + value, 0);
    const entries = Object.entries(totals)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    entries.forEach(([key, value]) => {
      const meta = CATEGORY_META[key];
      const percent = grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0;

      const row = document.createElement("div");
      row.className = "category-row";

      const icon = document.createElement("span");
      icon.className = `category-icon ${meta.className}`;
      icon.innerHTML = `<span class="material-icons-sharp">${meta.icon}</span>`;

      const name = document.createElement("span");
      name.className = "category-name";
      name.textContent = meta.label;

      const amount = document.createElement("strong");
      amount.textContent = formatTaka(value);

      const percentage = document.createElement("span");
      percentage.className = "category-percent";
      percentage.textContent = `${percent}%`;

      row.append(icon, name, amount, percentage);
      topCategories.appendChild(row);
    });

    categoryEmpty.hidden = entries.length > 0;
  }

  async function loadRecipeIdeas() {
    const recipeIdea = document.getElementById("recipe-idea");
    if (!recipeIdea) return;

    try {
      const response = await fetch("https://themealdb.com/api/json/v1/1/search.php?s=chicken");
      if (!response.ok) throw new Error("Failed to load recipes");
      const data = await response.json();
      const recipes = data.meals || [];
      if (!recipes.length) {
        recipeIdea.innerHTML = '<div class="recipe-idea__empty">No recipe ideas available right now.</div>';
        return;
      }

      const firstThree = recipes.slice(0, 3);
      recipeIdea.innerHTML = firstThree.map((recipe) => `
        <a class="recipe-idea__card" href="../Recipe_finder/index.html" title="Open recipe finder">
          <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
          <div class="recipe-idea__meta">
            <span>Popular pick</span>
            <strong>${recipe.strMeal}</strong>
          </div>
        </a>
      `).join("");
    } catch (error) {
      recipeIdea.innerHTML = '<div class="recipe-idea__empty">Recipe ideas are unavailable right now.</div>';
    }
  }

  function renderAll() {
    renderSummary();
    renderPendingGroceries();
    renderRecentExpenses();
    renderCategories();
  }

  /* ---------- Live data ---------- */

  watchGroceries(
    (items) => {
      state.groceries = items;
      renderAll();
    },
    (error) => {
      console.error(error);
      groceryEmpty.hidden = false;
      groceryEmpty.textContent = "Could not load groceries. Check your Firestore rules.";
    }
  );

  watchExpenses(
    (items) => {
      state.expenses = items;
      renderAll();
    },
    (error) => {
      console.error(error);
      expenseEmpty.hidden = false;
      expenseEmpty.textContent = "Could not load expenses. Check your Firestore rules.";
    }
  );

  getUserProfile()
    .then((profile) => {
      state.profile = profile;
      updateGreeting();
      renderSummary();
    })
    .catch((error) => {
      console.error(error);
      updateGreeting();
    });

  updateGreeting();
  renderAll();
  loadRecipeIdeas();
}
