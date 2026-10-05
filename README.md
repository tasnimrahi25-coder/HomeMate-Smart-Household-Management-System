🏠 HomeMate — Smart Household Management System
One place to manage your kitchen, groceries, food waste, expenses, chores, maintenance and bills.

📖 About the Project
HomeMate is a web-based, centralized household management application that helps families organize everyday home activities in a single platform.

Instead of using a notes app for groceries, a calculator for expenses, a calendar for bills and a group chat for chores, HomeMate brings everything together and connects these activities, so that one action automatically helps another.

It is built as a group project using HTML, CSS and JavaScript for the web interface and Firebase for authentication and data storage.

📑 Table of Contents
The Problem
Our Solution
Key Features (Modules)
How the Modules Work Together
Technology Stack
System Architecture
Project Structure
Usage Guide
Team Members & Responsibilities
Future Improvements
License

❗ The Problem
Managing a home involves many small tasks that are easy to forget or handle badly:

🍳 Cooking: People often ask "What should we cook today?" and do not know which ingredients are available at home.
🛒 Groceries: Items get forgotten, duplicates are bought, and essentials run out.
⏰ Food expiry: Food spoils before it is used, causing waste and lost money.
💰 Expenses: There is no clear picture of how much is spent on groceries and household needs.
🧹 Chores: It is unclear who is responsible for which task and by when.
🛠️ Maintenance: Appliance servicing is missed until something breaks.
💡 Bills: Payments are late because due dates are forgotten.
Most existing tools solve only one of these problems, so families end up juggling many different apps.

💡 Our Solution
HomeMate provides six connected modules inside one system.

Data from one module feeds the others. For example, an ingredient close to expiry can trigger a recipe suggestion, which can add missing items to the shopping list, which then records an expense once purchased.

✨ Key Features (Modules)
1. 🍳 Kitchen & Recipe
Track ingredients available at home (name, quantity, unit, category)
Recommend recipes based on the ingredients you already have
Show missing ingredients for any recipe
Search and filter recipes by ingredient, category or cooking time

2. 🛒 Grocery Management
Create, edit and delete shopping lists
Automatically detect low-stock items (below a set limit)
Automatically add missing recipe ingredients to the shopping list
Mark items as purchased and move them into the kitchen inventory

3. 🥦 Food Waste Prevention
Track expiry dates of stored food
Alert users about food that is expiring soon
Manage leftovers so they are used before they spoil
Clearly highlight expired items
  
4. 💰 Expense Management
Record grocery and household expenses
Set a monthly budget
Track total spending and remaining budget automatically
Filter expenses by date range and category
   
5. 🧹 Household Tasks
Assign chores to family members
Set deadlines and priorities
Mark tasks as completed
Filter tasks by member, status or deadline
   
6. 🛠️ Maintenance & Bills
Track appliance maintenance history
Set service reminders (for example, AC servicing or water filter change)
Track household bills (electricity, gas, water, internet) and their due dates
Mark bills as paid or unpaid

   
📊 Dashboard
A single overview screen showing items expiring soon, low-stock items, budget used and remaining, pending chores, upcoming bills and maintenance reminders.

🔄 How the Modules Work Together
Example workflow:

Milk is expiring soon.
HomeMate alerts the user (Food Waste Prevention).
It suggests recipes that use milk (Kitchen & Recipe).
Missing ingredients are added to the shopping list automatically (Grocery Management).
After shopping, the expense is recorded (Expense Management).
The budget and dashboard update instantly.
HomeMate is not just a collection of separate features. It is one connected household system.

🧰 Technology Stack
HTML5 — page structure and content
CSS3 — layout, responsive design and styling
JavaScript (ES6+) — interactivity, calculations, reminders and DOM handling
Firebase Firestore — cloud database for all app data
Firebase Authentication — secure user sign-up and login
API integration — connecting the app with external and backend data
Core technical concepts used
Database and cloud storage
User authentication
CRUD operations (Create, Read, Update, Delete)
Filtering and searching
Calculations (budget, remaining balance, totals, stock levels)
Date-based reminders and expiry detection
Dashboards and summaries


🏗️ System Architecture
HomeMate is made of three connected parts:

Frontend (browser): HTML, CSS and JavaScript pages that the user sees and interacts with.
Firebase Authentication: handles user sign-up and login.
Firebase Firestore: stores all household data.
API: connects the app with external and backend data.
The browser talks to Firebase Authentication to log users in, reads and writes household data in Firestore, and uses the API to fetch or send additional data.


📁 Project Structure
HomeMate/
│
├── index.html           Landing / login page
├── dashboard.html       Main dashboard
├── kitchen.html         Kitchen & Recipe module
├── grocery.html         Grocery Management module
├── food-waste.html      Food Waste Prevention module
├── expenses.html        Expense Management module
├── tasks.html           Household Tasks module
├── maintenance.html     Maintenance & Bills module
│
├── css/                 Stylesheets
├── js/                  JavaScript files
├── assets/              Images and icons
│
└── README.md


🧭 Usage Guide
Sign up or log in to your household account.
Add ingredients you have at home in the Kitchen module, including expiry dates.
Check the Dashboard to see expiring items, low stock, budget and pending tasks.
Open Recipes to see what you can cook and which ingredients are missing.
Add missing items to the Shopping List (automatic or manual).
After shopping, record the expense and update your inventory.
Assign chores to family members and track completion.
Add appliance maintenance and bills with due dates to receive reminders.


👥 Team Members & Responsibilities
Syeda Tasnim Rahman — Project Leader
Overall project management, planning, task distribution, coordination between team members, timeline tracking, final integration and review.


Afia Muazzama — Database
Designing the Firebase Firestore structure, collections and relationships, managing authentication data, and handling data operations (CRUD).


Moumita Helen Lisa — Frontend
Designing and building the user interface with HTML, CSS and JavaScript, responsive layouts, forms, dashboard UI and user experience.


Sadia Salsabil Samiha — API
Developing and integrating APIs, connecting the frontend with data sources, and handling requests and responses between modules.


The team works together so that the database, frontend and API layers connect smoothly, with the project leader coordinating progress and making sure all six modules are delivered and integrated.

🔮 Future Improvements
📱 Mobile app version or Progressive Web App (PWA)
🔔 Push, email or SMS notifications for reminders
📷 Barcode scanning for adding groceries
📈 Charts for monthly spending and waste reports
🌐 Multi-language support (including Bangla)
🤖 Smarter, AI-based recipe suggestions
👨‍👩‍👧 Multiple households and role-based permissions


📄 License
This project is developed for educational purposes.
