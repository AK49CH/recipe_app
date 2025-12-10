Recipe AI App

The Recipe AI App generates complete dinner recipes, builds 4-day meal plans, tracks favorites, and produces consolidated shopping lists. It runs locally, uses your GPU through Ollama, and stores structured recipe data in SQLite with SQLAlchemy.

Features
Recipe Search

Enter ingredients and optional preferences.

The app generates a complete dinner recipe with:

Ingredients with quantities and categories

Step-by-step instructions

Prep and cook time

Servings

Difficulty rating

The app stores favorites for later browsing.

4-Day Dinner Planner

Generates four completely different dinner recipes using your preferences and exclusions.

Reject or approve each meal.

Regenerate meals individually if needed.

Stores meal plans in the database with ingredients and instructions normalized into separate tables.

Shopping List Generation

Builds a shopping list from approved meals only.

Consolidates duplicate ingredients across meals.

Merges quantities intelligently using your normalization and unit-handling logic.

Stores shopping list items in the database so the user can check items off over time.

Favorites System

Save any generated recipe to favorites.

Search favorites by name, description, or ingredient text.

Remove favorites when no longer needed.

Technology Overview
Backend

FastAPI for routing and API responses

SQLAlchemy ORM with normalized tables for:

Meal plans

Dinner meals

Recipe ingredients

Recipe instructions

Shopping lists

Favorites

SQLite database (recipe_app.db)

LRU cache for meal plans and favorites

Logging for generation, approval, rejection, and DB updates

AI Engine

Ollama running locally

Model: llama3.2:3b (default)

Prompts enforce:

Valid JSON output

Full instruction detail

Cuisine and ingredient variety for meal plans

Avoidance of excluded ingredients

Frontend

Static HTML/CSS/JS served through FastAPI

Pages:

index.html → home + recipe search

meal-planner.html → 4-day plan UI

shopping-list.html → consolidated list with checkboxes

Uses fetch calls to your API routes

Responsive layout and simple controls for navigation

API Endpoints
Recipes

POST /api/recipes/search
Generate a single recipe from ingredients.

Dinner Plans

POST /api/dinners/generate-plan
Create a new 4-day plan.

GET /api/dinners/plan/{plan_id}
Return a meal plan with meals, ingredients, and instructions.

PUT /api/dinners/{meal_id}/approve
Approve a meal.

PUT /api/dinners/{meal_id}/reject
Reject a meal.

POST /api/dinners/{meal_id}/regenerate
Regenerate a rejected meal.

Shopping List

POST /api/shopping-list/generate/{plan_id}
Create the consolidated list.

GET /api/shopping-list/{plan_id}
Return the list.

PUT /api/shopping-list/item/{item_id}
Check/uncheck an item.

Favorites

POST /api/favorites
Save a recipe.

GET /api/favorites
Retrieve all favorites.

DELETE /api/favorites/{recipe_id}
Remove a favorite.

GET /api/favorites/check/{name}
Check if a recipe is already favorited.

Local Development
Requirements

Python 3.10+

Ollama installed and running

GPU strongly recommended

SQLite included by default

Run the backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

Ollama

Make sure the model is pulled:

ollama pull llama3.2:3b

Frontend

FastAPI serves the pages automatically at:

http://localhost:8000/

http://localhost:8000/meal-planner

http://localhost:8000/shopping-list
