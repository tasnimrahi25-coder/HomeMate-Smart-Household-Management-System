const transactions = [
  {
    id: Date.now(),
    description: 'Monthly Salary',
    amount: 3500,
    type: 'income',
  },
  {
    id: Date.now() + 1,
    description: 'Freelance Writing',
    amount: -500,
    type: 'expense',
  }
];

class BudgetTracker {
  constructor() {
    this.transactions = this.loadTransactions();
    this.form = document.getElementById("transactionForm");
    this.transactionList = document.getElementById("transactionList");
    this.balanceElement = document.getElementById("balance");
    
    this.initEventListeners();
    this.renderTransactions();
    this.updateBalance();
  }

  loadTransactions() {
    return [...transactions];
  }

  initEventListeners() {
    if (this.form) {
      this.form.reset();
      
      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        const descriptionInput = document.getElementById("description");
        const amountInput = document.getElementById("amount");
        const typeSelect = document.getElementById("type");

        const rawAmount = parseFloat(amountInput.value);
        if (!descriptionInput.value.trim() || isNaN(rawAmount) || rawAmount <= 0) return;

        const type = typeSelect.value;
        const finalAmount = type === "expense" ? -rawAmount : rawAmount;

        const newTransaction = {
          id: Date.now(),
          description: descriptionInput.value.trim(),
          amount: finalAmount,
          type: type
        };

        this.transactions.push(newTransaction);
        this.renderTransactions();
        this.updateBalance();

        this.form.reset();
      });
    }
  }

  renderTransactions() {
    if (!this.transactionList) return;
    this.transactionList.innerHTML = "";

    this.transactions
      .slice()
      .sort((a, b) => b.id - a.id)
      .forEach((transaction) => {
        const itemContainer = document.createElement("div");
        itemContainer.classList.add("transaction-card", transaction.type);

        itemContainer.innerHTML = `
          <span class="card-desc">${transaction.description}</span>
          <div class="card-right">
            <span class="card-amount">${Math.abs(transaction.amount).toFixed(2)} taka</span>
            <button class="delete-btn" data-id="${transaction.id}">Delete</button>
          </div>
        `;
        this.transactionList.appendChild(itemContainer);
      });

    this.attachDeleteEventListeners();
  }

  attachDeleteEventListeners() {
    if (!this.transactionList) return;
    
    this.transactionList.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", () => {
        this.deleteTransaction(Number(button.dataset.id));
      });
    });
  }

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(
      transaction => transaction.id !== id
    );
    this.renderTransactions();
    this.updateBalance();
  }

  updateBalance() {
    if (!this.balanceElement) return;

    const total = this.transactions.reduce((acc, current) => {
      return acc + current.amount;
    }, 0);

    const sign = total < 0 ? "-" : "";
    this.balanceElement.textContent = `${sign}${Math.abs(total).toFixed(2)} taka`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new BudgetTracker();
});
