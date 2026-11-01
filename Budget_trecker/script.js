import {
  requireAuth,
  watchExpenses,
  watchIncome,
  addExpense,
  addIncome,
  deleteExpense,
  deleteIncome,
  getUserProfile,
  updateUserProfile,
  formatTaka,
  todayISO,
  isCurrentMonth
} from "../firebase.js";

const user = await requireAuth();

if (user) {
  init();
}

function init() {
  const transactionForm = document.getElementById("transactionForm");
  const descriptionInput = document.getElementById("description");
  const amountInput = document.getElementById("amount");
  const typeSelect = document.getElementById("type");
  const categorySelect = document.getElementById("category");
  const dateInput = document.getElementById("transactionDate");
  const addButton = document.getElementById("addTransactionButton");
  const transactionMessage = document.getElementById("transactionMessage");
  const transactionList = document.getElementById("transactionList");
  const transactionEmpty = document.getElementById("transactionEmpty");
  const balanceElement = document.getElementById("balance");
  const incomeTotalElement = document.getElementById("incomeTotal");
  const expenseTotalElement = document.getElementById("expenseTotal");
  const budgetRemainingElement = document.getElementById("budgetRemaining");
  const budgetForm = document.getElementById("budgetForm");
  const monthlyBudgetInput = document.getElementById("monthlyBudget");
  const budgetMessage = document.getElementById("budgetMessage");
  const donutChart = document.getElementById("donutChart");
  const donutTotal = document.getElementById("donutTotal");
  const categoryEmpty = document.getElementById("categoryEmpty");

  const CATEGORY_META = {
    food: { color: "#ef4444" },
    grocery: { color: "#22c55e" },
    bills: { color: "#06b6d4" },
    others: { color: "#a855f7" }
  };

  const state = {
    expenses: [],
    income: [],
    monthlyBudget: 0
  };

  dateInput.value = todayISO();
  syncCategoryState();

  function setMessage(element, text, type = "") {
    element.textContent = text;
    element.className = `form-message${type ? ` is-${type}` : ""}`;
  }

  function syncCategoryState() {
    const isIncome = typeSelect.value === "income";
    categorySelect.disabled = isIncome;
    categorySelect.setAttribute("aria-disabled", String(isIncome));
  }

  typeSelect.addEventListener("change", syncCategoryState);

  function sortNewestFirst(items) {
    return [...items].sort((a, b) => {
      const aSeconds = a.createdAt?.seconds || 0;
      const bSeconds = b.createdAt?.seconds || 0;
      if (aSeconds !== bSeconds) return bSeconds - aSeconds;
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
  }

  function formatDate(value) {
    if (!value) return "No date";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function totalOf(items) {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  function updateSummary() {
    const income = totalOf(state.income);
    const expenses = totalOf(state.expenses);
    const balance = income - expenses;
    const spentThisMonth = totalOf(state.expenses.filter((item) => isCurrentMonth(item.date)));
    const remainingBudget = state.monthlyBudget - spentThisMonth;

    incomeTotalElement.textContent = formatTaka(income);
    expenseTotalElement.textContent = formatTaka(expenses);
    balanceElement.textContent = formatTaka(balance);
    budgetRemainingElement.textContent = formatTaka(remainingBudget);
    budgetRemainingElement.style.color = remainingBudget < 0 ? "#c0392b" : "";
    updateExpenseBreakdown();
  }

  function updateExpenseBreakdown() {
    const totals = { food: 0, grocery: 0, bills: 0, others: 0 };
    const total = totalOf(state.expenses);

    state.expenses.forEach((expense) => {
      const category = String(expense.category || "").trim().toLowerCase();
      const key = Object.prototype.hasOwnProperty.call(totals, category) ? category : "others";
      totals[key] += Number(expense.amount) || 0;
    });

    document.querySelectorAll("[data-category]").forEach((item) => {
      const category = item.dataset.category;
      const amount = totals[category];
      const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
      item.querySelector(".category-total").textContent = amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
      item.querySelector(".percentage").textContent = `(${percentage}%)`;
    });

    donutTotal.textContent = formatTaka(total);
    if (total > 0) {
      let start = 0;
      const stops = Object.entries(CATEGORY_META).map(([category, meta]) => {
        const share = (totals[category] / total) * 100;
        const stop = `${meta.color} ${start}% ${start + share}%`;
        start += share;
        return stop;
      });
      donutChart.style.background = `conic-gradient(${stops.join(", ")})`;
    } else {
      donutChart.style.background = "#e2e8f0";
    }

    categoryEmpty.hidden = total > 0;
  }

  function createTransactionCard(transaction) {
    const card = document.createElement("div");
    card.className = `transaction-card ${transaction.kind}`;

    const main = document.createElement("div");
    main.className = "card-main";

    const description = document.createElement("span");
    description.className = "card-desc";
    description.textContent = transaction.title;

    const meta = document.createElement("span");
    meta.className = "card-meta";
    meta.textContent = `${transaction.kind === "income" ? "Income" : transaction.category || "Expense"} · ${formatDate(transaction.date)}`;

    main.append(description, meta);

    const right = document.createElement("div");
    right.className = "card-right";

    const amount = document.createElement("span");
    amount.className = "card-amount";
    amount.textContent = `${transaction.kind === "income" ? "+" : "−"}${formatTaka(transaction.amount)}`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-btn";
    remove.dataset.id = transaction.id;
    remove.dataset.kind = transaction.kind;
    remove.textContent = "Delete";

    right.append(amount, remove);
    card.append(main, right);
    return card;
  }

  function renderTransactions() {
    const combined = [
      ...state.income.map((item) => ({ ...item, kind: "income", title: item.title })),
      ...state.expenses.map((item) => ({ ...item, kind: "expense", title: item.title }))
    ];

    transactionList.innerHTML = "";
    sortNewestFirst(combined).forEach((transaction) => {
      transactionList.appendChild(createTransactionCard(transaction));
    });

    transactionEmpty.hidden = combined.length > 0;
    updateSummary();
  }

  async function loadProfile() {
    try {
      const profile = await getUserProfile();
      if (!profile) return;
      state.monthlyBudget = Number(profile.monthlyBudget) || 0;
      monthlyBudgetInput.value = state.monthlyBudget || "";
      updateSummary();
    } catch (error) {
      console.error(error);
      setMessage(budgetMessage, "Could not load your monthly budget.", "error");
    }
  }

  watchExpenses(
    (items) => {
      state.expenses = items;
      renderTransactions();
    },
    (error) => {
      console.error(error);
      setMessage(transactionMessage, "Could not load expenses. Check your Firestore rules.", "error");
    }
  );

  watchIncome(
    (items) => {
      state.income = items;
      renderTransactions();
    },
    (error) => {
      console.error(error);
      setMessage(transactionMessage, "Could not load income entries. Check your Firestore rules.", "error");
    }
  );

  loadProfile();

  transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeSelect.value;
    const date = dateInput.value || todayISO();

    if (!description) {
      setMessage(transactionMessage, "Please add a short description.", "error");
      descriptionInput.focus();
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage(transactionMessage, "Enter an amount greater than zero.", "error");
      amountInput.focus();
      return;
    }

    addButton.disabled = true;
    setMessage(transactionMessage, "");

    try {
      if (type === "income") {
        await addIncome({ title: description, amount, date });
        setMessage(transactionMessage, `Income of ${formatTaka(amount)} added.`, "success");
      } else {
        await addExpense({
          title: description,
          category: categorySelect.value,
          amount,
          date,
          source: "budget-tracker"
        });
        setMessage(transactionMessage, `Expense of ${formatTaka(amount)} added to ${categorySelect.value}.`, "success");
      }

      transactionForm.reset();
      typeSelect.value = "income";
      dateInput.value = todayISO();
      syncCategoryState();
      descriptionInput.focus();
    } catch (error) {
      console.error(error);
      setMessage(transactionMessage, error.message || "Could not save the transaction.", "error");
    } finally {
      addButton.disabled = false;
    }
  });

  budgetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const value = Number(monthlyBudgetInput.value);
    if (!Number.isFinite(value) || value < 0) {
      setMessage(budgetMessage, "Enter a valid monthly budget.", "error");
      return;
    }

    try {
      await updateUserProfile({ monthlyBudget: value });
      state.monthlyBudget = value;
      updateSummary();
      setMessage(budgetMessage, "Monthly budget saved to your dashboard.", "success");
    } catch (error) {
      console.error(error);
      setMessage(budgetMessage, "Could not save the budget. Please try again.", "error");
    }
  });

  transactionList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) return;

    button.disabled = true;
    try {
      if (button.dataset.kind === "income") {
        await deleteIncome(button.dataset.id);
      } else {
        await deleteExpense(button.dataset.id);
      }
      setMessage(transactionMessage, "Transaction deleted.", "success");
    } catch (error) {
      console.error(error);
      button.disabled = false;
      setMessage(transactionMessage, "Could not delete the transaction.", "error");
    }
  });
}
