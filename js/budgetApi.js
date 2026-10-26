import { requireAuth, getUserProfile, updateUserProfile, watchExpenses, watchIncome, addIncome, deleteIncome } from '../firebase.js';

export async function initBudgetTracker(updateUI) {
  await requireAuth();
  const profile = await getUserProfile();

  let budgetData = {
    monthlyBudget: profile.monthlyBudget || 0,
    totalIncome: 0,
    totalExpenses: 0
  };

  // Watch Expenses
  watchExpenses((expenses) => {
    let expTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    budgetData.totalExpenses = expTotal;
    if (updateUI) updateUI(budgetData);
  });

  // Watch Income
  watchIncome((incomeList) => {
    let incTotal = incomeList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    budgetData.totalIncome = incTotal;
    if (updateUI) updateUI(budgetData);
  });
}

export async function saveMonthlyBudget(newAmount) {
  await updateUserProfile({ monthlyBudget: Number(newAmount) });
}

export async function addNewIncome(title, amount, date) {
  return await addIncome({ title, amount, date });
}