import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjGiCtqfhjrV63QghXjQmZsNzR6HzY1cc",
  authDomain: "homemate-b52d6.firebaseapp.com",
  projectId: "homemate-b52d6",
  storageBucket: "homemate-b52d6.firebasestorage.app",
  messagingSenderId: "34172977033",
  appId: "1:34172977033:web:a8f0b4147e3f233e426b58",
  measurementId: "G-ZNKXVZ86KV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tableBody = document.getElementById("pantryTableBody");
const addBtn = document.getElementById("addBtn");

onSnapshot(collection(db, "pantry_items"), (snapshot) => {
  tableBody.innerHTML = "";
  if (snapshot.empty) {
    tableBody.innerHTML = '<tr><td colspan="5">No items found in pantry.</td></tr>';
    return;
  }

  snapshot.forEach((docSnapshot) => {
    const item = docSnapshot.data();
    const docId = docSnapshot.id;

    const row = `
      <tr>
        <td><b>${item.name || ''}</b></td>
        <td>${item.quantity || ''}</td>
        <td>${item.unit || ''}</td>
        <td>${item.expiry_date || ''}</td>
        <td>
          <button class="btn-edit" onclick="editItem('${docId}', '${item.quantity}')">Edit</button>
          <button class="btn-delete" onclick="deleteItem('${docId}')">Delete</button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
});

addBtn.addEventListener("click", async () => {
  const name = document.getElementById("itemName").value;
  const quantity = document.getElementById("itemQuantity").value;
  const unit = document.getElementById("itemUnit").value;
  const expiry_date = document.getElementById("expiryDate").value;

  if (!name) {
    alert("Please enter the item name!");
    return;
  }

  try {
    await addDoc(collection(db, "pantry_items"), {
      householdId: "hh_101",
      name: name,
      quantity: quantity,
      unit: unit,
      expiry_date: expiry_date
    });

    document.getElementById("itemName").value = "";
    document.getElementById("itemQuantity").value = "";
    document.getElementById("itemUnit").value = "";
    document.getElementById("expiryDate").value = "";
  } catch (error) {
    console.error("Error adding item: ", error);
  }
});

window.deleteItem = async function(id) {
  if (confirm("Are you sure you want to delete this item?")) {
    try {
      await deleteDoc(doc(db, "pantry_items", id));
    } catch (error) {
      console.error("Error deleting item: ", error);
    }
  }
};

window.editItem = async function(id, currentQuantity) {
  const newQuantity = prompt("Enter new quantity:", currentQuantity);
  if (newQuantity !== null && newQuantity !== "") {
    try {
      const itemRef = doc(db, "pantry_items", id);
      await updateDoc(itemRef, {
        quantity: newQuantity
      });
    } catch (error) {
      console.error("Error updating item: ", error);
    }
  }
};