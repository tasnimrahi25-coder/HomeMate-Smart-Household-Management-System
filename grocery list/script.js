import {
  requireAuth,
  watchGroceries,
  addGrocery,
  updateGrocery,
  deleteGrocery,
  addExpense,
  deleteExpense,
  formatTaka,
  todayISO
} from "../firebase.js";

const user = await requireAuth();

if (user) {
  init(user);
}

function init(currentUser) {
  const form = document.getElementById("groceryForm");
  const nameInput = document.getElementById("groceryName");
  const priceInput = document.getElementById("groceryPrice");
  const dateInput = document.getElementById("groceryDate");
  const addButton = document.getElementById("addGroceryButton");
  const searchInput = document.getElementById("search-input");
  const listElement = document.getElementById("groceryList");
  const emptyElement = document.getElementById("groceryEmpty");
  const messageElement = document.getElementById("groceryMessage");
  const totalElement = document.getElementById("total-count");
  const purchasedElement = document.getElementById("purchased-count");
  const remainingElement = document.getElementById("remaining-count");
  const avatarElement = document.getElementById("user-avatar");

  const state = {
    items: [],
    search: ""
  };

  dateInput.value = todayISO();

  const displayName = currentUser.displayName || currentUser.email?.split("@")[0] || "U";
  avatarElement.textContent = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "U";

  function setMessage(text, type = "") {
    messageElement.textContent = text;
    messageElement.className = `form-message${type ? ` is-${type}` : ""}`;
  }

  function formatDate(value) {
    if (!value) return "No date";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(date);
  }

  function sortItems(items) {
    return [...items].sort((a, b) => {
      if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
      return String(a.date || "").localeCompare(String(b.date || ""));
    });
  }

  function updateStats() {
    const total = state.items.length;
    const purchased = state.items.filter((item) => item.status === "purchased").length;
    totalElement.textContent = total;
    purchasedElement.textContent = purchased;
    remainingElement.textContent = total - purchased;
  }

  function createRow(item) {
    const row = document.createElement("div");
    row.className = `grocery-row${item.status === "purchased" ? " is-purchased" : ""}`;

    const left = document.createElement("div");
    left.className = "row-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "item-checkbox";
    checkbox.dataset.id = item.id;
    checkbox.checked = item.status === "purchased";
    checkbox.setAttribute("aria-label", `Mark ${item.name} as ${checkbox.checked ? "pending" : "purchased"}`);

    const text = document.createElement("div");
    text.className = "item-text";

    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = item.name;

    const meta = document.createElement("span");
    meta.className = "item-meta";
    meta.textContent = Number(item.price) > 0 ? formatTaka(item.price) : "No price recorded";

    text.append(name, meta);
    left.append(checkbox, text);

    const status = document.createElement("span");
    const isPurchased = item.status === "purchased";
    status.className = `status ${isPurchased ? "purchased" : "pending"}`;
    status.textContent = isPurchased ? "Purchased" : "Pending";

    const date = document.createElement("span");
    date.className = "date";
    date.textContent = formatDate(item.date);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-btn";
    remove.dataset.delete = item.id;
    remove.setAttribute("aria-label", `Delete ${item.name}`);
    remove.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';

    row.append(left, status, date, remove);
    return row;
  }

  function render() {
    const term = state.search.trim().toLowerCase();
    const visible = state.items.filter((item) => item.name.toLowerCase().includes(term));

    listElement.innerHTML = "";
    visible.forEach((item) => listElement.appendChild(createRow(item)));

    if (state.items.length === 0) {
      emptyElement.hidden = false;
      emptyElement.textContent = "Your list is empty. Add the first item above, or let a recipe send ingredients here.";
    } else if (visible.length === 0) {
      emptyElement.hidden = false;
      emptyElement.textContent = `No items match “${state.search}”.`;
    } else {
      emptyElement.hidden = true;
    }

    updateStats();
  }

  watchGroceries(
    (items) => {
      state.items = sortItems(items);
      render();
    },
    (error) => {
      console.error(error);
      setMessage("Could not load groceries. Check your Firestore rules and connection.", "error");
    }
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const price = priceInput.value;
    const date = dateInput.value || todayISO();

    if (!name) {
      setMessage("Please enter an item name.", "error");
      nameInput.focus();
      return;
    }

    addButton.disabled = true;
    setMessage("");

    try {
      await addGrocery({ name, price: Number(price) || 0, date });
      form.reset();
      dateInput.value = todayISO();
      nameInput.focus();
      setMessage(`“${name}” was added to your list.`, "success");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Could not add the item.", "error");
    } finally {
      addButton.disabled = false;
    }
  });

  searchInput.addEventListener("input", () => {
    state.search = searchInput.value;
    render();
  });

  listElement.addEventListener("change", async (event) => {
    const checkbox = event.target.closest(".item-checkbox");
    if (!checkbox) return;

    const item = state.items.find((entry) => entry.id === checkbox.dataset.id);
    if (!item) return;

    const purchased = checkbox.checked;
    checkbox.disabled = true;
    setMessage("");

    let createdExpenseId = null;

    try {
      if (purchased) {
        // Record the purchase once, then mark the item so a reload cannot double-count it.
        if (Number(item.price) > 0 && !item.expenseLogged) {
          createdExpenseId = await addExpense({
            title: `Grocery: ${item.name}`,
            category: "Grocery",
            amount: Number(item.price),
            date: item.date || todayISO(),
            source: "grocery"
          });
        }

        await updateGrocery(item.id, {
          status: "purchased",
          ...(createdExpenseId ? { expenseLogged: true, expenseId: createdExpenseId } : {})
        });

        if (createdExpenseId) {
          setMessage(`“${item.name}” purchased. ${formatTaka(item.price)} added to expenses.`, "success");
        }
      } else {
        // Un-ticking a purchase should also withdraw the expense it created.
        if (item.expenseId) {
          await deleteExpense(item.expenseId);
        }

        await updateGrocery(item.id, {
          status: "pending",
          expenseLogged: false,
          expenseId: null
        });

        if (item.expenseId) {
          setMessage(`“${item.name}” is pending again. ${formatTaka(item.price)} removed from expenses.`, "success");
        }
      }
    } catch (error) {
      console.error(error);
      if (createdExpenseId) {
        try {
          await deleteExpense(createdExpenseId);
        } catch (cleanupError) {
          console.error(cleanupError);
        }
      }
      checkbox.checked = !purchased;
      setMessage(error.message || "Could not update the item.", "error");
    } finally {
      checkbox.disabled = false;
    }
  });

  listElement.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;

    const item = state.items.find((entry) => entry.id === button.dataset.delete);
    if (!item) return;

    button.disabled = true;
    try {
      await deleteGrocery(item.id);

      // Keep the shared expense collection in sync when a purchase is removed.
      if (item.expenseId) {
        try {
          await deleteExpense(item.expenseId);
        } catch (expenseError) {
          console.error(expenseError);
        }
      }

      setMessage(`“${item.name}” was removed.`, "success");
    } catch (error) {
      console.error(error);
      button.disabled = false;
      setMessage("Could not delete the item. Please try again.", "error");
    }
  });
}
