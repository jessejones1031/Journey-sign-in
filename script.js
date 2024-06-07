import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  getDocs,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChlC7PB4--sphdh40Mrlr-jgtv10wucA4",
  authDomain: "journey-sign-in.firebaseapp.com",
  projectId: "journey-sign-in",
  storageBucket: "journey-sign-in.appspot.com",
  messagingSenderId: "504925072757",
  appId: "1:504925072757:web:be99eba771ae812c96773c",
  measurementId: "G-RZY3K96VDW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

document.getElementById("search-button").addEventListener("click", searchTeen);
document.getElementById("add-teen-button").addEventListener("click", showAddTeenForm);
document.getElementById("cancel-add-teen").addEventListener("click", hideAddTeenForm);
document.getElementById("attendance-form").addEventListener("submit", addNewTeen);
document.getElementById("generate-groups-button").addEventListener("click", generateGroups);

function showAddTeenForm() {
  document.getElementById("attendance-form").style.display = "block";
}

function hideAddTeenForm() {
  document.getElementById("attendance-form").style.display = "none";
}

async function searchTeen() {
  const searchName = document.getElementById("search-name").value.trim().toLowerCase();
  if (searchName === "") {
    alert("Please enter a name to search.");
    return;
  }

  const q1 = query(collection(db, "teens"), where("firstNameLower", "==", searchName));
  const q2 = query(collection(db, "teens"), where("lastNameLower", "==", searchName));

  const querySnapshot1 = await getDocs(q1);
  const querySnapshot2 = await getDocs(q2);

  const searchResults = document.getElementById("search-results");
  searchResults.innerHTML = "";

  let found = false;

  querySnapshot1.forEach((doc) => {
    found = true;
    displaySearchResult(doc, searchResults);
  });
  querySnapshot2.forEach((doc) => {
    found = true;
    displaySearchResult(doc, searchResults);
  });

  if (!found) {
    searchResults.innerHTML = "No teens found. Please add new teen.";
  }
}

function displaySearchResult(doc, searchResults) {
  const data = doc.data();
  const resultItem = document.createElement("div");
  resultItem.innerHTML = `${data.firstName} ${data.lastName} - ${data.cellPhone} - ${data.email}`;
  const signInButton = document.createElement("button");
  signInButton.textContent = "Sign InTo ensure your buttons work properly and make the app function like a native app on a Samsung tablet, let's first ensure all necessary components are in place and correctly configured.

### Ensure Correct File Setup

1. **Repository Structure:**
