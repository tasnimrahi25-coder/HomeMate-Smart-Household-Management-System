<<<<<<< HEAD
# hommate
=======
# 🏠 HomeMate — Smart Household Management System

> One calm place for your groceries, budget, expenses and household overview.

## 📖 About the Project

**HomeMate** is a web-based household management application that connects everyday money and shopping tasks in one place. Instead of keeping a shopping list in a notes app, a budget in a calculator and a dashboard somewhere else, HomeMate stores everything under one Firebase account so **one action updates every module**.

It is built as a group project with **HTML, CSS and JavaScript (ES modules)** for the interface and **Firebase Authentication + Cloud Firestore** for accounts and data.

## ✨ What Is Included

| Module | Page | What it does |
|--------|------|--------------|
| Landing page | `index.html` | Explains the system and links to every connected module |
| Login / Register | `login-register/index.html` | Firebase email/password sign-up, login, logout and password reset |
| Dashboard | `dashboard/index.html` | Live grocery, budget, spending, category and recent-expense overview |
| Grocery list | `grocery list/index.html` | Add, search, tick off and delete grocery items; purchases become expenses |
| Budget tracker | `Budget_trecker/index.html` | Set a monthly budget, record income and expenses, see the remaining balance |
| Expense tracker | `expense trecker/index2.html` | Add/delete expenses, category totals, donut chart and recent activity |

**Planned but not yet wired to Firebase:** recipe finder, food-waste tracking, chores and maintenance/bills. The `recipe_finder/` folder is a static prototype and is not part of the shared navigation.

## 🔗 How the Modules Work Together

```
Grocery item with a price is ticked as purchased
        ↓
An entry is written to the shared expenses collection
        ↓
Budget tracker recalculates this month's spending
        ↓
Expense tracker and dashboard show the same total
```

- A grocery purchase creates an expense with the category **Grocery**.
- Un-ticking that purchase (or deleting the grocery item) removes its linked expense.
- An expense added in the budget tracker or expense tracker appears in all three money views.
- Income is stored separately and affects the budget tracker balance.
- Every module reads the same `users/{uid}` data, so totals never drift apart.

## 🧰 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Structure | HTML5 | Page structure and forms |
| Styling | CSS3 | Shared design system, responsive layout, dashboard dark theme |
| Logic | JavaScript ES modules | UI behaviour, calculations, live Firestore listeners |
| Auth | Firebase Authentication | Email/password accounts and password reset |
| Database | Cloud Firestore | Per-user groceries, expenses, income and profile |
| Hosting | Any static HTTP server | The app is fully client-side |

## 📁 Project Structure

```
HomeMate/
├── index.html               # Landing page
├── firebase.js              # Single Firebase layer: auth, routes, CRUD, helpers
├── nav.js                   # Shared navbar: mobile menu, active link, user chip, logout
├── styles.css               # Shared design system and landing-page styles
├── app-navigation.css       # Fixed shared navbar + page offsets (loaded last)
├── firestore.rules          # Per-user security rules
├── favicon.svg
├── login-register/
│   ├── index.html
│   ├── script.js            # Login, register, password reset
│   └── style.css
├── dashboard/
│   ├── index.html
│   ├── script.js            # Live stats and dark theme
│   └── style.css
├── grocery list/
│   ├── index.html
│   ├── script.js            # Grocery CRUD + purchase → expense sync
│   └── style.css
├── Budget_trecker/
│   ├── index.html
│   ├── script.js            # Budget, income and expense entry
│   └── style.css
├── expense trecker/
│   ├── index2.html
│   ├── script2.js           # Expense totals, categories, chart, recent list
│   └── style2.css
├── recipe_finder/           # Static prototype (not connected yet)
├── api.js                   # Legacy localStorage mock (unused)
└── app-data.js              # Legacy sample data (unused)
```

> Folder names such as `grocery list` and `expense trecker` contain spaces on purpose. Navigation links URL-encode them (`grocery%20list`, `expense%20trecker`).

## 🔥 Firebase Setup

The app works as soon as it is pointed at a Firebase project with Email/Password auth and Firestore enabled.

### 1. Create a Firebase project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a project (or reuse an existing one).
3. Add a **Web app** and copy the generated configuration.

### 2. Point the app at your project

Open `firebase.js` and replace the `firebaseConfig` object near the top with your own values:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

> The `apiKey` is public by design; access is controlled by Firestore security rules, not by hiding the key.
>
> This repository currently points at the `homemate-52d86` Firebase project. If that is not your project, replace the config above and complete the remaining setup steps for your own project. If you see `auth/configuration-not-found`, the project still needs Email/Password sign-in and Firestore enabled (steps 3 and 4).

### 3. Enable Email/Password sign-in

Firebase Console → **Authentication** → **Sign-in method** → **Email/Password** → Enable → Save.

### 4. Create Firestore and publish the rules

1. Firebase Console → **Firestore Database** → **Create database** (production mode is fine).
2. Open the **Rules** tab.
3. Paste the contents of `firestore.rules` from this project and click **Publish**.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{collectionName}/{documentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

These rules mean a signed-in user can only read and write **their own** household data.

### 5. Allow your development domain

Firebase Console → **Authentication** → **Settings** → **Authorized domains**.

`localhost` is normally allowed already. If you open the app through `127.0.0.1`, add `127.0.0.1` to the list.

### 6. Serve the app over HTTP

ES modules and Firebase Authentication do **not** work when the files are opened with `file://`. Start a local server from the project folder, for example:

```bash
# Option A — VS Code Live Server
# Right-click index.html → "Open with Live Server"

# Option B — Node
npx serve .

# Option C — Python
python -m http.server 5500
```

Then visit the URL printed by the server (for example `http://localhost:5500`).

### 7. Create the first account

Open the login page, choose **Register**, and create an account. A profile document is created automatically with a default monthly budget of **৳ 8,000**. Change it in the budget tracker at any time.

## 🗄️ Firestore Data Model

```
users/{uid}
  name             string
  email            string
  monthlyBudget    number   (default 8000)
  createdAt        timestamp

users/{uid}/groceries/{itemId}
  name             string
  price            number
  date             "YYYY-MM-DD"
  status           "pending" | "purchased"
  expenseLogged    boolean
  expenseId        string | null   (links the purchase to its expense)
  createdAt        timestamp

users/{uid}/expenses/{expenseId}
  title            string
  category         "Food" | "Grocery" | "Bills" | "Others"
  amount           number
  date             "YYYY-MM-DD"
  source           "grocery" | "budget-tracker" | "expense-tracker" | "app"
  createdAt        timestamp

users/{uid}/income/{incomeId}
  title            string
  amount           number
  date             "YYYY-MM-DD"
  source           "budget-tracker"
  createdAt        timestamp
```

## 🚀 Usage Guide

1. **Register or log in** with an email and password.
2. Open the **grocery list** and add an item with an optional price.
3. Tick the item when it is bought. If it has a price, HomeMate records the expense automatically.
4. Open the **budget tracker** to set a monthly budget and add income or extra expenses.
5. Open the **expense tracker** to review category totals, the donut chart and recent spending.
6. Open the **dashboard** for a live overview. Use the moon/sun button to switch themes.

## 🛠️ Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Missing or insufficient permissions` | Firestore rules not published | Paste `firestore.rules` into the Rules tab and publish |
| `auth/operation-not-allowed` | Email/Password provider disabled | Enable it in Authentication → Sign-in method |
| `auth/configuration-not-found` | Authentication is not configured for the project | Enable Email/Password sign-in under Authentication → Sign-in method |
| `auth/api-key-not-valid` | The config belongs to an old or deleted project | Copy the current Web app config from Project settings into `firebase.js` |
| Firestore returns 403 "Cloud Firestore API has not been used" | The database was never created | Create a Firestore database in the same project |
| `auth/unauthorized-domain` | The current host is not allowed | Add the domain under Authentication → Settings → Authorized domains |
| Blank page or redirect loop | Opened with `file://` or wrong config | Serve over HTTP and check `firebaseConfig` |
| Purchase does not create an expense | No price was entered | Add a price greater than zero before ticking the item |
| Login works but data does not load | Rules or database missing | Confirm Firestore was created in the same project |

## 👥 Team Members & Responsibilities

| Member | Role | Responsibilities |
|--------|------|------------------|
| **Syeda Tasnim Rahman** | Project Leader | Planning, task distribution, coordination, timeline tracking, final integration and review |
| **Afia Muazzama** | Database | Firestore structure, collections and relationships, authentication data, CRUD operations |
| **Moumita Helen Lisa** | Frontend | HTML/CSS/JavaScript interface, responsive layouts, forms, dashboard UI and UX |
| **Sadia Salsabil Samiha** | API | Connecting the frontend to data sources, requests/responses between modules, integration support |

## 🔮 Future Improvements

- Connect the recipe finder and let missing ingredients flow into the grocery list
- Food-waste expiry alerts and leftover tracking
- Household chores and maintenance/bill reminders
- Push or email notifications
- Barcode scanning for groceries
- Monthly spending and waste charts
- Multi-household support with role-based permissions
- Bangla language support and a Progressive Web App build

---

## 📄 License

This project was developed for educational purposes.
>>>>>>> 5caafcad7904b8cb41ba1c8f9c3c9c430f8a1d49
