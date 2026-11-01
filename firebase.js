/**
 * HomeMate — central Firebase layer
 * ---------------------------------
 * Every feature module (grocery list, budget tracker, expense tracker,
 * dashboard, login/register) talks to Firebase through this single file.
 *
 * Firestore layout (all data is private to the signed-in user):
 *   users/{uid}                  -> profile + monthlyBudget
 *   users/{uid}/groceries/{id}   -> grocery list items
 *   users/{uid}/expenses/{id}    -> every expense (all modules write here)
 *   users/{uid}/income/{id}      -> income entries from the budget tracker
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7FF_BSHY_fIzHFyj10dC6sVF3cwrI9QE",
  authDomain: "homemate-b52d6.firebaseapp.com",
  projectId: "homemate-b52d6",
  storageBucket: "homemate-b52d6.firebasestorage.app",
  messagingSenderId: "34172977033",
  appId: "1:34172977033:web:1a9c93fa8914e06a426b58"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const projectUrl = (path) => new URL(path, import.meta.url).href;

/** Absolute URLs so modules in different folders never build a bad link. */
export const routes = {
  home: projectUrl("index.html"),
  login: projectUrl("login-register/index.html"),
  dashboard: projectUrl("Dashboard/index.html"),
  grocery: projectUrl("grocery list/index.html"),
  budget: projectUrl("Budget_trecker/index.html"),
  expenses: projectUrl("expense trecker/index2.html"),
  maintenance: projectUrl("Maintainance/index.html"),
  profile: projectUrl("Profile/index.html")
};

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function registerUser({ name, email, password }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim();

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

  if (cleanName) {
    await updateProfile(credential.user, { displayName: cleanName });
  }

  // Create the user's profile document. Monthly budget starts at 8000 Taka.
  await setDoc(
    doc(db, "users", credential.user.uid),
    {
      name: cleanName,
      email: cleanEmail,
      monthlyBudget: 8000,
      createdAt: serverTimestamp()
    },
    { merge: true }
  );

  return credential.user;
}

export async function loginUser({ email, password, remember = true }) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const credential = await signInWithEmailAndPassword(auth, String(email || "").trim(), password);
  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, String(email || "").trim());
}

/**
 * Redirects to the login page when nobody is signed in.
 * Resolves with the current user (or null when a redirect happened).
 */
export function requireAuth() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (!user) {
        const next = encodeURIComponent(window.location.href);
        window.location.replace(`${routes.login}?next=${next}`);
        resolve(null);
        return;
      }
      resolve(user);
    });
  });
}

/** Used by the login page: skip the form when the user is already signed in. */
export function redirectIfLoggedIn() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        window.location.replace(routes.dashboard);
        resolve(null);
        return;
      }
      resolve(null);
    });
  });
}

export function authErrorMessage(error) {
  const code = error?.code || "";
  const messages = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-login-credentials": "Email or password is incorrect.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters long.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/missing-password": "Please enter your password.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase yet.",
    "auth/configuration-not-found": "Firebase Authentication is not set up for this project. Enable Email/Password sign-in in the Firebase console.",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "The Firebase API key is invalid. Copy the current web app config into firebase.js."
  };
  return messages[code] || error?.message || "Something went wrong. Please try again.";
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export async function getUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;

  const snapshot = await getDoc(doc(db, "users", user.uid));
  if (!snapshot.exists()) {
    return {
      id: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      monthlyBudget: 0
    };
  }

  return { id: snapshot.id, ...snapshot.data() };
}

export async function updateUserProfile(patch) {
  const uid = currentUid();
  await setDoc(doc(db, "users", uid), { ...patch }, { merge: true });
}

export async function updateAccountName(name) {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to update your profile.");

  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Please enter your name.");

  await updateProfile(user, { displayName: cleanName });
  await updateUserProfile({ name: cleanName });
}

/* ------------------------------------------------------------------ */
/* Firestore helpers                                                   */
/* ------------------------------------------------------------------ */

function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to do that.");
  return uid;
}

function userCollection(name) {
  return collection(db, "users", currentUid(), name);
}

const mapSnapshot = (snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

/** Validates a "YYYY-MM-DD" string and returns it unchanged. */
function assertISODate(value, label) {
  const text = String(value || "").trim();
  const parsed = new Date(`${text}T00:00:00`);
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(text) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.getFullYear() === Number(text.slice(0, 4)) &&
    parsed.getMonth() + 1 === Number(text.slice(5, 7)) &&
    parsed.getDate() === Number(text.slice(8, 10));

  if (!valid) throw new Error(`Please choose a valid ${label}.`);
  return text;
}

/** Adds months to a "YYYY-MM-DD" date without rolling into the wrong month. */
function addMonthsISO(value, months) {
  const date = new Date(`${assertISODate(value, "date")}T00:00:00`);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

export function watchGroceries(onNext, onError) {
  return onSnapshot(userCollection("groceries"), (snapshot) => onNext(mapSnapshot(snapshot)), onError);
}

export async function addGrocery({ name, price = 0, date } = {}) {
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Please enter an item name.");

  const cleanDate = String(date || todayISO());
  const parsedDate = new Date(`${cleanDate}T00:00:00`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== Number(cleanDate.slice(0, 4)) ||
    parsedDate.getMonth() + 1 !== Number(cleanDate.slice(5, 7)) ||
    parsedDate.getDate() !== Number(cleanDate.slice(8, 10))
  ) {
    throw new Error("Please choose a valid date.");
  }
  if (cleanDate < todayISO()) {
    throw new Error("Grocery items cannot be added for a past date.");
  }

  const reference = await addDoc(userCollection("groceries"), {
    name: cleanName,
    status: "pending",
    price: Math.max(0, Number(price) || 0),
    date: cleanDate,
    expenseLogged: false,
    createdAt: serverTimestamp()
  });

  return reference.id;
}

export async function updateGrocery(id, patch) {
  await updateDoc(doc(db, "users", currentUid(), "groceries", id), patch);
}

export async function deleteGrocery(id) {
  await deleteDoc(doc(db, "users", currentUid(), "groceries", id));
}

export function watchMaintenance(onNext, onError) {
  return onSnapshot(userCollection("maintenance"), (snapshot) => onNext(mapSnapshot(snapshot)), onError);
}

export async function addMaintenance({ item, lastService = "", nextService, intervalMonths = 6 } = {}) {
  const cleanItem = String(item || "").trim();
  if (!cleanItem) throw new Error("Please enter an appliance name.");

  const interval = Number(intervalMonths);
  if (!Number.isFinite(interval) || interval < 1) {
    throw new Error("Please choose a valid service interval.");
  }

  const cleanLast = lastService ? assertISODate(lastService, "last service date") : "";
  if (cleanLast && cleanLast > todayISO()) {
    throw new Error("The last service date cannot be in the future.");
  }

  const cleanNext = nextService
    ? assertISODate(nextService, "next service date")
    : cleanLast
      ? addMonthsISO(cleanLast, Math.round(interval))
      : "";

  if (!cleanNext) throw new Error("Please choose the next service date.");
  if (cleanLast && cleanNext < cleanLast) {
    throw new Error("The next service date must be after the last service date.");
  }

  const reference = await addDoc(userCollection("maintenance"), {
    item: cleanItem,
    lastService: cleanLast,
    nextService: cleanNext,
    intervalMonths: Math.round(interval),
    createdAt: serverTimestamp()
  });

  return reference.id;
}

export async function updateMaintenance(id, patch = {}) {
  const next = { ...patch };

  if ("lastService" in next) {
    next.lastService = next.lastService ? assertISODate(next.lastService, "last service date") : "";
    if (next.lastService && next.lastService > todayISO()) {
      throw new Error("The last service date cannot be in the future.");
    }
  }
  if ("nextService" in next) {
    next.nextService = assertISODate(next.nextService, "next service date");
  }
  if ("item" in next) {
    const cleanItem = String(next.item || "").trim();
    if (!cleanItem) throw new Error("Please enter an appliance name.");
    next.item = cleanItem;
  }
  if ("intervalMonths" in next) {
    const interval = Number(next.intervalMonths);
    if (!Number.isFinite(interval) || interval < 1) {
      throw new Error("Please choose a valid service interval.");
    }
    next.intervalMonths = Math.round(interval);
  }

  await updateDoc(doc(db, "users", currentUid(), "maintenance", id), next);
}

export async function deleteMaintenance(id) {
  await deleteDoc(doc(db, "users", currentUid(), "maintenance", id));
}

export function watchBills(onNext, onError) {
  return onSnapshot(userCollection("bills"), (snapshot) => onNext(mapSnapshot(snapshot)), onError);
}

export async function addBill({ name, amount, due } = {}) {
  const cleanName = String(name || "").trim();
  const value = Number(amount);
  if (!cleanName) throw new Error("Please enter a bill name.");
  if (!Number.isFinite(value) || value <= 0) throw new Error("Please enter an amount greater than zero.");
  const cleanDue = assertISODate(due, "due date");

  const reference = await addDoc(userCollection("bills"), {
    name: cleanName,
    amount: value,
    due: cleanDue,
    paid: false,
    paidAt: "",
    expenseId: null,
    createdAt: serverTimestamp()
  });

  return reference.id;
}

export async function updateBill(id, patch = {}) {
  const next = { ...patch };

  if ("name" in next) {
    const cleanName = String(next.name || "").trim();
    if (!cleanName) throw new Error("Please enter a bill name.");
    next.name = cleanName;
  }
  if ("amount" in next) {
    const value = Number(next.amount);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Please enter an amount greater than zero.");
    }
    next.amount = value;
  }
  if ("due" in next) {
    next.due = assertISODate(next.due, "due date");
  }

  await updateDoc(doc(db, "users", currentUid(), "bills", id), next);
}

export async function deleteBill(id) {
  await deleteDoc(doc(db, "users", currentUid(), "bills", id));
}

export function watchExpenses(onNext, onError) {
  return onSnapshot(userCollection("expenses"), (snapshot) => onNext(mapSnapshot(snapshot)), onError);
}

/**
 * Every expense in the app lives in one collection, so the expense tracker,
 * budget tracker and dashboard always show the same numbers.
 */
export async function addExpense({ title, category = "Others", amount, date, source = "app" } = {}) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Please enter an amount greater than zero.");
  }

  const cleanCategory = String(category || "Others").trim() || "Others";
  const reference = await addDoc(userCollection("expenses"), {
    title: String(title || "").trim() || `${cleanCategory} expense`,
    category: cleanCategory,
    amount: value,
    date: date || new Date().toISOString().slice(0, 10),
    source,
    createdAt: serverTimestamp()
  });

  return reference.id;
}

export async function deleteExpense(id) {
  await deleteDoc(doc(db, "users", currentUid(), "expenses", id));
}

export function watchIncome(onNext, onError) {
  return onSnapshot(userCollection("income"), (snapshot) => onNext(mapSnapshot(snapshot)), onError);
}

export async function addIncome({ title, amount, date } = {}) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Please enter an amount greater than zero.");
  }

  const reference = await addDoc(userCollection("income"), {
    title: String(title || "").trim() || "Income",
    amount: value,
    date: date || new Date().toISOString().slice(0, 10),
    source: "budget-tracker",
    createdAt: serverTimestamp()
  });

  return reference.id;
}

export async function deleteIncome(id) {
  await deleteDoc(doc(db, "users", currentUid(), "income", id));
}

/* ------------------------------------------------------------------ */
/* Small shared formatting helpers                                     */
/* ------------------------------------------------------------------ */

export function formatTaka(value) {
  return `৳ ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function todayISO() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isCurrentMonth(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
