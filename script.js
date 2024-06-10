// Import Firebase modules 
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
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

let todaysTeens = [];  // Array to store today's attendance data

// Event listeners
document.getElementById("search-button").addEventListener("click", searchTeen);
document.getElementById("add-teen-button").addEventListener("click", showAddTeenForm);
document.getElementById("cancel-add-teen").addEventListener("click", hideAddTeenForm);
document.getElementById("attendance-form").addEventListener("submit", addNewTeen);
document.getElementById("generate-groups-button").addEventListener("click", generateGroups);

// Display and hide form
function showAddTeenForm() {
    document.getElementById("attendance-form").style.display = "block";
}

function hideAddTeenForm() {
    document.getElementById("attendance-form").style.display = "none";
}

// Search for a teen based on the name
async function searchTeen() {
    const searchName = document.getElementById("search-name").value.trim().toLowerCase();
    if (searchName === "") {
        alert("Please enter a name to search.");
        return;
    }

    const q = query(collection(db, "teens"), where("lastNameLower", "==", searchName));
    const querySnapshot = await getDocs(q);
    const searchResults = document.getElementById("search-results");
    searchResults.innerHTML = "";

    if (querySnapshot.empty) {
        searchResults.innerHTML = "No teens found. Please add new teen.";
    } else {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const resultItem = document.createElement("div");
            resultItem.innerHTML = `${data.firstName} ${data.lastName} - ${data.cellPhone} - ${data.email}`;
            const signInButton = document.createElement("button");
            signInButton.textContent = "Sign In";
            signInButton.addEventListener("click", () => markAttendance(doc.id));
            resultItem.appendChild(signInButton);
            searchResults.appendChild(resultItem);
        });
    }
}

async function markAttendance(id) {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    const attendanceRef = doc(db, "teens", id, "attendance", dateStr);
    const docSnapshot = await getDoc(attendanceRef);

    if (docSnapshot.exists()) {
        alert("Teen has already signed in today.");
    } else {
        const late = today.getHours() >= 19 || (today.getHours() === 18 && today.getMinutes() > 45);
        await setDoc(attendanceRef, {
            timestamp: serverTimestamp(),
            late
        });

        alert("Signed in successfully");
        await loadAttendance();  // Refresh attendance data
    }
}

async function addNewTeen(e) {
    e.preventDefault();

    // Retrieve form data
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const cellPhone = formatPhoneNumber(document.getElementById("cell-phone").value.trim());
    const email = document.getElementById("email").value.trim();
    const gradYear = parseInt(document.getElementById("grad-year").value.trim());
    const dob = document.getElementById("dob").value.trim();
    const confirmationLevel = document.getElementById("confirmation-level").value;
    const parentFirstName = document.getElementById("parent-first-name").value.trim();
    const parentLastName = document.getElementById("parent-last-name").value.trim();
    const parentCellPhone = formatPhoneNumber(document.getElementById("parent-cell-phone").value.trim());

    // Validate inputs
    if (!validateInputs({ firstName, lastName, cellPhone, email, gradYear, dob, confirmationLevel, parentFirstName, parentLastName, parentCellPhone })) {
        alert("Please fill out all fields correctly.");
        return;
    }

    const docId = `${firstName}_${lastName}`.toLowerCase();
    const teenData = {
        firstName,
        lastName,
        firstNameLower: firstName.toLowerCase(),
        lastNameLower: lastName.toLowerCase(),
        cellPhone,
        email,
        gradYear,
        dob,
        confirmationLevel,
        parentFirstName,
        parentLastName,
        parentCellPhone
    };

    try {
        await setDoc(doc(db, "teens", docId), teenData);
        alert("Teen added and signed in successfully");
        document.getElementById("attendance-form").reset();
        hideAddTeenForm();
        await loadAttendance();  // Refresh attendance data
    } catch (error) {
        console.error("Error adding teen: ", error);
    }
}

function validateInputs(data) {
    return Object.values(data).every(value => value !== null && value !== '');
}

function formatPhoneNumber(value) {
    const cleaned = ("" + value).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
}

async function loadAttendance() {
    if (todaysTeens.length > 0) return;  // Prevent reloading if already loaded

    const q = query(collection(db, "teens"), where("date", "==", new Date().toISOString().split("T")[0]));
    const querySnapshot = await getDocs(q);
    const list = document.getElementById("list");
    list.innerHTML = ""; // Clear previous data

    const table = document.createElement("table");
    const headerRow = table.insertRow();
    headerRow.innerHTML = `<th>Name</th><th>Sign-In Time</th><th>Grade</th><th>Conf. Level</th><th>Age</th>`;

    querySnapshot.forEach(doc => {
        const teenData = doc.data();
        todaysTeens.push(teenData);  // Cache data to prevent re-fetching

        const row = table.insertRow();
        row.innerHTML = `<td>${teenData.firstName} ${teenData.lastName}</td><td>${formatTime(teenData.timestamp)}</td><td>${teenData.grade}</td><td>${teenData.confirmationLevel}</td><td>${calculateAge(teenData.dob)}</td>`;
        table.appendChild(row);
    });

    list.appendChild(table);
}

async function generateGroups() {
    if (todaysTeens.length === 0) await loadAttendance(); // Ensure data is loaded

    const groupCount = parseInt(document.getElementById("group-count").value);
    const groups = Array.from({ length: groupCount }, () => []);
    const shuffledTeens = [...todaysTeens].sort(() => 0.5 - Math.random()); // Shuffle a copy of the data

    shuffledTeens.forEach((teen, index) => {
        groups[index % groupCount].push(teen);
    });

    displayGroups(groups);
}

function displayGroups(groups) {
    const groupResults = document.getElementById("group-results");
    groupResults.innerHTML = "";  // Clear previous groups

    groups.forEach((group, index) => {
        const groupDiv = document.createElement("div");
        groupDiv.innerHTML = `<h3>Group ${index + 1}</h3>`;
        const ul = document.createElement("ul");
        group.forEach(teen => {
            const li = document.createElement("li");
            li.textContent = `${teen.firstName} ${teen.lastName}`;
            ul.appendChild(li);
        });
        groupDiv.appendChild(ul);
        groupResults.appendChild(groupDiv);
    });
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

window.onload = async function () {
    await loadAttendance();  // Load attendance data once on page load

    // Add event listeners for phone number inputs
    document.getElementById("cell-phone").addEventListener("input", handlePhoneInput);
    document.getElementById("parent-cell-phone").addEventListener("input", handlePhoneInput);
};
