const SEARCH_API_URL = "https://themealdb.com/api/json/v1/1/search.php?s=";

const INGREDIENT_API_URL = "https://themealdb.com/api/json/v1/1/filter.php?i=";

const RANDOM_API_URL = "https://themealdb.com/api/json/v1/1/random.php";

const LOOKUP_API_URL = "https://themealdb.com/api/json/v1/1/lookup.php?i=";

const DEFAULT_RECIPES = ["chicken", "pasta", "salad"];

const searchForm = document.getElementById("search-form");

const searchInput = document.getElementById("search-input");

const pantrySearchForm = document.getElementById("pantry-search-form");

const pantrySearchInput = document.getElementById("pantry-search-input");

const resultsGrid = document.getElementById("results-grid");

const messageArea = document.getElementById("message-area");

const randomButton = document.getElementById("random-button");

const modal = document.getElementById("recipe-modal");

const modalContent = document.getElementById("recipe-details-content");

const modalClosebtn = document.getElementById("modal-close-btn");

searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const searchTerm = searchInput.value.trim();

    if (searchTerm) {
        searchRecipes(searchTerm);
    } else {
        showMessage("Please enter a search term ", true);
    }
});

async function searchRecipes(query) {
    showMessage(`Searching for "${query}"...`, false, true);
    resultsGrid.innerHTML = "";

    try {
        const response = await fetch(`${SEARCH_API_URL}${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Network error");
        const data = await response.json();
        clearMessage();
        console.log("data: ", data);

        if (data.meals) {
            displayRecipes(data.meals);
        } else {
            showMessage(`No recipes found for "${query}"`);
        }
    } catch (error) {
        showMessage("Something went wrong, Please try again.", true);
    }
}

pantrySearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const ingredients = [...new Set(
        pantrySearchInput.value
            .split(",")
            .map((ingredient) => ingredient.trim().toLowerCase())
            .filter(Boolean)
    )];

    if (ingredients.length === 0) {
        showMessage("Enter at least one ingredient to find matching recipes.", true);
        return;
    }
    if (ingredients.length > 10) {
        showMessage("Search with up to 10 ingredients at a time.", true);
        return;
    }

    searchByIngredients(ingredients);
});

async function searchByIngredients(ingredients) {
    const ingredientLabel = ingredients.join(", ");
    showMessage(`Finding recipes with ${ingredientLabel}...`, false, true);
    resultsGrid.innerHTML = "";

    try {
        const ingredientResults = await Promise.all(
            ingredients.map(async (ingredient) => {
                const response = await fetch(`${INGREDIENT_API_URL}${encodeURIComponent(ingredient)}`);
                if (!response.ok) throw new Error(`Failed to search for ${ingredient}.`);
                const data = await response.json();
                return data.meals || [];
            })
        );
        const matches = new Map();

        ingredientResults.forEach((recipes) => {
            recipes.forEach((recipe) => {
                const match = matches.get(recipe.idMeal);
                if (match) {
                    match.count += 1;
                } else {
                    matches.set(recipe.idMeal, { recipe, count: 1 });
                }
            });
        });

        const rankedRecipes = [...matches.values()]
            .sort((first, second) => second.count - first.count || first.recipe.strMeal.localeCompare(second.recipe.strMeal))
            .map(({ recipe, count }) => ({ ...recipe, matchedIngredients: count }));

        clearMessage();
        if (rankedRecipes.length > 0) {
            displayRecipes(rankedRecipes, ingredients.length);
            showMessage(`Found ${rankedRecipes.length} recipes using your ingredients. Best matches are shown first.`);
            messageArea.classList.add("info");
        } else {
            showMessage(`No recipes found for ${ingredientLabel}. Try different or more common ingredient names.`);
        }
    } catch (error) {
        showMessage("Could not search recipes right now. Check your connection and try again.", true);
    }
}

function showMessage(message, isError = false, isLoading = false) {
    messageArea.textContent = message;
    messageArea.classList.remove("error", "info", "loading");

    if (isError) messageArea.classList.add("error");
    if (isLoading) messageArea.classList.add("loading");
}

function clearMessage() {
    messageArea.textContent = "";
    messageArea.className = "message";
}

function displayRecipes(recipes, ingredientTotal = 0) {
    if (!recipes || recipes.length === 0) {
        showMessage("No recipes to display");
        return;
    }

    recipes.forEach((recipe) => {
        const recipeDiv = document.createElement("div");
        recipeDiv.classList.add("recipe-item");
        recipeDiv.dataset.id = recipe.idMeal;

        const matchBadge = ingredientTotal
            ? `<p class="match-badge">${recipe.matchedIngredients} of ${ingredientTotal} ingredients match</p>`
            : "";
        recipeDiv.innerHTML = `
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
            <h3>${recipe.strMeal}</h3>
            ${matchBadge}
        `;

        resultsGrid.appendChild(recipeDiv);
    });
}

randomButton.addEventListener("click", getRandomRecipe);

loadDefaultRecipes();

async function loadDefaultRecipes() {
    showMessage("Loading some recipes...", false, true);
    resultsGrid.innerHTML = "";

    try {
        const recipesByQuery = await Promise.all(
            DEFAULT_RECIPES.map(async (query) => {
                const response = await fetch(`${SEARCH_API_URL}${encodeURIComponent(query)}`);
                if (!response.ok) throw new Error(`Failed to load ${query} recipes.`);
                const data = await response.json();
                return data.meals || [];
            })
        );

        const recipes = recipesByQuery.flat();
        clearMessage();

        if (recipes.length > 0) {
            displayRecipes(recipes);
        } else {
            showMessage("No recipes are available right now. Try searching or reload the page.");
        }
    } catch (error) {
        showMessage("Could not load recipes. Check your connection and try searching again.", true);
    }
}

async function getRandomRecipe() {
    showMessage("Fetching a random recipe ....", false, true);
    resultsGrid.innerHTML = "";

    try {
        const response = await fetch(RANDOM_API_URL);
        if (!response.ok) throw new Error("Something went wrong.");
        const data = await response.json();

        console.log("data", data);
        clearMessage();

        if (data.meals && data.meals.length > 0) {
            displayRecipes(data.meals);
        } else {
            showMessage("Could not fetch a random recipe. Please try again.", true);
        }
    } catch (error) {
        showMessage("Failed to fetch a random recipe. Please check your connection and try again", true);
    }
}

function showModal() {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
}

resultsGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".recipe-item");
    if (card) {
        const recipeId = card.dataset.id;
        getRecipeDetails(recipeId);
    }
});

async function getRecipeDetails(id) {
    modalContent.innerHTML = '<p class="message loading">Loading details...</p>';
    showModal();

    try {
        const response = await fetch(`${LOOKUP_API_URL}${id}`);
        if (!response.ok) throw new Error("Failed to fetch recipe details.");
        const data = await response.json();

        console.log("details: ", data);

        if (data.meals && data.meals.length > 0) {
            displayRecipeDetails(data.meals[0]);
        } else {
            modalContent.innerHTML = '<p class="message error">Could not load recipe details.</p>';
        }
    } catch (error) {
        modalContent.innerHTML = '<p class="message error">Failed to load recipe details. Check your connection or try again.</p>';
    }
}

modalClosebtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

function displayRecipeDetails(recipe) {
    const ingredients = [];
    const ingredientNames = [];

    for (let i = 1; i <= 20; i++) {
        const ingredient = recipe[`strIngredient${i}`]?.trim();
        const measure = recipe[`strMeasure${i}`]?.trim();

        if (ingredient) {
            ingredientNames.push(ingredient);
            ingredients.push(`<li>${measure ? `${measure} ` : ""}${ingredient}</li>`);
        } else {
            break;
        }
    }

    const instructions = recipe.strInstructions
        ? recipe.strInstructions
              .split(/\r?\n/)
              .filter((step) => step.trim())
              .map((step) => `<li>${step.trim()}</li>`)
              .join("")
        : "<li>No instructions available.</li>";

    const youtubeEmbed = recipe.strYoutube
        ? `<div class="video-wrapper"><h3>Video Recipe</h3><iframe src="${recipe.strYoutube.replace("watch?v=", "embed/")}" title="${recipe.strMeal} video" allowfullscreen></iframe></div>`
        : "";

    const sourceHTML = recipe.strSource
        ? `<div class="source-wrapper"><a href="${recipe.strSource}" target="_blank" rel="noopener noreferrer">View Original Source</a></div>`
        : "";

        modalContent.innerHTML = `
    <div class="recipe-details">
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
            <h2>${recipe.strMeal}</h2>
            <p><strong>Category:</strong> ${recipe.strCategory || "N/A"}</p>
            <p><strong>Area:</strong> ${recipe.strArea || "N/A"}</p>
            <h3>Ingredients</h3>
            <ul>${ingredients.join("") || "<li>No ingredients listed.</li>"}</ul>
            <button class="add-recipe-ingredients" type="button">Add ingredients to grocery list</button>
            <h3>Instructions</h3>
            <ol>${instructions}</ol>
            ${youtubeEmbed}
            ${sourceHTML}
        </div>
    `;

    modalContent.querySelector(".add-recipe-ingredients").addEventListener("click", (event) => {
        const addedCount = window.HomeMateData.addGroceries(ingredientNames);
        event.currentTarget.textContent = addedCount
            ? `${addedCount} ingredient${addedCount === 1 ? "" : "s"} added to grocery list`
            : "All ingredients are already on your grocery list";
    });
}