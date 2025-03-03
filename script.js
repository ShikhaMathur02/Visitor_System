document.addEventListener("DOMContentLoaded", function() {
    const form = document.querySelector("form");

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        alert("Visitor details submitted successfully!");
        form.reset();
    });
});



document.addEventListener("DOMContentLoaded", function () {
    const visitorForm = document.getElementById("visitorForm");
    const visitorTable = document.getElementById("visitorTable");
    const visitorCount = document.getElementById("visitorCount");
    const searchInput = document.getElementById("search");

    let visitors = JSON.parse(localStorage.getItem("visitors")) || [];

    function updateDashboard() {
        visitorTable.innerHTML = ""; // Clear existing table rows

        let todayCount = 0;
        const today = new Date().toISOString().split("T")[0];

        visitors.forEach((visitor, index) => {
            let entryDate = visitor.entryTime.split("T")[0];
            if (entryDate === today) todayCount++;

            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${visitor.name}</td>
                <td>${visitor.mobile}</td>
                <td>${visitor.address}</td>
                <td>${visitor.gender}</td>
                <td>${visitor.whomToVisit}</td>
                <td>${visitor.purpose}</td>
                <td>${new Date(visitor.entryTime).toLocaleString()}</td>
                <td>${visitor.exitTime ? new Date(visitor.exitTime).toLocaleString() : "N/A"}</td>
                <td>
                    <button onclick="markExit(${index})">Mark Exit</button>
                </td>
            `;
            visitorTable.appendChild(row);
        });

        visitorCount.textContent = todayCount;
        localStorage.setItem("visitors", JSON.stringify(visitors));
    }

    visitorForm.addEventListener("submit", function (event) {
        event.preventDefault();

        let visitor = {
            name: document.getElementById("name").value,
            mobile: document.getElementById("mobile").value,
            address: document.getElementById("address").value,
            gender: document.getElementById("gender").value,
            whomToVisit: document.getElementById("whomToVisit").value,
            purpose: document.getElementById("purpose").value,
            entryTime: new Date().toISOString(),
            exitTime: ""
        };

        visitors.push(visitor);
        updateDashboard();  // ✅ Ensure data updates
        visitorForm.reset();
        showSection('visitorList');  // ✅ Switch to visitor list after submission
    });

    window.searchVisitor = function () {
        let filter = searchInput.value.toLowerCase();
        let rows = document.querySelectorAll("#visitorTable tr");

        rows.forEach(row => {
            let text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? "" : "none";
        });
    };

    window.markExit = function (index) {
        visitors[index].exitTime = new Date().toISOString();
        updateDashboard();
    };

    window.showSection = function (section) {
        document.querySelectorAll(".section").forEach(div => div.classList.remove("active"));
        document.getElementById(section).classList.add("active");
    };

    updateDashboard(); // ✅ Populate table on page load
});
