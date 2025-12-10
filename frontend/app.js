// Global variables
let currentPlanId = null;
let currentPlanData = null;

// API Base URL
const API_BASE = window.location.origin;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize based on current page
    const path = window.location.pathname;

    if (path === '/' || path === '/index.html') {
        initializeHomePage();
    } else if (path === '/meal-planner') {
        initializeMealPlannerPage();
    } else if (path === '/shopping-list') {
        initializeShoppingListPage();
    }
});

// Home Page Functions
function initializeHomePage() {
    const searchBtn = document.getElementById('search-btn');
    const ingredientsInput = document.getElementById('ingredients');
    const preferencesInput = document.getElementById('preferences');
    const loadFavoritesBtn = document.getElementById('load-favorites-btn');
    const favoritesSearchInput = document.getElementById('favorites-search');

    // Tab switching
    const searchTab = document.getElementById('search-tab');
    const favoritesTab = document.getElementById('favorites-tab');
    const searchSection = document.getElementById('search-section');
    const favoritesSection = document.getElementById('favorites-section');

    searchTab.addEventListener('click', () => {
        searchTab.classList.add('active');
        favoritesTab.classList.remove('active');
        searchSection.style.display = 'block';
        favoritesSection.style.display = 'none';
    });

    favoritesTab.addEventListener('click', () => {
        favoritesTab.classList.add('active');
        searchTab.classList.remove('active');
        searchSection.style.display = 'none';
        favoritesSection.style.display = 'block';
    });

    searchBtn.addEventListener('click', async () => {
        const ingredients = ingredientsInput.value.trim();
        const preferences = preferencesInput.value.trim();

        if (!ingredients) {
            alert('Please enter some ingredients');
            return;
        }

        await searchRecipe(ingredients, preferences);
    });

    loadFavoritesBtn.addEventListener('click', async () => {
        const searchTerm = favoritesSearchInput.value.trim();
        await loadFavorites(searchTerm);
    });

    // Enter key support
    ingredientsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    favoritesSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadFavoritesBtn.click();
        }
    });
}

// Global variable to store current recipe
let currentRecipe = null;

async function searchRecipe(ingredients, preferences) {
    const resultsDiv = document.getElementById('recipe-results');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const recipeCard = document.getElementById('recipe-card');

    // Show loading
    resultsDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/api/recipes/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredients: ingredients.split(',').map(i => i.trim()),
                preferences: preferences || null
            })
        });

        if (!response.ok) {
            throw new Error('Failed to search recipe');
        }

        const recipe = await response.json();
        currentRecipe = recipe; // Store for favoriting

        // Display recipe with favorite functionality
        recipeCard.innerHTML = await renderRecipeCardWithFavorite(recipe, 'search');
        resultsDiv.style.display = 'block';

    } catch (error) {
        console.error('Error searching recipe:', error);
        errorDiv.style.display = 'block';
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Meal Planner Page Functions
function initializeMealPlannerPage() {
    const generateBtn = document.getElementById('generate-plan-btn');
    const regenerateBtn = document.getElementById('regenerate-plan-btn');
    const preferencesInput = document.getElementById('plan-preferences');
    const exclusionsInput = document.getElementById('plan-exclusions');

    generateBtn.addEventListener('click', () => {
        const preferences = preferencesInput.value.trim();
        const exclusions = exclusionsInput.value.trim();
        generateMealPlan(preferences, exclusions);
    });

    regenerateBtn.addEventListener('click', () => {
        const preferences = preferencesInput.value.trim();
        const exclusions = exclusionsInput.value.trim();
        generateMealPlan(preferences, exclusions);
    });

    // Check if we have a plan ID in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan_id');
    if (planId) {
        loadMealPlan(planId);
    }
}

async function generateMealPlan(preferences, exclusions) {
    const planSetup = document.getElementById('plan-setup');
    const planDisplay = document.getElementById('plan-display');
    const loadingDiv = document.getElementById('plan-loading');
    const errorDiv = document.getElementById('plan-error');
    const dinnerPlan = document.getElementById('dinner-plan');

    // Show loading
    planSetup.style.display = 'none';
    planDisplay.style.display = 'block';
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/api/dinners/generate-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                preferences: preferences || null,
                exclusions: exclusions ? exclusions.split(',').map(e => e.trim()) : []
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate meal plan');
        }

        const plan = await response.json();
        currentPlanId = plan.id;
        currentPlanData = plan;

        // Update URL
        window.history.pushState({}, '', `/meal-planner?plan_id=${plan.id}`);

        // Display plan
        renderMealPlan(plan);

    } catch (error) {
        console.error('Error generating meal plan:', error);
        errorDiv.style.display = 'block';
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function renderMealPlan(plan) {
    const dinnerPlan = document.getElementById('dinner-plan');
    const shoppingBtn = document.getElementById('generate-shopping-btn');

    dinnerPlan.innerHTML = '';

    let allApproved = true;

    plan.meals.forEach(meal => {
        const ingredients = JSON.parse(meal.recipe_ingredients);
        const instructions = JSON.parse(meal.recipe_instructions);

        const card = document.createElement('div');
        card.className = `dinner-card ${meal.status}`;
        card.innerHTML = `
            <h4>Day ${meal.day_number}: ${meal.recipe_name}</h4>
            <p class="description">${meal.recipe_description}</p>
            <div class="meta">
                <span>⏱️ ${meal.prep_time} prep + ${meal.cook_time} cook</span>
                <span>🍽️ Serves ${meal.servings}</span>
            </div>
            <div class="recipe-preview">
                <strong>Ingredients:</strong> ${ingredients.slice(0, 3).map(ing => ing.name).join(', ')}${ingredients.length > 3 ? '...' : ''}
            </div>
            <div class="dinner-actions">
                <button class="btn btn-small btn-info" onclick="viewFullRecipe(${meal.id})">👁️ View Recipe</button>
                ${meal.status === 'pending' ? `
                    <button class="btn btn-small btn-approve" onclick="approveMeal(${meal.id})">✅ Approve</button>
                    <button class="btn btn-small btn-reject" onclick="rejectMeal(${meal.id})">❌ Reject</button>
                ` : meal.status === 'approved' ? `
                    <span class="status-approved">✅ Approved</span>
                ` : `
                    <button class="btn btn-small btn-regenerate" onclick="regenerateMeal(${meal.id})">🔄 Regenerate</button>
                `}
            </div>
        `;

        dinnerPlan.appendChild(card);

        if (meal.status !== 'approved') {
            allApproved = false;
        }
    });

    // Show shopping list button if all approved
    shoppingBtn.style.display = allApproved ? 'inline-block' : 'none';

    shoppingBtn.onclick = () => {
        window.location.href = `/shopping-list?plan_id=${plan.id}`;
    };
}

async function approveMeal(mealId) {
    try {
        const response = await fetch(`${API_BASE}/api/dinners/${mealId}/approve`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('Failed to approve meal');
        }

        // Reload plan
        await loadMealPlan(currentPlanId);

    } catch (error) {
        console.error('Error approving meal:', error);
        alert('Failed to approve meal');
    }
}

async function rejectMeal(mealId) {
    try {
        const response = await fetch(`${API_BASE}/api/dinners/${mealId}/reject`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('Failed to reject meal');
        }

        // Reload plan
        await loadMealPlan(currentPlanId);

    } catch (error) {
        console.error('Error rejecting meal:', error);
        alert('Failed to reject meal');
    }
}

async function regenerateMeal(mealId) {
    // Show loading state on the button
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '🔄 Regenerating...';
    button.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/dinners/${mealId}/regenerate`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Failed to regenerate meal');
        }

        const updatedPlan = await response.json();
        currentPlanData = updatedPlan;

        // Re-render plan
        renderMealPlan(updatedPlan);

    } catch (error) {
        console.error('Error regenerating meal:', error);
        alert('Failed to regenerate meal');
    } finally {
        // Restore button state
        button.textContent = originalText;
        button.disabled = false;
    }
}

async function loadMealPlan(planId) {
    try {
        const response = await fetch(`${API_BASE}/api/dinners/plan/${planId}`);

        if (!response.ok) {
            throw new Error('Failed to load meal plan');
        }

        const plan = await response.json();
        currentPlanId = plan.id;
        currentPlanData = plan;

        // Show plan display
        document.getElementById('plan-setup').style.display = 'none';
        document.getElementById('plan-display').style.display = 'block';

        renderMealPlan(plan);

    } catch (error) {
        console.error('Error loading meal plan:', error);
        document.getElementById('plan-error').style.display = 'block';
    }
}

// Shopping List Page Functions
function initializeShoppingListPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan_id');

    if (!planId) {
        document.getElementById('shopping-loading').style.display = 'none';
        document.getElementById('shopping-error').style.display = 'block';
        return;
    }

    loadShoppingList(planId);

    // Print functionality
    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();
    });

    // Export functionality (simple text export)
    document.getElementById('export-btn').addEventListener('click', () => {
        const items = document.querySelectorAll('.shopping-item');
        let text = 'Shopping List\n\n';

        items.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const label = item.querySelector('span');
            const checked = checkbox.checked ? '[x]' : '[ ]';
            text += `${checked} ${label.textContent}\n`;
        });

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shopping-list.txt';
        a.click();
        URL.revokeObjectURL(url);
    });
}

async function loadShoppingList(planId) {
    try {
        // First generate the shopping list
        await fetch(`${API_BASE}/api/shopping-list/generate/${planId}`, {
            method: 'POST'
        });

        // Then load it
        const response = await fetch(`${API_BASE}/api/shopping-list/${planId}`);

        if (!response.ok) {
            throw new Error('Failed to load shopping list');
        }

        const data = await response.json();
        renderShoppingList(data.items);

    } catch (error) {
        console.error('Error loading shopping list:', error);
        document.getElementById('shopping-loading').style.display = 'none';
        document.getElementById('shopping-error').style.display = 'block';
    }
}

function renderShoppingList(items) {
    const loadingDiv = document.getElementById('shopping-loading');
    const contentDiv = document.getElementById('shopping-content');
    const listDiv = document.getElementById('shopping-list');
    const totalSpan = document.getElementById('total-items');

    loadingDiv.style.display = 'none';
    contentDiv.style.display = 'block';

    // Group items by category
    const categories = {};
    items.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });

    listDiv.innerHTML = '';

    Object.keys(categories).sort().forEach(category => {
        const section = document.createElement('div');
        section.className = 'category-section';

        section.innerHTML = `
            <h4>${category}</h4>
            ${categories[category].map(item => `
                <div class="shopping-item ${item.checked ? 'completed' : ''}">
                    <input type="checkbox" id="item-${item.id}" ${item.checked ? 'checked' : ''}
                           onchange="updateShoppingItem(${item.id}, this.checked)">
                    <span>${item.quantity} ${item.ingredient_name}</span>
                </div>
            `).join('')}
        `;

        listDiv.appendChild(section);
    });

    totalSpan.textContent = items.length;
}

// Update shopping item checked status
async function updateShoppingItem(itemId, checked) {
    try {
        await fetch(`${API_BASE}/api/shopping-list/item/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ checked })
        });

        // Update UI
        const itemDiv = document.getElementById(`item-${itemId}`).closest('.shopping-item');
        if (checked) {
            itemDiv.classList.add('completed');
        } else {
            itemDiv.classList.remove('completed');
        }

    } catch (error) {
        console.error('Error updating shopping item:', error);
        // Revert checkbox
        document.getElementById(`item-${itemId}`).checked = !checked;
    }
}

// Favorites Functions
async function renderRecipeCardWithFavorite(recipe, source) {
    // Check if recipe is already favorited
    let isFavorited = false;
    try {
        const response = await fetch(`${API_BASE}/api/favorites/check/${encodeURIComponent(recipe.name)}`);
        if (response.ok) {
            const data = await response.json();
            isFavorited = data.is_favorited;
        }
    } catch (error) {
        console.error('Error checking favorite status:', error);
    }

    const favoriteBtnText = isFavorited ? '⭐ Favorited' : '☆ Add to Favorites';
    const favoriteBtnClass = isFavorited ? 'btn-secondary' : 'btn-success';

    return `
        <div class="recipe-header">
            <h3>${recipe.name}</h3>
            <button class="btn btn-small ${favoriteBtnClass}" onclick="toggleFavorite('${recipe.name.replace(/'/g, "\\'")}', '${source}')">
                ${favoriteBtnText}
            </button>
        </div>
        <p class="description">${recipe.description}</p>
        <div class="meta">
            <span>⏱️ Prep: ${recipe.prep_time}</span>
            <span>🔥 Cook: ${recipe.cook_time}</span>
            <span>🍽️ Serves: ${recipe.servings}</span>
        </div>

        <h4>Ingredients:</h4>
        <ul>
            ${recipe.ingredients.map(ing => `<li>${ing.quantity} ${ing.name}</li>`).join('')}
        </ul>

        <h4>Instructions:</h4>
        <ol>
            ${recipe.instructions.map(inst => `<li>${inst}</li>`).join('')}
        </ol>
    `;
}

async function toggleFavorite(recipeName, source) {
    try {
        // Check current favorite status
        const checkResponse = await fetch(`${API_BASE}/api/favorites/check/${encodeURIComponent(recipeName)}`);
        const checkData = await checkResponse.json();

        if (checkData.is_favorited) {
            // Remove from favorites
            const favoritesResponse = await fetch(`${API_BASE}/api/favorites`);
            const favoritesData = await favoritesResponse.json();

            const favorite = favoritesData.favorites.find(f => f.name === recipeName);
            if (favorite) {
                await fetch(`${API_BASE}/api/favorites/${favorite.id}`, {
                    method: 'DELETE'
                });
                alert('Recipe removed from favorites!');
            }
        } else {
            // Add to favorites using current recipe data
            if (currentRecipe && currentRecipe.name === recipeName) {
                const favoriteData = {
                    name: currentRecipe.name,
                    description: currentRecipe.description,
                    ingredients: JSON.stringify(currentRecipe.ingredients),
                    instructions: JSON.stringify(currentRecipe.instructions),
                    prep_time: currentRecipe.prep_time,
                    cook_time: currentRecipe.cook_time,
                    servings: currentRecipe.servings,
                    difficulty: currentRecipe.difficulty || 'Medium',
                    source: source
                };

                const addResponse = await fetch(`${API_BASE}/api/favorites`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(favoriteData)
                });

                if (addResponse.ok) {
                    alert('Recipe added to favorites!');
                } else {
                    alert('Error adding recipe to favorites.');
                }
            } else {
                alert('Recipe data not available. Please search for the recipe again.');
            }
        }

        // Refresh the current view
        location.reload();

    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Error updating favorites. Please try again.');
    }
}

async function loadFavorites(searchTerm = null) {
    const resultsDiv = document.getElementById('recipe-results');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const recipeCard = document.getElementById('recipe-card');

    // Show loading
    resultsDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'block';

    try {
        const url = searchTerm
            ? `${API_BASE}/api/favorites?search=${encodeURIComponent(searchTerm)}`
            : `${API_BASE}/api/favorites`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to load favorites');
        }

        const data = await response.json();
        const favorites = data.favorites;

        if (favorites.length === 0) {
            recipeCard.innerHTML = '<p>No favorite recipes found. Try searching for recipes and adding them to favorites!</p>';
        } else {
            // Display favorites as a list with full recipe details
            let html = '<h3>Your Favorite Recipes</h3>';
            favorites.forEach(favorite => {
                // Parse ingredients and instructions from JSON
                let ingredients = [];
                let instructions = [];
                try {
                    ingredients = JSON.parse(favorite.ingredients);
                    instructions = JSON.parse(favorite.instructions);
                } catch (e) {
                    console.error('Error parsing recipe data:', e);
                }

                html += `
                    <div class="favorite-recipe-card" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <h4>${favorite.name}</h4>
                            <button class="btn btn-small btn-secondary" onclick="removeFavorite(${favorite.id})">🗑️ Remove</button>
                        </div>
                        <p class="description">${favorite.description}</p>
                        <div class="meta">
                            <span>⏱️ Prep: ${favorite.prep_time}</span>
                            <span>🔥 Cook: ${favorite.cook_time}</span>
                            <span>🍽️ Serves: ${favorite.servings}</span>
                            <span>📊 ${favorite.difficulty}</span>
                        </div>

                        <div class="recipe-actions" style="margin: 15px 0; display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn btn-small btn-info" onclick="scaleRecipe(${favorite.id}, '${favorite.name.replace(/'/g, "\\'")}')">📏 Scale Recipe</button>
                            <button class="btn btn-small btn-success" onclick="regenerateAttributes(${favorite.id}, '${favorite.name.replace(/'/g, "\\'")}')">🔄 Modify Recipe</button>
                            <button class="btn btn-small btn-warning" onclick="createVariant(${favorite.id}, '${favorite.name.replace(/'/g, "\\'")}')">🎨 Create Variant</button>
                        </div>

                        <h5>Ingredients:</h5>
                        <ul style="margin-bottom: 15px;">
                            ${ingredients.map(ing => `<li>${ing.quantity || ''} ${ing.name || ing}</li>`).join('')}
                        </ul>

                        <h5>Instructions:</h5>
                        <ol style="margin-bottom: 15px;">
                            ${instructions.map(inst => `<li>${inst}</li>`).join('')}
                        </ol>

                        <small>Added: ${new Date(favorite.created_at).toLocaleDateString()}</small>
                    </div>
                `;
            });
            recipeCard.innerHTML = html;
        }

        resultsDiv.style.display = 'block';

    } catch (error) {
        console.error('Error loading favorites:', error);
        errorDiv.style.display = 'block';
    } finally {
        loadingDiv.style.display = 'none';
    }
}

async function removeFavorite(recipeId) {
    if (confirm('Are you sure you want to remove this recipe from favorites?')) {
        try {
            const response = await fetch(`${API_BASE}/api/favorites/${recipeId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Recipe removed from favorites!');
                // Reload favorites
                const searchInput = document.getElementById('favorites-search');
                const searchTerm = searchInput ? searchInput.value.trim() : null;
                await loadFavorites(searchTerm);
            } else {
                alert('Error removing recipe from favorites.');
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
            alert('Error removing recipe from favorites.');
        }
    }
}

// Utility Functions
function renderRecipeCard(recipe) {
    return `
        <h3>${recipe.name}</h3>
        <p class="description">${recipe.description}</p>
        <div class="meta">
            <span>⏱️ Prep: ${recipe.prep_time}</span>
            <span>🔥 Cook: ${recipe.cook_time}</span>
            <span>🍽️ Serves: ${recipe.servings}</span>
        </div>

        <h4>Ingredients:</h4>
        <ul>
            ${recipe.ingredients.map(ing => `<li>${ing.quantity} ${ing.name}</li>`).join('')}
        </ul>

        <h4>Instructions:</h4>
        <ol>
            ${recipe.instructions.map(inst => `<li>${inst}</li>`).join('')}
        </ol>
    `;
}

// View full recipe in modal
function viewFullRecipe(mealId) {
    // Find the meal in current plan data
    const meal = currentPlanData.meals.find(m => m.id === mealId);
    if (!meal) {
        alert('Meal not found');
        return;
    }

    const ingredients = JSON.parse(meal.recipe_ingredients);
    const instructions = JSON.parse(meal.recipe_instructions);

    // Create modal HTML
    const modalHtml = `
        <div id="recipe-modal" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; overflow-y: auto;">
            <div style="background: white; margin: 5% auto; padding: 20px; border-radius: 8px; max-width: 800px; max-height: 90%; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                    <h2>${meal.recipe_name}</h2>
                    <button onclick="closeRecipeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>

                <p class="description" style="font-style: italic; margin-bottom: 15px;">${meal.recipe_description}</p>

                <div class="meta" style="margin-bottom: 20px;">
                    <span>⏱️ Prep: ${meal.prep_time}</span>
                    <span style="margin-left: 15px;">🔥 Cook: ${meal.cook_time}</span>
                    <span style="margin-left: 15px;">🍽️ Serves: ${meal.servings}</span>
                </div>

                <h3>Ingredients:</h3>
                <ul style="margin-bottom: 20px;">
                    ${ingredients.map(ing => `<li>${ing.quantity} ${ing.name}</li>`).join('')}
                </ul>

                <h3>Instructions:</h3>
                <ol style="line-height: 1.6;">
                    ${instructions.map(inst => `<li style="margin-bottom: 8px;">${inst}</li>`).join('')}
                </ol>

                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="closeRecipeModal()" class="btn btn-primary">Close</button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('recipe-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Close recipe modal
function closeRecipeModal() {
    const modal = document.getElementById('recipe-modal');
    if (modal) {
        modal.remove();
    }
}

// Recipe Scaling Function
async function scaleRecipe(recipeId, recipeName) {
    const targetServings = prompt(`Scale "${recipeName}" to how many servings?`, '4');

    if (!targetServings || isNaN(targetServings) || targetServings < 1) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/recipes/scale`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipe_id: recipeId,
                target_servings: parseInt(targetServings)
            })
        });

        if (!response.ok) {
            throw new Error('Failed to scale recipe');
        }

        const scaledRecipe = await response.json();

        // Show the scaled recipe in a modal
        showRecipeModal(scaledRecipe, 'Scaled Recipe');

    } catch (error) {
        console.error('Error scaling recipe:', error);
        alert('Failed to scale recipe. Please try again.');
    }
}

// Recipe Attribute Regeneration Function
async function regenerateAttributes(recipeId, recipeName) {
    const attributes = ['ingredients', 'instructions', 'cooking_method', 'cuisine', 'difficulty'];
    const selectedAttributes = prompt(
        `Which attributes of "${recipeName}" would you like to regenerate?\n\nAvailable options:\n${attributes.join(', ')}\n\nEnter comma-separated values (e.g., "ingredients,instructions"):`
    );

    if (!selectedAttributes) {
        return;
    }

    const attributesList = selectedAttributes.split(',').map(a => a.trim().toLowerCase()).filter(a => attributes.includes(a));

    if (attributesList.length === 0) {
        alert('No valid attributes selected.');
        return;
    }

    const preferences = prompt('Any specific preferences for the regeneration? (optional):', '');

    try {
        const response = await fetch(`${API_BASE}/api/recipes/regenerate-attributes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipe_id: recipeId,
                attributes: attributesList,
                preferences: preferences || null
            })
        });

        if (!response.ok) {
            throw new Error('Failed to regenerate recipe attributes');
        }

        const regeneratedRecipe = await response.json();

        // Show the regenerated recipe in a modal
        showRecipeModal(regeneratedRecipe, 'Regenerated Recipe');

    } catch (error) {
        console.error('Error regenerating recipe attributes:', error);
        alert('Failed to regenerate recipe attributes. Please try again.');
    }
}

// Recipe Variant Creation Function
async function createVariant(recipeId, recipeName) {
    const variantTypes = ['healthier', 'spicier', 'simpler', 'gourmet', 'budget', 'vegetarian', 'vegan', 'gluten_free', 'low_carb'];
    const selectedType = prompt(
        `Create a variant of "${recipeName}".\n\nAvailable types:\n${variantTypes.join(', ')}\n\nEnter variant type:`,
        'healthier'
    );

    if (!selectedType || !variantTypes.includes(selectedType.toLowerCase())) {
        alert('Invalid variant type selected.');
        return;
    }

    const preferences = prompt('Any specific preferences for this variant? (optional):', '');

    try {
        const response = await fetch(`${API_BASE}/api/recipes/create-variant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipe_id: recipeId,
                variation_type: selectedType.toLowerCase(),
                preferences: preferences || null
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create recipe variant');
        }

        const variantRecipe = await response.json();

        // Show the variant recipe in a modal
        showRecipeModal(variantRecipe, 'Recipe Variant');

    } catch (error) {
        console.error('Error creating recipe variant:', error);
        alert('Failed to create recipe variant. Please try again.');
    }
}

// Helper function to show recipe in modal
function showRecipeModal(recipe, title) {
    const modalHtml = `
        <div id="recipe-modal" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; overflow-y: auto;">
            <div style="background: white; margin: 5% auto; padding: 20px; border-radius: 8px; max-width: 800px; max-height: 90%; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                    <h2>${title}: ${recipe.name}</h2>
                    <button onclick="closeRecipeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>

                <p class="description" style="font-style: italic; margin-bottom: 15px;">${recipe.description}</p>

                <div class="meta" style="margin-bottom: 20px;">
                    <span>⏱️ Prep: ${recipe.prep_time}</span>
                    <span style="margin-left: 15px;">🔥 Cook: ${recipe.cook_time}</span>
                    <span style="margin-left: 15px;">🍽️ Serves: ${recipe.servings}</span>
                    <span style="margin-left: 15px;">📊 ${recipe.difficulty}</span>
                </div>

                <h3>Ingredients:</h3>
                <ul style="margin-bottom: 20px;">
                    ${recipe.ingredients.map(ing => `<li>${ing.quantity} ${ing.name}</li>`).join('')}
                </ul>

                <h3>Instructions:</h3>
                <ol style="line-height: 1.6;">
                    ${recipe.instructions.map(inst => `<li style="margin-bottom: 8px;">${inst}</li>`).join('')}
                </ol>

                <div style="margin-top: 20px; text-align: center; display: flex; gap: 10px; justify-content: center;">
                    <button onclick="addToFavorites('${recipe.name.replace(/'/g, "\\'")}', ${JSON.stringify(recipe).replace(/'/g, "\\'")})" class="btn btn-success">☆ Add to Favorites</button>
                    <button onclick="closeRecipeModal()" class="btn btn-primary">Close</button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('recipe-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Add recipe to favorites from modal
async function addToFavorites(recipeName, recipeData) {
    try {
        const recipe = JSON.parse(recipeData);
        const favoriteData = {
            name: recipe.name,
            description: recipe.description,
            ingredients: JSON.stringify(recipe.ingredients),
            instructions: JSON.stringify(recipe.instructions),
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            servings: recipe.servings,
            difficulty: recipe.difficulty || 'Medium',
            source: 'variant'
        };

        const response = await fetch(`${API_BASE}/api/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(favoriteData)
        });

        if (response.ok) {
            alert('Recipe variant added to favorites!');
            closeRecipeModal();
        } else {
            alert('Error adding recipe to favorites.');
        }

    } catch (error) {
        console.error('Error adding to favorites:', error);
        alert('Error adding recipe to favorites.');
    }
}

// Modal functionality for meal details (if needed)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-modal')) {
        document.getElementById('meal-modal').style.display = 'none';
    }
});
