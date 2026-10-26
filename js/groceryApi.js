import { requireAuth, watchGroceries, addGrocery, updateGrocery, deleteGrocery } from './firebase.js';

export async function initGroceryPage(renderList) {
  await requireAuth();
  
  watchGroceries((groceries) => {
    if (renderList) renderList(groceries);
  });
}

export async function handleAddGrocery(name, price, date) {
  return await addGrocery({ name, price, date });
}

export async function handleUpdateGrocery(id, patch) {
  return await updateGrocery(id, patch);
}

export async function handleDeleteGrocery(id) {
  return await deleteGrocery(id);
}