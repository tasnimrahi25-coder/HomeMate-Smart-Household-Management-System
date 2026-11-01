import {
  requireAuth,
  watchMaintenance,
  addMaintenance,
  updateMaintenance,
  deleteMaintenance,
  watchBills,
  addBill,
  updateBill,
  deleteBill,
  addExpense,
  deleteExpense,
  formatTaka,
  todayISO
} from "../firebase.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// Appliance cards use an inline SVG so the icon never depends on an icon font.
function createApplianceIcon() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "maintenance-icon appliance-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.9");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z");
  svg.append(path);
  return svg;
}

const user = await requireAuth();

if (user) init();

function init() {
  const applianceList = document.getElementById("appliance-list");
  const billList = document.getElementById("bill-list");
  const applianceEmpty = document.getElementById("appliance-empty");
  const billEmpty = document.getElementById("bill-empty");
  const pageMessage = document.getElementById("page-message");
  const applianceCount = document.getElementById("appliance-count");
  const upcomingCount = document.getElementById("upcoming-count");
  const unpaidCount = document.getElementById("unpaid-count");
  const applianceDialog = document.getElementById("appliance-dialog");
  const billDialog = document.getElementById("bill-dialog");
  const applianceDialogTitle = document.getElementById("appliance-dialog-title");
  const billDialogTitle = document.getElementById("bill-dialog-title");
  const applianceForm = document.getElementById("appliance-form");
  const billForm = document.getElementById("bill-form");
  const applianceError = document.getElementById("appliance-error");
  const billError = document.getElementById("bill-error");
  const itemInput = applianceForm.querySelector('[name="item"]');
  const lastServiceInput = applianceForm.elements.lastService;
  const nextServiceInput = applianceForm.elements.nextService;
  const intervalInput = applianceForm.elements.intervalMonths;

  const state = {
    appliances: [],
    bills: [],
    editingApplianceId: null,
    editingBillId: null
  };

  let successTimer = null;
  let nextServiceTouched = false;

  /* ---------- Messages ---------- */

  function announce(text, type = "error") {
    window.clearTimeout(successTimer);
    pageMessage.textContent = text;
    pageMessage.classList.toggle("is-success", type === "success");
    pageMessage.hidden = false;

    if (type === "success") {
      successTimer = window.setTimeout(() => {
        pageMessage.hidden = true;
      }, 5000);
    }
  }

  function clearError() {
    // A live data refresh should dismiss an old error, but never a success note.
    if (pageMessage.classList.contains("is-success")) return;
    pageMessage.hidden = true;
  }

  function showPageError(error) {
    console.error(error);
    announce(error?.message || "Unable to load maintenance data. Please try again.");
  }

  function showFormError(element, error) {
    console.error(error);
    element.textContent = error?.message || "Could not save your changes. Please try again.";
  }

  /* ---------- Date helpers ---------- */

  function parseISODate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(value) {
    if (!value) return "Not set";
    const date = parseISODate(value);
    if (!date) return value;
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function daysUntil(value) {
    const target = parseISODate(value);
    if (!target) return null;
    const today = parseISODate(todayISO());
    return Math.round((target - today) / 86400000);
  }

  function addMonths(value, months) {
    const date = parseISODate(value) || parseISODate(todayISO());
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
    return toISODate(date);
  }

  function intervalLabel(months) {
    const value = Number(months) || 6;
    return `Every ${value} month${value === 1 ? "" : "s"}`;
  }

  /* ---------- Statuses ---------- */

  function serviceStatus(appliance) {
    const days = daysUntil(appliance.nextService);

    if (days === null) return { label: "Date not set", className: "is-neutral" };
    if (days < 0) {
      const late = Math.abs(days);
      return { label: `Overdue by ${late} day${late === 1 ? "" : "s"}`, className: "is-danger" };
    }
    if (days === 0) return { label: "Due today", className: "is-warning" };
    if (days <= 7) return { label: `Due in ${days} day${days === 1 ? "" : "s"}`, className: "is-warning" };
    return { label: "On track", className: "" };
  }

  function billStatus(bill) {
    if (bill.paid === true) return { label: "Paid", className: "" };

    const days = daysUntil(bill.due);
    if (days === null) return { label: "Unpaid", className: "is-neutral" };
    if (days < 0) return { label: "Overdue", className: "is-danger" };
    if (days === 0) return { label: "Due today", className: "is-warning" };
    if (days <= 7) return { label: "Due soon", className: "is-warning" };
    return { label: "Unpaid", className: "is-neutral" };
  }

  /* ---------- Rendering ---------- */

  function renderAppliances() {
    applianceList.replaceChildren();
    let upcoming = 0;

    [...state.appliances]
      .sort((a, b) => String(a.nextService || "").localeCompare(String(b.nextService || "")))
      .forEach((appliance) => {
        const status = serviceStatus(appliance);
        const days = daysUntil(appliance.nextService);
        if (days !== null && days <= 7) upcoming += 1;

        const card = document.createElement("article");
        card.className = "appliance-card";

        const top = document.createElement("div");
        top.className = "appliance-card-top";
        const name = document.createElement("h3");
        name.textContent = appliance.item || "Appliance";
        const icon = createApplianceIcon();
        top.append(name, icon);

        const dates = document.createElement("div");
        dates.className = "appliance-dates";

        const lastService = document.createElement("span");
        lastService.append("Last service: ");
        const lastDate = document.createElement("strong");
        lastDate.textContent = formatDate(appliance.lastService);
        lastService.append(lastDate);

        const nextService = document.createElement("span");
        nextService.append("Next service: ");
        const nextDate = document.createElement("strong");
        nextDate.textContent = formatDate(appliance.nextService);
        nextService.append(nextDate);

        const interval = document.createElement("span");
        interval.append("Interval: ");
        const intervalValue = document.createElement("strong");
        intervalValue.textContent = intervalLabel(appliance.intervalMonths);
        interval.append(intervalValue);

        dates.append(lastService, nextService, interval);

        const badge = document.createElement("span");
        badge.className = `status-badge ${status.className}`.trim();
        badge.textContent = status.label;

        const actions = document.createElement("div");
        actions.className = "appliance-actions";

        const serviceButton = document.createElement("button");
        serviceButton.className = "service-button";
        serviceButton.type = "button";
        serviceButton.textContent = "Mark serviced";
        serviceButton.addEventListener("click", () => markServiced(appliance, serviceButton));

        const editButton = document.createElement("button");
        editButton.className = "card-action";
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.setAttribute("aria-label", `Edit ${appliance.item || "appliance"}`);
        editButton.addEventListener("click", () => openApplianceDialog(appliance));

        const deleteButton = document.createElement("button");
        deleteButton.className = "card-action card-action--danger";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${appliance.item || "appliance"}`);
        deleteButton.addEventListener("click", () => removeAppliance(appliance, deleteButton));

        actions.append(serviceButton, editButton, deleteButton);
        card.append(top, dates, badge, actions);
        applianceList.appendChild(card);
      });

    applianceCount.textContent = String(state.appliances.length);
    upcomingCount.textContent = String(upcoming);
    applianceEmpty.hidden = state.appliances.length > 0;
  }

  function renderBills() {
    billList.replaceChildren();
    let unpaid = 0;

    [...state.bills]
      .sort((a, b) => {
        const aPaid = a.paid === true;
        const bPaid = b.paid === true;
        if (aPaid !== bPaid) return aPaid ? 1 : -1;
        return String(a.due || "").localeCompare(String(b.due || ""));
      })
      .forEach((bill) => {
        const paid = bill.paid === true;
        if (!paid) unpaid += 1;

        const status = billStatus(bill);

        const row = document.createElement("tr");
        if (status.className === "is-danger") row.className = "is-overdue";

        const name = document.createElement("td");
        name.className = "bill-name";
        name.textContent = bill.name || "Household bill";

        const amount = document.createElement("td");
        amount.className = "bill-amount";
        amount.textContent = formatTaka(bill.amount);

        const due = document.createElement("td");
        due.textContent = formatDate(bill.due);

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `status-badge ${status.className}`.trim();
        badge.textContent = status.label;
        statusCell.appendChild(badge);

        const actionCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "bill-actions";

        const toggle = document.createElement("button");
        toggle.className = `bill-action${paid ? " is-paid" : ""}`;
        toggle.type = "button";
        toggle.textContent = paid ? "Undo paid" : "Mark paid";
        toggle.setAttribute("aria-label", paid ? `Mark ${bill.name || "bill"} as unpaid` : `Mark ${bill.name || "bill"} as paid`);
        toggle.addEventListener("click", () => setBillPaid(bill, !paid, toggle));

        const edit = document.createElement("button");
        edit.className = "bill-action";
        edit.type = "button";
        edit.textContent = "Edit";
        edit.disabled = paid;
        edit.title = paid ? "Mark the bill unpaid before editing it." : "";
        edit.setAttribute("aria-label", `Edit ${bill.name || "bill"}`);
        edit.addEventListener("click", () => openBillDialog(bill));

        const remove = document.createElement("button");
        remove.className = "bill-action bill-action--danger";
        remove.type = "button";
        remove.textContent = "Delete";
        remove.setAttribute("aria-label", `Delete ${bill.name || "bill"}`);
        remove.addEventListener("click", () => removeBill(bill, remove));

        actions.append(toggle, edit, remove);
        actionCell.appendChild(actions);
        row.append(name, amount, due, statusCell, actionCell);
        billList.appendChild(row);
      });

    unpaidCount.textContent = String(unpaid);
    billEmpty.hidden = state.bills.length > 0;
  }

  /* ---------- Appliance dialogs and actions ---------- */

  function syncNextService(force = false) {
    if (!force && nextServiceTouched) return;
    const base = lastServiceInput.value || todayISO();
    nextServiceInput.value = addMonths(base, Number(intervalInput.value) || 6);
  }

  function openApplianceDialog(appliance = null) {
    state.editingApplianceId = appliance?.id || null;
    applianceForm.reset();
    applianceError.textContent = "";
    applianceDialogTitle.textContent = appliance ? "Edit appliance" : "Add appliance";
    applianceForm.querySelector('[type="submit"]').textContent = appliance ? "Save changes" : "Save appliance";

    lastServiceInput.max = todayISO();
    lastServiceInput.value = appliance?.lastService || todayISO();
    intervalInput.value = String(Number(appliance?.intervalMonths) || 6);
    nextServiceTouched = false;

    if (appliance?.nextService) {
      nextServiceInput.value = appliance.nextService;
    } else {
      syncNextService(true);
    }

    nextServiceInput.min = lastServiceInput.value;
    applianceDialog.showModal();
    itemInput.focus();
    itemInput.select();
  }

  async function markServiced(appliance, button) {
    const months = Number(appliance.intervalMonths) || 6;
    const next = addMonths(todayISO(), months);

    button.disabled = true;
    try {
      await updateMaintenance(appliance.id, { lastService: todayISO(), nextService: next });
      announce(`“${appliance.item || "Appliance"}” marked as serviced. Next service ${formatDate(next)}.`, "success");
    } catch (error) {
      showPageError(error);
    } finally {
      button.disabled = false;
    }
  }

  async function removeAppliance(appliance, button) {
    const name = appliance.item || "this appliance";
    if (!window.confirm(`Delete “${name}”? Its service schedule will be removed.`)) return;

    button.disabled = true;
    try {
      await deleteMaintenance(appliance.id);
      announce(`“${name}” was deleted.`, "success");
    } catch (error) {
      showPageError(error);
      button.disabled = false;
    }
  }

  /* ---------- Bill dialogs and actions ---------- */

  function openBillDialog(bill = null) {
    state.editingBillId = bill?.id || null;
    billForm.reset();
    billError.textContent = "";
    billDialogTitle.textContent = bill ? "Edit bill" : "Add bill";
    billForm.querySelector('[type="submit"]').textContent = bill ? "Save changes" : "Save bill";

    if (bill) {
      billForm.elements.name.value = bill.name || "";
      billForm.elements.amount.value = Number(bill.amount) || "";
      billForm.elements.due.value = bill.due || todayISO();
    } else {
      billForm.elements.due.value = todayISO();
    }

    billDialog.showModal();
    billForm.elements.name.focus();
    billForm.elements.name.select();
  }

  async function setBillPaid(bill, paid, button) {
    const name = bill.name || "Household bill";
    const amount = Number(bill.amount) || 0;

    button.disabled = true;
    try {
      if (paid) {
        // Remove any stale expense link before creating a fresh one.
        if (bill.expenseId) {
          try {
            await deleteExpense(bill.expenseId);
          } catch (error) {
            console.error(error);
          }
        }

        let expenseId = null;
        if (amount > 0) {
          expenseId = await addExpense({
            title: `Bill: ${name}`,
            category: "Bills",
            amount,
            date: todayISO(),
            source: "maintenance"
          });
        }

        try {
          await updateBill(bill.id, { paid: true, paidAt: todayISO(), expenseId });
        } catch (error) {
          if (expenseId) {
            try {
              await deleteExpense(expenseId);
            } catch (cleanupError) {
              console.error(cleanupError);
            }
          }
          throw error;
        }

        announce(
          amount > 0
            ? `“${name}” marked paid. ${formatTaka(amount)} added to expenses.`
            : `“${name}” marked paid.`,
          "success"
        );
      } else {
        if (bill.expenseId) {
          try {
            await deleteExpense(bill.expenseId);
          } catch (error) {
            console.error(error);
          }
        }

        await updateBill(bill.id, { paid: false, paidAt: "", expenseId: null });
        announce(`“${name}” is unpaid again.`, "success");
      }
    } catch (error) {
      showPageError(error);
      button.disabled = false;
    }
  }

  async function removeBill(bill, button) {
    const name = bill.name || "this bill";
    if (!window.confirm(`Delete “${name}”?`)) return;

    button.disabled = true;
    try {
      // Remove the linked expense first so a failure cannot orphan it.
      if (bill.expenseId) {
        await deleteExpense(bill.expenseId);
      }

      await deleteBill(bill.id);
      announce(`“${name}” was deleted.`, "success");
    } catch (error) {
      showPageError(error);
      button.disabled = false;
    }
  }

  /* ---------- Dialog wiring ---------- */

  document.getElementById("open-appliance-form").addEventListener("click", () => openApplianceDialog());
  document.getElementById("open-bill-form").addEventListener("click", () => openBillDialog());

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  [applianceDialog, billDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  applianceDialog.addEventListener("close", () => {
    state.editingApplianceId = null;
  });

  billDialog.addEventListener("close", () => {
    state.editingBillId = null;
  });

  lastServiceInput.addEventListener("change", () => {
    if (lastServiceInput.value && lastServiceInput.value > todayISO()) {
      lastServiceInput.value = todayISO();
    }
    nextServiceInput.min = lastServiceInput.value || todayISO();
    syncNextService();
  });

  intervalInput.addEventListener("change", () => syncNextService());
  nextServiceInput.addEventListener("input", () => {
    nextServiceTouched = true;
  });

  applianceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    applianceError.textContent = "";

    const editingId = state.editingApplianceId;
    const formData = new FormData(applianceForm);
    const item = String(formData.get("item") || "").trim();
    const lastService = String(formData.get("lastService") || "");
    const nextService = String(formData.get("nextService") || "");
    const intervalMonths = Number(formData.get("intervalMonths")) || 6;

    if (!item) {
      showFormError(applianceError, new Error("Please enter an appliance name."));
      return;
    }
    if (lastService && lastService > todayISO()) {
      showFormError(applianceError, new Error("The last service date cannot be in the future."));
      return;
    }
    if (!nextService) {
      showFormError(applianceError, new Error("Please choose the next service date."));
      return;
    }
    if (lastService && nextService < lastService) {
      showFormError(applianceError, new Error("The next service date must be after the last service date."));
      return;
    }

    const saveButton = applianceForm.querySelector('[type="submit"]');
    saveButton.disabled = true;
    try {
      if (editingId) {
        await updateMaintenance(editingId, { item, lastService, nextService, intervalMonths });
        announce(`“${item}” was updated.`, "success");
      } else {
        await addMaintenance({ item, lastService, nextService, intervalMonths });
        announce(`“${item}” was added to your maintenance schedule.`, "success");
      }
      applianceDialog.close();
    } catch (error) {
      showFormError(applianceError, error);
    } finally {
      saveButton.disabled = false;
    }
  });

  billForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    billError.textContent = "";

    const editingId = state.editingBillId;
    const formData = new FormData(billForm);
    const name = String(formData.get("name") || "").trim();
    const amount = Number(formData.get("amount"));
    const due = String(formData.get("due") || "");

    if (!name) {
      showFormError(billError, new Error("Please enter a bill name."));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showFormError(billError, new Error("Please enter an amount greater than zero."));
      return;
    }
    if (!due) {
      showFormError(billError, new Error("Please choose a due date."));
      return;
    }

    const saveButton = billForm.querySelector('[type="submit"]');
    saveButton.disabled = true;
    try {
      if (editingId) {
        await updateBill(editingId, { name, amount, due });
        announce(`“${name}” was updated.`, "success");
      } else {
        await addBill({ name, amount, due });
        announce(`“${name}” was added to your bills.`, "success");
      }
      billDialog.close();
    } catch (error) {
      showFormError(billError, error);
    } finally {
      saveButton.disabled = false;
    }
  });

  document.querySelectorAll("[data-section-link]").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll("[data-section-link]").forEach((tab) => tab.classList.remove("is-active"));
      link.classList.add("is-active");
    });
  });

  /* ---------- Live data ---------- */

  watchMaintenance(
    (items) => {
      clearError();
      state.appliances = items;
      renderAppliances();
    },
    showPageError
  );

  watchBills(
    (items) => {
      clearError();
      state.bills = items;
      renderBills();
    },
    showPageError
  );
}
