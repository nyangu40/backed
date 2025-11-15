const BACKEND_URL = "https://booking-t046.onrender.com";

// -------------- Fetch helper --------------
async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = options.headers || {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${BACKEND_URL}${endpoint}`, { ...options, headers });
}

// -------------- Load Buses --------------
async function loadBuses(targetContainerId, isAdmin = false) {
  const container = document.getElementById(targetContainerId);
  container.innerHTML = "<p>Loading buses...</p>";

  try {
    const endpoint = isAdmin ? "/admin/buses" : "/buses";
    const res = isAdmin ? await fetchWithAuth(endpoint) : await fetch(`${BACKEND_URL}${endpoint}`);
    const buses = await res.json();

    if (!Array.isArray(buses) || !buses.length) {
      container.innerHTML = "<p>No buses found.</p>";
      return;
    }

    container.innerHTML = "";
    buses.forEach((b) => {
      const card = document.createElement("div");
      card.className = "col-md-4 mb-4";

      card.innerHTML = `
        <div class="card shadow-sm">
          <img src="${b.image || 'default.jpg'}" class="card-img-top" style="height:180px;object-fit:cover;">
          <div class="card-body">
            <h5>${b.bus_name}</h5>
            <p><strong>Route:</strong> ${b.origin} ➡️ ${b.destination}</p>
            <p><strong>Organizer:</strong> ${b.organizer}</p>
            <p><strong>Seats:</strong> ${b.total_seats}</p>
            <p><strong>Price:</strong> MWK ${b.price}</p>

            ${
              isAdmin
                ? `
                  <button class="btn btn-danger w-100 mb-2" onclick="deleteBus(${b.id})">🗑 Delete</button>
                  <button class="btn btn-info w-100" onclick="viewTestimonials(${b.id})">💬 What People Say</button>
                `
                : `
                  <button class="btn btn-primary w-100 mb-2" onclick="bookBus('${b.bus_name}','${b.organizer}','${b.airtel_number}',${b.id})">Book</button>
                  <button class="btn btn-outline-secondary w-100" onclick="viewTestimonials(${b.id})">💬 What People Say</button>
                `
            }
          </div>
        </div>`;

      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = "<p style='color:red;'>Failed to load buses.</p>";
  }
}

// -------------- Testimonials Redirect --------------
function viewTestimonials(busId) {
  window.location.href = `testimonials.html?bus_id=${busId}`;
}

// -------------- Add Bus --------------
async function handleAddBus(e) {
  e.preventDefault();
  const msg = document.getElementById("busMessage");
  const formData = new FormData(e.target);

  msg.textContent = "⏳ Uploading...";

  try {
    const res = await fetchWithAuth("/buses", { method: "POST", body: formData });
    const data = await res.json();

    msg.textContent = data.success ? "✅ Bus added!" : "❌ Failed.";
    msg.style.color = data.success ? "green" : "red";

    if (data.success) {
      e.target.reset();
      loadBuses("busContainer", true);
    }
  } catch {
    msg.textContent = "❌ Server error.";
    msg.style.color = "red";
  }
}

// -------------- Delete Bus --------------
async function deleteBus(id) {
  if (!confirm("Delete this bus?")) return;
  const res = await fetchWithAuth(`/buses/${id}`, { method: "DELETE" });
  const data = await res.json();

  if (data.success) loadBuses("busContainer", true);
}

// -------------- Load Bookings --------------
async function loadBookings() {
  const tbody = document.getElementById("bookingTable");
  tbody.innerHTML = "<tr><td colspan='10'>Loading...</td></tr>";

  try {
    const res = await fetchWithAuth("/admin/bookings");
    const bookings = await res.json();

    if (!Array.isArray(bookings) || !bookings.length) {
      tbody.innerHTML = "<tr><td colspan='10'>No bookings yet.</td></tr>";
      return;
    }

    tbody.innerHTML = bookings
      .map(
        (b, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${b.student_name}</td>
        <td>${b.seat_number}</td>
        <td>${b.bus_name}</td>
        <td>${b.organizer}</td>
        <td>${b.origin} ➡️ ${b.destination}</td>
        <td>${b.payment_amount}</td>
        <td>${b.payment_method}</td>
        <td>${b.payer_number}</td>
        <td>${b.status}</td>
      </tr>`
      )
      .join("");
  } catch {
    tbody.innerHTML = "<tr><td colspan='10' style='color:red;'>Error loading bookings.</td></tr>";
  }
}

// -------------- Book Redirect --------------
function bookBus(bus, org, num, id) {
  window.location.href = `book.html?bus_id=${id}&bus_name=${encodeURIComponent(
    bus
  )}&organizer=${encodeURIComponent(org)}&number=${encodeURIComponent(num)}`;
}

// -------------- Logout --------------
function logoutAdmin() {
  localStorage.clear();
  window.location.href = "login.html";
}

// -------------- Init Admin Page --------------
function initAdminPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("⚠️ You must login first!");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("logoutBtn").addEventListener("click", logoutAdmin);
  document.getElementById("busForm").addEventListener("submit", handleAddBus);

  loadBuses("busContainer", true);
  loadBookings();
}

// -------------- Init Home Page --------------
function initHomePage() {
  loadBuses("busContainer", false);
}
