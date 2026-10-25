import {
  requireAuth,
  watchExpenses,
  addExpense,
  deleteExpense,
  formatTaka,
  todayISO,
  isCurrentMonth
} from "../firebase.js";

const user = await requireAuth();

if (user) {
  init();
}

function init() {
  const modal = document.getElementById("expenseModal");
  const openButton = document.getElementById("openExpenseModal");
  const form = document.getElementById("expenseForm");
  const categorySelect = document.getElementById("expenseCategory");
  const amountInput = document.getElementById("expenseAmount");
  const noteInput = document.getElementById("expenseNote");
  const dateInput = document.getElementById("expenseDate");
  const saveButton = document.getElementById("saveExpenseButton");
  const messageElement = document.getElementById("expenseMessage");
  const totalElement = document.getElementById("totalAmount");
  const donutTotal = document.getElementById("donutTotal");
  const donutChart = document.getElementById("donutChart");
  const expenseCount = document.getElementById("expenseCount");
  const currentMonthBar = document.getElementById("currentMonthBar");
  const recentExpenses = document.getElementById("recentExpenses");
  const recentEmpty = document.getElementById("recentEmpty");
  const categoryEmpty = document.getElementById("categoryEmpty");
  const searchInput = document.getElementById("searchInput");
  const toast = document.getElementById("toast");

  const CATEGORY_META = {
    food: { label: "Food", color: "#ef4444" },
    grocery: { label: "Grocery", color: "#22c55e" },
    bills: { label: "Bills", color: "#06b6d4" },
    others: { label: "Others", color: "#a855f7" }
  };

  const state = {
    expenses: []
  };

  dateInput.value = todayISO();

  let toastTimer;

  function showToast(text) {
    toast.textContent = text;
    toast.style.display = "block";
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.style.display = "none";
    }, 2800);
  }

  function setMessage(text, type = "") {
    messageElement.textContent = text;
    messageElement.className = `form-message${type ? ` is-${type}` : ""}`;
  }

  function openModal() {
    setMessage("");
    dateInput.value = todayISO();
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    amountInput.focus();
  }

  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
    form.reset();
    dateInput.value = todayISO();
    setMessage("");
  }

  function normalizeCategory(value) {
    const category = String(value || "").trim().toLowerCase();
    return CATEGORY_META[category] ? category : "others";
  }

  function formatDate(value) {
    if (!value) return "No date";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(date);
  }

  function updateUI() {
    const totals = { food: 0, grocery: 0, bills: 0, others: 0 };
    let total = 0;
    let monthTotal = 0;

    state.expenses.forEach((expense) => {
      const amount = Number(expense.amount) || 0;
      const category = normalizeCategory(expense.category);
      totals[category] += amount;
      total += amount;
      if (isCurrentMonth(expense.date)) monthTotal += amount;
    });

    totalElement.textContent = formatTaka(total);
    donutTotal.textContent = formatTaka(total);
    expenseCount.textContent = state.expenses.length
      ? `${state.expenses.length} expense${state.expenses.length === 1 ? "" : "s"} recorded`
      : "No expenses recorded yet";

    Object.keys(CATEGORY_META).forEach((key) => {
      const valueElement = document.querySelector(`.val-${key}`);
      const percentageElement = valueElement?.closest(".cat-value")?.querySelector(".percentage");
      const value = totals[key];
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

      if (valueElement) valueElement.textContent = value.toLocaleString(undefined, { maximumFractionDigits: 0 });
      if (percentageElement) percentageElement.textContent = `(${percentage}%)`;
    });

    if (total > 0) {
      let start = 0;
      const stops = Object.entries(CATEGORY_META).map(([key, meta]) => {
        const share = (totals[key] / total) * 100;
        const stop = `${meta.color} ${start}% ${start + share}%`;
        start += share;
        return stop;
      });
      donutChart.style.background = `conic-gradient(${stops.join(", ")})`;
    } else {
      donutChart.style.background = "#e2e8f0";
    }

    currentMonthBar.style.height = monthTotal > 0 ? "85%" : "0%";

    categoryEmpty.hidden = total > 0;
    renderRecent();
  }

  function sortNewestFirst(items) {
    return [...items].sort((a, b) => {
      const aSeconds = a.createdAt?.seconds || 0;
      const bSeconds = b.createdAt?.seconds || 0;
      if (aSeconds !== bSeconds) return bSeconds - aSeconds;
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
  }

  function renderRecent() {
    recentExpenses.innerHTML = "";

    const recent = sortNewestFirst(state.expenses).slice(0, 6);
    recent.forEach((expense) => {
      const row = document.createElement("div");
      row.className = "expense-row";

      const info = document.createElement("div");
      info.className = "expense-info";

      const title = document.createElement("span");
      title.className = "expense-title";
      title.textContent = expense.title || `${normalizeCategory(expense.category)} expense`;

      const meta = document.createElement("span");
      meta.className = "expense-meta";
      meta.textContent = `${CATEGORY_META[normalizeCategory(expense.category)].label} · ${formatDate(expense.date)}`;

      info.append(title, meta);

      const side = document.createElement("div");
      side.className = "expense-side";

      const amount = document.createElement("span");
      amount.className = "expense-amount";
      amount.textContent = formatTaka(expense.amount);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "expense-delete";
      remove.dataset.delete = expense.id;
      remove.setAttribute("aria-label", `Delete ${title.textContent}`);
      remove.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';

      side.append(amount, remove);
      row.append(info, side);
      recentExpenses.appendChild(row);
    });

    recentEmpty.hidden = recent.length > 0;
  }

  watchExpenses(
    (items) => {
      state.expenses = items;
      updateUI();
    },
    (error) => {
      console.error(error);
      showToast("Could not load expenses. Check your Firestore rules.");
    }
  );

  openButton.addEventListener("click", openModal);

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display === "flex") closeModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const category = categorySelect.value;
    const amount = Number(amountInput.value);
    const note = noteInput.value.trim();
    const date = dateInput.value || todayISO();

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter an amount greater than zero.", "error");
      amountInput.focus();
      return;
    }

    saveButton.disabled = true;
    setMessage("");

    try {
      await addExpense({
        title: note || `${category} expense`,
        category,
        amount,
        date,
        source: "expense-tracker"
      });
      closeModal();
      showToast(`${category} expense saved — dashboard and budget updated.`);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Could not save the expense.", "error");
    } finally {
      saveButton.disabled = false;
    }
  });

  recentExpenses.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;

    button.disabled = true;
    try {
      await deleteExpense(button.dataset.delete);
      showToast("Expense deleted — totals updated everywhere.");
    } catch (error) {
      console.error(error);
      button.disabled = false;
      showToast("Could not delete the expense. Please try again.");
    }
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    document.querySelectorAll(".category-item").forEach((item) => {
      const matches = item.dataset.name.includes(query);
      item.hidden = !matches;
    });
    categoryEmpty.hidden = query.length > 0 || state.expenses.length > 0;
  });
}
