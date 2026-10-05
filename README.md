# 🏠 HomeMate — Smart Household Management System

> One place to manage your kitchen, groceries, food waste, expenses, chores, maintenance and bills.



## 📖 About the Project

**HomeMate** is a web-based, centralized household management application that helps families organize everyday home activities in a single platform. Instead of using a notes app for groceries, a calculator for expenses, a calendar for bills and a group chat for chores, HomeMate brings everything together and **connects** these activities so that one action automatically helps another.

It is built as a group project using **HTML, CSS and JavaScript** for the web interface and **Firebase** for authentication and data storage.



## 📑 Table of Contents

1. [The Problem](#-the-problem)
2. [Our Solution](#-our-solution)
3. [Key Features (Modules)](#-key-features-modules)
4. [How the Modules Work Together](#-how-the-modules-work-together)
5. [Technology Stack](#-technology-stack)
6. [System Architecture](#-system-architecture)
7. [Project Structure](#-project-structure)
8. [Usage Guide](#-usage-guide)
9. [Team Members & Responsibilities](#-team-members--responsibilities)
10. [Future Improvements](#-future-improvements)
11. [License](#-license)



## ❗ The Problem

Managing a home involves many small tasks that are easy to forget or handle badly:

| Area | Everyday Problem |
|------|------------------|
| 🍳 Cooking | "What should we cook today?" and not knowing which ingredients are at home |
| 🛒 Groceries | Forgetting items, buying duplicates, running out of essentials |
| ⏰ Food expiry | Food spoils before it is used, causing waste and lost money |
| 💰 Expenses | No clear picture of how much is spent on groceries and household needs |
| 🧹 Chores | Unclear who is responsible for which task and by when |
| 🛠️ Maintenance | Appliance servicing is missed until something breaks |
| 💡 Bills | Late payments because due dates are forgotten |

Most existing tools solve **only one** of these problems, so families end up juggling many apps.



## 💡 Our Solution

HomeMate provides **six connected modules** inside one system. Data from one module feeds the others — for example, an ingredient close to expiry can trigger a recipe suggestion, which can add missing items to the shopping list, which then records an expense once purchased.



## ✨ Key Features (Modules)

### 1. 🍳 Kitchen & Recipe
- Track ingredients available at home (name, quantity, unit, category)
- Recommend recipes based on the ingredients you already have
- Show **missing ingredients** for any recipe
- Search and filter recipes (e.g., by ingredient, category or cooking time)

### 2. 🛒 Grocery Management
- Create, edit and delete shopping lists
- Automatically detect **low-stock items** (below a set threshold)
- Automatically add missing recipe ingredients to the shopping list
- Mark items as purchased and move them into the kitchen inventory

### 3. 🥦 Food Waste Prevention
- Track expiry dates of stored food
- Alert users about food that is **expiring soon**
- Manage leftovers so they are used before they spoil
- Highlight expired items clearly

### 4. 💰 Expense Management
- Record grocery and household expenses
- Set a **monthly budget**
- Track total spending and **remaining budget** automatically
- Filter expenses by date range and category

### 5. 🧹 Household Tasks
- Assign chores to family members
- Set deadlines and priorities
- Mark tasks as completed
- Filter tasks by member, status or deadline

### 6. 🛠️ Maintenance & Bills
- Track appliance maintenance history
- Set **service reminders** (e.g., AC servicing, water filter change)
- Track household bills (electricity, gas, water, internet, etc.) and their due dates
- Mark bills as paid / unpaid

### 📊 Dashboard
A single overview screen showing: items expiring soon, low-stock items, budget used vs. remaining, pending chores, upcoming bills and maintenance reminders.



## 🔄 How the Modules Work Together

**Example workflow:**

```
Milk is expiring soon
        │
        ▼
HomeMate alerts the user  (Food Waste Prevention)
        │
        ▼
Suggests recipes that use milk  (Kitchen & Recipe)
        │
        ▼
Missing ingredients are added automatically  (Grocery Management)
        │
        ▼
Items are bought and the expense is recorded  (Expense Management)
        │
        ▼
Budget and dashboard update instantly
```

That is the core idea: HomeMate is **not just a collection of separate features** — it is one connected household system.



## 🧰 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Structure | **HTML5** | Page structure and content |
| Styling | **CSS3** | Layout, responsive design, theming |
| Logic | **JavaScript (ES6+)** | Interactivity, calculations, reminders, DOM handling |
| Database | **Firebase Firestore** | Cloud NoSQL database for all app data |
| Authentication | **Firebase Authentication** | Secure user sign-up and login |
| API | API integration | Connecting the app with external/backend data |

### Core technical concepts used

- Database and cloud storage
- User authentication
- **CRUD** operations (Create, Read, Update, Delete)
- Filtering and searching
- Calculations (budget, remaining balance, totals, stock levels)
- Date-based reminders and expiry detection
- Dashboards and summaries



## 🏗️ System Architecture

```
┌──────────────────────────────────────────────┐
│                Web Browser (Client)          │
│   HTML  +  CSS  +  JavaScript                │
│  ┌────────────┐  ┌────────────┐              │
│  │   UI Pages │  │ JS Modules │              │
│  └─────┬──────┘  └─────┬──────┘              │
└────────┼───────────────┼─────────────────────┘
         │               │
         ▼               ▼
┌──────────────────┐  ┌──────────────────────┐
│ Firebase Auth    │  │ API                  │
│ (login / signup) │  │                      │
└────────┬─────────┘  └──────────────────────┘
         ▼
┌──────────────────────────────────────────────┐
│          Firebase Firestore Database         │
└──────────────────────────────────────────────┘




## 📁 Project Structure


HomeMate/
│
├── index.html              # Landing / login page
├── dashboard.html          # Main dashboard
├── kitchen.html            # Kitchen & Recipe module
├── grocery.html            # Grocery Management module
├── food-waste.html         # Food Waste Prevention module
├── expenses.html           # Expense Management module
├── tasks.html              # Household Tasks module
├── maintenance.html        # Maintenance & Bills module
│
├── css/                    # Stylesheets
├── js/                     # JavaScript modules (auth, Firebase, API, each module)
├── assets/                 # Images and icons
│
└── README.md
```



## 🧭 Usage Guide

1. **Sign up / Log in** to your household account.
2. **Add ingredients** you have at home in the Kitchen module, including expiry dates.
3. Check the **Dashboard** to see expiring items, low stock, budget and pending tasks.
4. Open **Recipes** to see what you can cook and which ingredients are missing.
5. Add missing items to the **Shopping List** (automatic or manual).
6. After shopping, **record the expense** and update your inventory.
7. Assign **chores** to family members and track completion.
8. Add **appliance maintenance** and **bills** with due dates to receive reminders.



## 👥 Team Members & Responsibilities

| Member | Role | Responsibilities |
|--------|------|------------------|
| **Syeda Tasnim Rahman** | Project Leader | Overall project management, planning, task distribution, coordination between team members, timeline tracking, final integration and review |
| **Afia Muazzama** | Database | Designing the Firebase Firestore structure, collections and relationships, managing authentication data, handling data operations (CRUD) |
| **Moumita Helen Lisa** | Frontend | Designing and building the user interface with HTML, CSS and JavaScript, responsive layouts, forms, dashboard UI and user experience |
| **Sadia Salsabil Samiha** | API | Developing and integrating APIs, connecting the frontend with data sources, handling requests and responses between modules |

The team works together so that the **database**, **frontend** and **API** layers connect smoothly, with the project leader coordinating progress and ensuring all six modules are delivered and integrated.



## 🔮 Future Improvements

- 📱 Mobile app version / Progressive Web App (PWA)
- 🔔 Push, email or SMS notifications for reminders
- 📷 Barcode scanning for adding groceries
- 📈 Charts for monthly spending and waste reports
- 🌐 Multi-language support (including Bangla)
- 🤖 Smarter, AI-based recipe suggestions
- 👨‍👩‍👧 Multiple households and role-based permissions

---

## 📄 License

This project is developed for educational purposes.
