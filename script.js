// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
      }); // Closing parenthesis for forEach function
        } // Closing brace for else block
    } // Closing brace for s
async function markAttendance(id) {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0]; // Format date as YYYY-MM-DD

  const attendanceRef = doc(db, "teens", id, "attendance", dateStr);
  const docSnapshot = await getDoc(attendanceRef);

  if (docSnapshot.exists()) {
    alert("Teen has already signed in today.");
  } else {
    const late =
      today.getHours() >= 19 ||
      (today.getHours() === 18 && today.getMinutes() > 45);

    await setDoc(attendanceRef, {
      timestamp: serverTimestamp(),
      late
    });

    // Update teen's confirmation year and grade
    const teenDocRef = doc(db, "teens", id);
    const teenDoc = await getDoc(teenDocRef);
    if (teenDoc.exists()) {
      const teenData = teenDoc.data();
      const updatedData = calculateTeenData(teenData);
      await setDoc(teenDocRef, updatedData, { merge: true });
    }

    alert("Signed in successfully");
    loadAttendance();
  }
}

async function addNewTeen(e) {
  e.preventDefault();

  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const cellPhone = formatPhoneNumber(
    document.getElementById("cell-phone").value.trim()
  );
  const email = document.getElementById("email").value.trim();
  const gradYear = parseInt(document.getElementById("grad-year").value.trim());
  const dob = document.getElementById("dob").value.trim();
  const confirmationLevel = document.getElementById("confirmation-level").value;
  const parentFirstName = document
    .getElementById("parent-first-name")
    .value.trim();
  const parentLastName = document
    .getElementById("parent-last-name")
    .value.trim();
  const parentCellPhone = formatPhoneNumber(
    document.getElementById("parent-cell-phone").value.trim()
  );

  if (
    !validateInputs({
      firstName,
      lastName,
      cellPhone,
      email,
      gradYear,
      dob,
      confirmationLevel,
      parentFirstName,
      parentLastName,
      parentCellPhone
    })
  ) {
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

  const updatedData = calculateTeenData(teenData);

  try {
    await setDoc(doc(db, "teens", docId), updatedData);

    // Mark the first attendance on teen creation
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
    const late =
      today.getHours() >= 19 ||
      (today.getHours() === 18 && today.getMinutes() > 45);

    await setDoc(doc(collection(db, "teens", docId, "attendance"), dateStr), {
      timestamp: serverTimestamp(),
      late
    });

    alert("Teen added and signed in successfully");
    document.getElementById("attendance-form").reset();
    hideAddTeenForm();
    loadAttendance();
  } catch (error) {
    console.error("Error adding teen: ", error);
  }
}

function validateInputs(data) {
  if (
    !data.firstName ||
    !data.lastName ||
    !data.cellPhone ||
    !data.email ||
    !data.gradYear ||
    !data.dob ||
    !data.confirmationLevel ||
    !data.parentFirstName ||
    !data.parentLastName ||
    !data.parentCellPhone
  ) {
    return false;
  }
  return true;
}

function formatTime(timestamp) {
  const date = timestamp.toDate();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strTime =
    hours + ":" + (minutes < 10 ? "0" + minutes : minutes) + " " + ampm;
  return strTime;
}

async function loadAttendance() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const today = new Date();
  const dateStr = today.toISOString().split("T")[0]; // Format date as YYYY-MM-DD

  const q = query(collection(db, "teens"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    list.innerHTML = "<p>No teens have signed in today.</p>";
    return [];
  }

  const todaysTeens = [];

  const table = document.createElement("table");
  const headerRow = table.insertRow();
  headerRow.innerHTML = `
    <th>Name</th>
    <th>Sign-In Time</th>
    <th>Grade</th>
    <th>Conf. Level</th>
    <th>Age</th>
  `;

  for (const teenDoc of querySnapshot.docs) {
    const teenData = teenDoc.data();
    const attendanceRef = doc(db, "teens", teenDoc.id, "attendance", dateStr);
    const attendanceDoc = await getDoc(attendanceRef);

    if (attendanceDoc.exists()) {
      const row = table.insertRow();
      const age = calculateAge(teenData.dob);
      const grade = teenData.currentGrade;
      const displayGrade =
        grade === "Graduated" ? "Graduated" : `Grade: ${grade}`;
      row.innerHTML = `
        <td>${teenData.firstName} ${teenData.lastName}</td>
        <td>${formatTime(attendanceDoc.data().timestamp)}</td>
        <td>${displayGrade}</td>
        <td>${teenData.confirmationLevel}</td>
        <td>${age}</td>
      `;
      row.addEventListener("click", () =>
        toggleParentInfo(row, teenData, teenDoc.id)
      );
      todaysTeens.push(teenData);
    }
  }

  list.appendChild(table);
  return todaysTeens;
}

function toggleParentInfo(row, teenData, teenId) {
  if (row.nextSibling && row.nextSibling.className === "parent-info") {
    row.parentNode.removeChild(row.nextSibling);
  } else {
    const parentInfoRow = document.createElement("tr");
    parentInfoRow.className = "parent-info";
    parentInfoRow.innerHTML = `
      <td colspan="5">
        <div class="info-container">
          <div>
            <strong>Parent Information:</strong><br>
            Parent Name: ${teenData.parentFirstName} ${
      teenData.parentLastName
    }<br>
            Parent Cell Phone: ${teenData.parentCellPhone}<br>
          </div>
          <div class="notes-container">
            <strong>Notes:</strong><br>
            <div id="notes-${teenId}">${
      teenData.notes || "No notes available."
    }</div>
            <button id="edit-note-${teenId}">Edit Notes</button>
          </div>
        </div>
      </td>
    `;
    row.parentNode.insertBefore(parentInfoRow, row.nextSibling);

    // Add event listener for the Edit Notes button
    document
      .getElementById(`edit-note-${teenId}`)
      .addEventListener("click", () => editNotes(teenId, teenData.notes || ""));
  }
}

function editNotes(teenId, currentNote) {
  const noteDiv = document.getElementById(`notes-${teenId}`);
  noteDiv.innerHTML = `
    <textarea id="note-${teenId}" rows="3" style="width: 100%">${currentNote}</textarea>
    <button id="save-note-${teenId}">Save Note</button>
  `;

  // Add event listener for the Save Note button
  document
    .getElementById(`save-note-${teenId}`)
    .addEventListener("click", () => saveNoteHandler(teenId, `note-${teenId}`));
}

async function saveNoteHandler(teenId, textareaId) {
  const note = document.getElementById(textareaId).value;
  try {
    await saveNote(teenId, note);
    alert("Note saved successfully");
    // Update the displayed note
    document.getElementById(`notes-${teenId}`).innerHTML = note;
  } catch (error) {
    console.error("Error saving note: ", error);
    alert("Error saving note");
  }
}

async function saveNote(teenId, note) {
  const teenDocRef = doc(db, "teens", teenId);
  await updateDoc(teenDocRef, { notes: note });
}

async function generateGroups() {
  const groupCount = parseInt(document.getElementById("group-count").value);
  const teens = await loadAttendance();

  if (teens.length === 0) {
    alert("No teens have signed in today.");
    return;
  }

  const shuffledTeens = teens.sort(() => 0.5 - Math.random());
  const groups = Array.from({ length: groupCount }, () => []);

  shuffledTeens.forEach((teen, index) => {
    groups[index % groupCount].push(teen);
  });

  displayGroups(groups);
}

function displayGroups(groups) {
  const groupResults = document.getElementById("group-results");
  groupResults.innerHTML = "";

  groups.forEach((group, index) => {
    const groupDiv = document.createElement("div");
    groupDiv.innerHTML = `<h3>Group ${index + 1}</h3>`;

    const ul = document.createElement("ul");
    group.forEach((teen) => {
      const li = document.createElement("li");
      li.textContent = `${teen.firstName} ${teen.lastName}`;
      ul.appendChild(li);
    });

    groupDiv.appendChild(ul);
    groupResults.appendChild(groupDiv);
  });
}

function formatPhoneNumber(value) {
  // Remove all non-digit characters
  const cleaned = ("" + value).replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return value;
}

function handlePhoneInput(event) {
  const input = event.target;
  input.value = formatPhoneNumber(input.value);
}

function calculateTeenData(data) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0 = January, 11 = December
  let currentGrade = currentYear - data.gradYear + 12;

  if (currentGrade > 12 || (currentGrade === 12 && currentMonth >= 6)) {
    currentGrade = "Graduated";
  }

  let confirmationYear = currentYear;
  if (currentMonth >= 6) {
    // After June (July to December)
    confirmationYear += 12 - parseInt(data.confirmationLevel);
  } else {
    confirmationYear += 11 - parseInt(data.confirmationLevel);
  }

  return {
    ...data,
    currentGrade,
    confirmationYear
  };
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

window.onload = function () {
  loadAttendance();

  // Add event listeners for phone number inputs
  document
    .getElementById("cell-phone")
    .addEventListener("input", handlePhoneInput);
  document
    .getElementById("parent-cell-phone")
    .addEventListener("input", handlePhoneInput);
};
