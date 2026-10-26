import { requireAuth, getUserProfile, watchGroceries, watchExpenses } from './firebase.js';

export async function loadDashboardData(onDataUpdate) {
  await requireAuth();
  const profile = await getUserProfile();

  let data = {
    name: profile.name || "User",
    monthlyBudget: profile.monthlyBudget || 0,
    groceryItems: 0,
    pendingGroceries: 0,
    spentThisMonth: 0,
    recentExpenses: []
  };

  // Real-time Groceries data
  watchGroceries((groceries) => {
    data.groceryItems = groceries.length;
    data.pendingGroceries = groceries.filter(item => item.status === 'pending').length;
    if (onDataUpdate) onDataUpdate(data);
  });

  // Real-time Expenses data
  watchExpenses((expenses) => {
    let total = 0;
    expenses.forEach(exp => {
      total += Number(exp.amount) || 0;
    });
    data.spentThisMonth = total;
    data.recentExpenses = expenses.slice(0, 5);
    if (onDataUpdate) onDataUpdate(data);
  });
}