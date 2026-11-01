```javascript
// HomeMate - Central API Module

import { LoginAPI } from "./loginApi.js";
import { DashboardAPI } from "./dashboardApi.js";
import { RecipeAPI } from "./recipeApi.js";
import { GroceryAPI } from "./groceryApi.js";

// Central API object
export const Api = {
  // -------------------------
  // Authentication API
  // -------------------------
  register: (name, email, password) =>
    LoginAPI.register(name, email, password),

  login: (email, password, remember = true) =>
    LoginAPI.login(email, password, remember),

  logout: () => LoginAPI.logout(),

  currentUser: () => LoginAPI.currentUser(),

  resetPassword: (email) =>
    LoginAPI.resetPassword(email),

  getAuthError: (error) =>
    LoginAPI.getError(error),

  // -------------------------
  // Dashboard API
  // -------------------------
  getProfile: () =>
    DashboardAPI.getProfile(),

  getDashboardGroceries: (callback, onError) =>
    DashboardAPI.getGroceries(callback, onError),

  getExpenses: (callback, onError) =>
    DashboardAPI.getExpenses(callback, onError),

  getIncome: (callback, onError) =>
    DashboardAPI.getIncome(callback, onError),

  formatMoney: (amount) =>
    DashboardAPI.formatMoney(amount),

  // -------------------------
  // Food & Recipes API
  // -------------------------
  searchRecipes: (name) =>
    RecipeAPI.search(name),

  searchByIngredient: (ingredient) =>
    RecipeAPI.searchByIngredient(ingredient),

  getRandomRecipe: () =>
    RecipeAPI.random(),

  getRecipeDetails: (id) =>
    RecipeAPI.details(id),

  // -------------------------
  // Grocery Management API
  // -------------------------
  getGroceries: (callback, onError) =>
    GroceryAPI.getAll(callback, onError),

  addGrocery: (name, price = 0, date) =>
    GroceryAPI.add(name, price, date),

  updateGrocery: (id, changes) =>
    GroceryAPI.update(id, changes),

  deleteGrocery: (id) =>
    GroceryAPI.delete(id)
};

// Optional global access for existing scripts
window.Api = Api;
```
