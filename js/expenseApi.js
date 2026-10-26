import { requireAuth, watchExpenses, addExpense, deleteExpense } from '../firebase.js';

export async function initExpenseTracker(renderExpenses) {
  await requireAuth();

  watchExpenses((expenses) => {
    if (renderExpenses) renderExpenses(expenses);
  });
}

export async function addNewExpenseItem({ title, category, amount, date }) {
  return await addExpense({ title, category, amount, date });
}

export async function removeExpenseItem(id) {
  return await deleteExpense(id);
}