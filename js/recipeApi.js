import { requireAuth } from './firebase.js';

export async function searchRecipesByName(query) {
  await requireAuth();
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("Recipe search error:", error);
    return [];
  }
}

export async function getRandomRecipeApi() {
  await requireAuth();
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/random.php`);
    const data = await response.json();
    return data.meals ? data.meals[0] : null;
  } catch (error) {
    console.error("Random recipe error:", error);
    return null;
  }
}