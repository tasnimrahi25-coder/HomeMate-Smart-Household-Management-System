import {
  requireAuth,
  watchMaintenance,
  addMaintenance,
  updateMaintenance,
  watchBills,
  addBill,
  updateBill,
  formatTaka,
  todayISO
} from "../firebase.js";

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
  const applianceForm = document.getElementById("appliance-form");
  const billForm = document.getElementById("bill-form");
  const applianceError = document.getElementById("appliance-error");
  const billError = document.getElementById("bill-error");
  const state = { appliances: [], bills: [] };

  function showPageError(error) {
    pageMessage.textContent = error?.message || "Unable to load maintenance data. Please try again.";
    pageMessage.hidden = false;
  }

  function showFormError(element, error) {
    element.textContent = error?.message || "Could not save your changes. Please try again.";
  }

  function formatDate(value) {
    if (!value) return "Not set";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function daysUntil(value) {
    if (!value) return null;
    const target = new Date(`${value}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const today = new Date(`${todayISO()}T00:00:00`);
    return Math.round((target - today) / 86400000);
  }

  function serviceStatus(appliance) {
    const days = daysUntil(appliance.nextService);
    if (days === null) return { label: "Date not set", className: "" };
    if (days < 0) return { label: "Overdue", className: "is-danger" };
    if (days <= 7) return { label: days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`, className: "is-warning" };
    return { label: "On track", className: "" };
  }

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
        const icon = document.createElement("span");
        icon.className = "appliance-icon material-icons-sharp";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "home_repair_service";
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
        dates.append(lastService, nextService);

        const badge = document.createElement("span");
        badge.className = `status-badge ${status.className}`;
        badge.textContent = status.label;

        const serviceButton = document.createElement("button");
        serviceButton.className = "service-button";
        serviceButton.type = "button";
        serviceButton.textContent = "Mark serviced";
        serviceButton.addEventListener("click", async () => {
          serviceButton.disabled = true;
          try {
            const serviced = new Date(`${todayISO()}T00:00:00`);
            const originalDay = serviced.getDate();
            serviced.setDate(1);
            serviced.setMonth(serviced.getMonth() + (Number(appliance.intervalMonths) || 6));
            serviced.setDate(Math.min(originalDay, new Date(serviced.getFullYear(), serviced.getMonth() + 1, 0).getDate()));
            const next = new Date(serviced.getTime() - serviced.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
            await updateMaintenance(appliance.id, { lastService: todayISO(), nextService: next });
          } catch (error) {
            showPageError(error);
            serviceButton.disabled = false;
          }
        });

        card.append(top, dates, badge, serviceButton);
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
      .sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")))
      .forEach((bill) => {
        const paid = bill.paid === true;
        if (!paid) unpaid += 1;
        const row = document.createElement("tr");
        const name = document.createElement("td");
        name.className = "bill-name";
        name.textContent = bill.name || "Household bill";
        const amount = document.createElement("td");
        amount.className = "bill-amount";
        amount.textContent = formatTaka(bill.amount);
        const due = document.createElement("td");
        due.textContent = formatDate(bill.due);
        const statusCell = document.createElement("td");
        const status = document.createElement("span");
        status.className = `status-badge${paid ? "" : " is-danger"}`;
        status.textContent = paid ? "Paid" : "Unpaid";
        statusCell.appendChild(status);
        const actionCell = document.createElement("td");
        const action = document.createElement("button");
        action.className = `bill-action${paid ? " is-paid" : ""}`;
        action.type = "button";
        action.textContent = paid ? "Paid" : "Mark paid";
        action.disabled = paid;
        action.setAttribute("aria-label", paid ? `${bill.name} is paid` : `Mark ${bill.name} as paid`);
        action.addEventListener("click", async () => {
          action.disabled = true;
          try {
            await updateBill(bill.id, { paid: true });
          } catch (error) {
            showPageError(error);
            action.disabled = false;
          }
        });
        actionCell.appendChild(action);
        row.append(name, amount, due, statusCell, actionCell);
        billList.appendChild(row);
      });

    unpaidCount.textContent = String(unpaid);
    billEmpty.hidden = state.bills.length > 0;
  }

  document.getElementById("open-appliance-form").addEventListener("click", () => {
    applianceError.textContent = "";
    applianceForm.reset();
    applianceForm.elements.lastService.value = todayISO();
    applianceForm.elements.nextService.value = "";
    applianceDialog.showModal();
    applianceForm.elements.item.focus();
  });

  document.getElementById("open-bill-form").addEventListener("click", () => {
    billError.textContent = "";
    billForm.reset();
    billForm.elements.due.value = todayISO();
    billDialog.showModal();
    billForm.elements.name.focus();
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  [applianceDialog, billDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  applianceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    applianceError.textContent = "";
    const formData = new FormData(applianceForm);
    const saveButton = applianceForm.querySelector('[type="submit"]');
    saveButton.disabled = true;
    try {
      await addMaintenance({
        item: formData.get("item"),
        lastService: formData.get("lastService"),
        nextService: formData.get("nextService"),
        intervalMonths: Number(formData.get("intervalMonths"))
      });
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
    const formData = new FormData(billForm);
    const saveButton = billForm.querySelector('[type="submit"]');
    saveButton.disabled = true;
    try {
      await addBill({
        name: formData.get("name"),
        amount: Number(formData.get("amount")),
        due: formData.get("due")
      });
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

  watchMaintenance((items) => {
    pageMessage.hidden = true;
    state.appliances = items;
    renderAppliances();
  }, showPageError);
  watchBills((items) => {
    pageMessage.hidden = true;
    state.bills = items;
    renderBills();
  }, showPageError);
}