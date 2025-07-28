// attendance-report.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, Timestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
const db = getFirestore(app);

document.getElementById('generate-report').addEventListener('click', async function() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    const formattedStartDate = new Date(startDate);
    const formattedEndDate = new Date(endDate);
    formattedEndDate.setDate(formattedEndDate.getDate() + 1); // Include the end date in the search

    const resultsContainer = document.getElementById('report-results');
    resultsContainer.innerHTML = ''; // Clear previous results

    const teensRef = collection(db, "teens");
    const snapshot = await getDocs(teensRef);

    snapshot.forEach(async (doc) => {
        const teenName = doc.data().firstName + " " + doc.data().lastName;
        const attendanceRef = collection(db, "teens", doc.id, "attendance");
        const q = query(
            attendanceRef,
            where("timestamp", ">=", Timestamp.fromDate(formattedStartDate)),
            where("timestamp", "<", Timestamp.fromDate(formattedEndDate))
        );
        const attendanceSnap = await getDocs(q);

        if (!attendanceSnap.empty) {
            const datesAttended = attendanceSnap.docs.map(doc => doc.id).join(", ");
            resultsContainer.innerHTML += `<p>${teenName} attended on: ${datesAttended}</p>`;
        }
    });
});
