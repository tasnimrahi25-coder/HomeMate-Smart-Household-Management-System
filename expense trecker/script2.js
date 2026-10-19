let data = {
  food: 4500,
  grocery: 3200,
  bills: 2750,
  others: 2000
};
function openModal() {
  document.getElementById('expenseModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('expenseModal').style.display = 'none';
  document.getElementById('expenseForm').reset();
}
function handleAddExpense(event) {
  event.preventDefault();

  const category = document.getElementById('category').value;
  const amount = parseFloat(document.getElementById('amount').value);

  if (amount > 0) {
    data[category] += amount;
    updateUI();
    closeModal();
    showToast();
  }
}
function updateUI() {
  const total = data.food + data.grocery + data.bills + data.others;
  const formattedTotal = '৳ ' + total.toLocaleString();

  document.getElementById('totalAmount').innerText = formattedTotal;
  document.getElementById('donutTotal').innerText = formattedTotal;
  document.querySelector('.val-food').innerText = data.food.toLocaleString();
  document.querySelector('.val-grocery').innerText = data.grocery.toLocaleString();
  document.querySelector('.val-bills').innerText = data.bills.toLocaleString();
  document.querySelector('.val-others').innerText = data.others.toLocaleString();
  const pFood = Math.round((data.food / total) * 100) || 0;
  const pGrocery = Math.round((data.grocery / total) * 100) || 0;
  const pBills = Math.round((data.bills / total) * 100) || 0;
  const pOthers = Math.round((data.others / total) * 100) || 0;
  const items = document.querySelectorAll('.category-item');
  items[0].querySelector('.percentage').innerText = `(${pFood}%)`;
  items[1].querySelector('.percentage').innerText = `(${pGrocery}%)`;
  items[2].querySelector('.percentage').innerText = `(${pBills}%)`;
  items[3].querySelector('.percentage').innerText = `(${pOthers}%)`;
  const degFood = pFood;
  const degGrocery = degFood + pGrocery;
  const degBills = degGrocery + pBills;

  document.getElementById('donutChart').style.background = `
    conic-gradient(
      #ef4444 0% ${degFood}%,
      #22c55e ${degFood}% ${degGrocery}%,
      #06b6d4 ${degGrocery}% ${degBills}%,
      #a855f7 ${degBills}% 100%
    )
  `;
}
function filterCategories() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const items = document.querySelectorAll('.category-item');

  items.forEach(item => {
    const name = item.getAttribute('data-name');
    if (name.includes(query)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}
function showToast() {
  const toast = document.getElementById('toast');
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}