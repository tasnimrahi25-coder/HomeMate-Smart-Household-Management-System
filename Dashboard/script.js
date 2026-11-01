import {
  requireAuth,
  watchGroceries,
  watchExpenses,
  watchBills,
  watchMaintenance,
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
  const notificationButton = document.getElementById("notification-button");
  const notificationPanel = document.getElementById("notification-panel");
  const notificationList = document.getElementById("notification-list");
  const notificationDot = document.getElementById("notification-dot");
  const markNotificationsReadButton = document.getElementById("notification-mark-read");
  const budgetDonut = document.getElementById("budget-donut");
  const lowStockList = document.getElementById("low-stock-list");
  const groceryEmpty = document.getElementById("grocery-empty");
  const billList = document.getElementById("dashboard-bills");
  const billEmpty = document.getElementById("bill-empty");
  const recipeIdea = document.getElementById("recipe-idea");

  const state = {
    groceries: [],
    expenses: [],
    bills: [],
    appliances: [],
    profile: null,
    recipes: [],
    readNotifications: new Set(JSON.parse(localStorage.getItem("hm-read-notifications") || "[]"))
  };

  function applyTheme(isDark) {
    document.body.classList.toggle("dark-theme", isDark);
    themeIcon.textContent = isDark ? "light_mode" : "more_horiz";
    themeButton.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    localStorage.setItem("hm-theme", isDark ? "dark" : "light");
  }

  applyTheme(localStorage.getItem("hm-theme") === "dark");
  themeButton.addEventListener("click", () => {
    applyTheme(!document.body.classList.contains("dark-theme"));
  });

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
    welcomeTitle.textContent = name ? `${greeting}, ${name}` : greeting;
    todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date());
    avatarElement.textContent = initials(name || currentUser.email || "");
  }

  function formatDate(value) {
    if (!value) return "Date not set";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function daysUntil(value) {
    if (!value) return null;
    const target = new Date(`${value}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  }

  function sum(items) {
    return items.reduce((total, item) => total + (Number(item.amount) || 0), 0);
  }

  function currentMonthKey() {
    const now = new Date();
    return `${currentUser.uid}:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function getBudgetSummary() {
    const monthExpenses = state.expenses.filter((item) => isCurrentMonth(item.date));
    const monthBills = state.bills.filter((bill) => isCurrentMonth(bill.paidAt || bill.due));
    const spent = sum(monthExpenses);
    const budget = Number(state.profile?.monthlyBudget) || 0;
    const paid = sum(monthBills.filter((bill) => bill.paid === true));
    const unpaid = sum(monthBills.filter((bill) => bill.paid !== true));
    const forecast = spent + unpaid;
    const percentage = budget > 0 ? (forecast / budget) * 100 : 0;
    const status = budget > 0 && percentage >= 100
      ? "exceeded"
      : budget > 0 && percentage >= 80
        ? "warning"
        : "normal";

    return { spent, budget, paid, unpaid, forecast, percentage, status, remaining: budget - forecast };
  }

  function getNotifications() {
    const notifications = [];

    const budget = getBudgetSummary();
    if (budget.status === "warning") {
      notifications.push({
        key: `budget:${currentMonthKey()}:warning`,
        title: "You're close to your monthly budget",
        detail: `${Math.floor(budget.percentage)}% used · ${formatTaka(budget.remaining)} left`,
        icon: "account_balance_wallet",
        kind: "is-warning",
        href: "../Budget_trecker/index.html"
      });
    } else if (budget.status === "exceeded") {
      const reachedLimit = budget.remaining >= -Number.EPSILON;
      notifications.push({
        key: `budget:${currentMonthKey()}:exceeded`,
        title: reachedLimit ? "You've reached your monthly budget" : "You've exceeded your monthly budget",
        detail: `${formatTaka(budget.forecast)} of ${formatTaka(budget.budget)}${reachedLimit ? "" : ` · ${formatTaka(Math.abs(budget.remaining))} over limit`}`,
        icon: "account_balance_wallet",
        kind: "is-danger",
        href: "../Budget_trecker/index.html"
      });
    }

    state.bills
      .filter((bill) => bill.paid !== true)
      .forEach((bill) => {
        const days = daysUntil(bill.due);
        if (days === null || days > 7) return;

        const overdue = days < 0;
        const name = bill.name || "Household bill";
        notifications.push({
          key: `bill:${bill.id}:${bill.due}`,
          title: overdue ? `${name} is overdue` : days === 0 ? `${name} is due today` : `${name} is due soon`,
          detail: `${formatTaka(bill.amount)} · ${overdue ? `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue` : days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`}`,
          icon: "receipt_long",
          kind: overdue ? "is-warning" : "",
          href: "../Maintainance/index.html#bills"
        });
      });

    state.appliances
      .forEach((appliance) => {
        const days = daysUntil(appliance.nextService);
        if (days === null || days > 7) return;

        const name = appliance.item || "Appliance service";
        const overdue = days < 0;
        notifications.push({
          key: `service:${appliance.id}:${appliance.nextService}`,
          title: overdue ? `${name} service is overdue` : days === 0 ? `${name} service is due today` : `${name} service is coming up`,
          detail: overdue ? `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue` : days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`,
          icon: "build",
          kind: overdue ? "is-warning" : "",
          href: "../Maintainance/index.html#appliances"
        });
      });

    return notifications.sort((a, b) => {
      const readOrder = Number(state.readNotifications.has(a.key)) - Number(state.readNotifications.has(b.key));
      return readOrder || a.title.localeCompare(b.title);
    });
  }

  function renderNotifications() {
    const notifications = getNotifications();
    const unreadCount = notifications.filter((notification) => !state.readNotifications.has(notification.key)).length;
    notificationDot.hidden = unreadCount === 0;
    notificationButton.setAttribute(
      "aria-label",
      unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"
    );
    markNotificationsReadButton.disabled = unreadCount === 0;
    notificationList.replaceChildren();

    if (!notifications.length) {
      const empty = document.createElement("p");
      empty.className = "notification-empty";
      empty.textContent = "You're all caught up. No bills or services are due this week.";
      notificationList.appendChild(empty);
      return;
    }

    notifications.forEach((notification) => {
      const link = document.createElement("a");
      link.className = `notification-item${notification.kind ? ` ${notification.kind}` : ""}${state.readNotifications.has(notification.key) ? " is-read" : ""}`;
      link.href = notification.href;

      const icon = document.createElement("span");
      icon.className = "material-icons-sharp notification-item__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = notification.icon;

      const content = document.createElement("span");
      content.className = "notification-item__content";
      const title = document.createElement("strong");
      title.textContent = notification.title;
      const detail = document.createElement("span");
      detail.textContent = notification.detail;
      content.append(title, detail);

      const status = document.createElement("span");
      status.className = "notification-item__status";
      status.setAttribute("aria-label", state.readNotifications.has(notification.key) ? "Read" : "Unread");

      link.append(icon, content, status);
      link.addEventListener("click", () => {
        state.readNotifications.add(notification.key);
        localStorage.setItem("hm-read-notifications", JSON.stringify([...state.readNotifications]));
      });
      notificationList.appendChild(link);
    });
  }

  function setNotificationPanelOpen(isOpen) {
    notificationPanel.hidden = !isOpen;
    notificationButton.setAttribute("aria-expanded", String(isOpen));
  }

  notificationButton.addEventListener("click", () => {
    setNotificationPanelOpen(notificationPanel.hidden);
  });

  markNotificationsReadButton.addEventListener("click", () => {
    getNotifications().forEach((notification) => state.readNotifications.add(notification.key));
    localStorage.setItem("hm-read-notifications", JSON.stringify([...state.readNotifications]));
    renderNotifications();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".notification-menu")) setNotificationPanelOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !notificationPanel.hidden) {
      setNotificationPanelOpen(false);
      notificationButton.focus();
    }
  });

  function renderStatusChips() {
    const unpaid = state.bills.filter((bill) => bill.paid !== true);
    const dueThisWeek = unpaid.filter((bill) => {
      const days = daysUntil(bill.due);
      return days !== null && days >= 0 && days <= 7;
    }).length;
    const overdue = unpaid.filter((bill) => {
      const days = daysUntil(bill.due);
      return days !== null && days < 0;
    }).length;
    document.getElementById("status-bills-text").textContent = overdue
      ? `${overdue} overdue · ${dueThisWeek} due this week`
      : `${dueThisWeek} bill${dueThisWeek === 1 ? "" : "s"} due this week`;

    document.getElementById("status-recipes-text").textContent = state.recipes.length
      ? `${state.recipes.length} recipes ready to cook`
      : "Recipe ideas for today";

    const nextService = [...state.appliances]
      .filter((item) => daysUntil(item.nextService) !== null)
      .sort((a, b) => String(a.nextService).localeCompare(String(b.nextService)))[0];
    const serviceText = document.getElementById("status-service-text");
    if (!nextService) {
      serviceText.textContent = "No service scheduled";
      return;
    }

    const days = daysUntil(nextService.nextService);
    serviceText.textContent = days < 0
      ? `${nextService.item || "Service"} overdue`
      : `${nextService.item || "Service"} in ${days} day${days === 1 ? "" : "s"}`;
  }

  function renderBudget() {
    const { spent, budget, paid, unpaid, forecast, percentage, status, remaining } = getBudgetSummary();
    const otherSpent = Math.max(0, spent - paid);
    const available = remaining;
    const total = budget > 0 ? budget : Math.max(forecast, 1);
    const paidShare = (paid / total) * 100;
    const unpaidShare = (unpaid / total) * 100;
    const otherShare = (otherSpent / total) * 100;
    const usedShare = paidShare + unpaidShare + otherShare;
    const scale = usedShare > 100 ? 100 / usedShare : 1;
    const paidStop = paidShare * scale;
    const unpaidStop = paidStop + unpaidShare * scale;
    const spentStop = Math.min(100, unpaidStop + otherShare * scale);

    document.getElementById("budget-month").textContent = new Intl.DateTimeFormat(undefined, {
      month: "long"
    }).format(new Date()) + " budget";
    document.getElementById("budget-free").textContent = formatTaka(available);
    document.getElementById("budget-limit").textContent = formatTaka(budget);
    document.getElementById("budget-paid").textContent = formatTaka(paid);
    document.getElementById("budget-unpaid").textContent = formatTaka(unpaid);
    const budgetNote = document.getElementById("budget-note-text");
    const budgetPanel = document.querySelector(".budget-panel");
    budgetPanel.classList.toggle("is-warning", status === "warning");
    budgetPanel.classList.toggle("is-exceeded", status === "exceeded");
    budgetNote.textContent = budget <= 0
      ? "Set a monthly budget to see how much is left."
      : status === "exceeded"
        ? `${formatTaka(forecast)} planned this month — ${formatTaka(Math.abs(remaining))} over your limit.`
        : status === "warning"
          ? `${Math.floor(percentage)}% of your budget is planned. ${formatTaka(remaining)} left.`
          : `${formatTaka(spent)} spent this month${unpaid > 0 ? ` · ${formatTaka(unpaid)} in unpaid bills` : ""}.`;
    budgetDonut.setAttribute("aria-label", `${formatTaka(available)} available from a ${formatTaka(budget)} budget`);
    budgetDonut.style.background = status === "exceeded"
      ? "conic-gradient(#cf4b4b 0% 100%)"
      : `conic-gradient(#22a447 0% ${paidStop}%, #f5ad18 ${paidStop}% ${unpaidStop}%, #f39222 ${unpaidStop}% ${spentStop}%, #e8ebee ${spentStop}% 100%)`;
    renderNotifications();
  }

  function renderBills() {
    billList.replaceChildren();
    const sorted = [...state.bills].sort((a, b) => {
      if ((a.paid === true) !== (b.paid === true)) return a.paid === true ? 1 : -1;
      return String(a.due || "").localeCompare(String(b.due || ""));
    }).slice(0, 4);

    sorted.forEach((bill) => {
      const row = document.createElement("article");
      row.className = `dashboard-bill${bill.paid === true ? " is-paid" : ""}`;

      const info = document.createElement("div");
      info.className = "dashboard-bill__info";
      const name = document.createElement("strong");
      name.textContent = bill.name || "Household bill";
      const due = document.createElement("span");
      if (bill.paid === true) {
        due.textContent = "Paid";
      } else {
        const days = daysUntil(bill.due);
        due.textContent = days === null ? "Due date not set" : days < 0 ? "Overdue" : days === 0 ? "Due today" : `In ${days} day${days === 1 ? "" : "s"}`;
      }
      info.append(name, due);

      const amount = document.createElement("strong");
      amount.className = "dashboard-bill__amount";
      amount.textContent = formatTaka(bill.amount);

      if (bill.paid === true) {
        const paidIcon = document.createElement("span");
        paidIcon.className = "material-icons-sharp dashboard-bill__check";
        paidIcon.setAttribute("aria-label", "Paid");
        paidIcon.textContent = "check_circle";
        row.append(info, amount, paidIcon);
      } else {
        const payLink = document.createElement("a");
        payLink.className = "bill-pay-button";
        payLink.href = "../Maintainance/index.html#bills";
        payLink.textContent = "Pay";
        row.append(info, amount, payLink);
      }
      billList.appendChild(row);
    });

    billEmpty.hidden = state.bills.length > 0;
    if (!state.bills.length) billEmpty.textContent = "No household bills yet. Add one from Bills.";
    renderBudget();
    renderStatusChips();
    renderNotifications();
  }

  function renderGroceries() {
    lowStockList.replaceChildren();
    const pending = state.groceries
      .filter((item) => item.status === "pending")
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
      .slice(0, 3);

    pending.forEach((item) => {
      const row = document.createElement("li");
      const info = document.createElement("div");
      info.className = "low-stock-item";
      const name = document.createElement("strong");
      name.textContent = item.name;
      const note = document.createElement("span");
      note.textContent = "On your shopping list";
      info.append(name, note);

      const link = document.createElement("a");
      link.href = "../grocery%20list/index.html";
      link.className = "stock-add-button";
      link.setAttribute("aria-label", `Open grocery list for ${item.name}`);
      link.innerHTML = '<span class="material-icons-sharp" aria-hidden="true">add</span>';
      row.append(info, link);
      lowStockList.appendChild(row);
    });

    groceryEmpty.hidden = pending.length > 0;
    renderStatusChips();
  }

  function renderService() {
    const nextService = [...state.appliances]
      .filter((item) => daysUntil(item.nextService) !== null)
      .sort((a, b) => String(a.nextService).localeCompare(String(b.nextService)))[0];
    const daysValue = document.getElementById("service-days");
    const daysLabel = document.getElementById("service-days-label");
    const appliance = document.getElementById("service-appliance");
    const date = document.getElementById("service-date");

    if (!nextService) {
      daysValue.textContent = "—";
      daysLabel.textContent = "days left";
      appliance.textContent = "No service scheduled";
      date.textContent = "Add a reminder";
    } else {
      const days = daysUntil(nextService.nextService);
      daysValue.textContent = String(Math.max(0, days));
      daysLabel.textContent = days < 0 ? "days overdue" : "days left";
      appliance.textContent = nextService.item || "Appliance service";
      date.textContent = formatDate(nextService.nextService);
    }
    renderStatusChips();
    renderNotifications();
  }

  function renderAll() {
    renderBudget();
    renderBills();
    renderGroceries();
    renderService();
  }

  async function loadRecipeIdeas() {
    try {
      const response = await fetch("https://themealdb.com/api/json/v1/1/search.php?s=chicken");
      if (!response.ok) throw new Error("Failed to load recipes");
      const data = await response.json();
      state.recipes = (data.meals || []).slice(0, 3);

      recipeIdea.replaceChildren();
      if (!state.recipes.length) {
        const empty = document.createElement("span");
        empty.className = "cook-recipe__empty";
        empty.textContent = "No recipe ideas available right now.";
        recipeIdea.appendChild(empty);
      } else {
        const recipe = state.recipes[0];
        const icon = document.createElement("span");
        icon.className = "material-icons-sharp cook-recipe__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "soup_kitchen";
        const info = document.createElement("div");
        info.className = "cook-recipe__text";
        const title = document.createElement("strong");
        title.textContent = recipe.strMeal;
        const description = document.createElement("span");
        description.textContent = "A fresh idea for your household";
        info.append(title, description);
        recipeIdea.append(icon, info);
      }
      renderStatusChips();
    } catch (error) {
      console.error(error);
      recipeIdea.replaceChildren();
      const message = document.createElement("span");
      message.className = "cook-recipe__empty";
      message.textContent = "Recipe ideas are unavailable right now.";
      recipeIdea.appendChild(message);
      document.getElementById("status-recipes-text").textContent = "Browse recipes";
    }
  }

  watchGroceries(
    (items) => {
      state.groceries = items;
      renderGroceries();
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
      renderBudget();
      renderNotifications();
    },
    (error) => {
      console.error(error);
      document.getElementById("budget-note-text").textContent = "Could not load spending totals.";
    }
  );

  watchBills(
    (items) => {
      state.bills = items;
      renderBills();
    },
    (error) => {
      console.error(error);
      billEmpty.hidden = false;
      billEmpty.textContent = "Could not load bills. Check your Firestore rules.";
    }
  );

  watchMaintenance(
    (items) => {
      state.appliances = items;
      renderService();
    },
    (error) => {
      console.error(error);
      document.getElementById("service-date").textContent = "Could not load service dates";
    }
  );

  getUserProfile()
    .then((profile) => {
      state.profile = profile;
      updateGreeting();
      renderBudget();
      renderNotifications();
    })
    .catch((error) => {
      console.error(error);
      updateGreeting();
    });

  updateGreeting();
  renderAll();
  loadRecipeIdeas();
}
