// login.js
const BACKEND_URL = "https://booking-t046.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  // ✅ If already logged in, redirect to admin page
  const existingToken = localStorage.getItem("token");
  if (existingToken) {
    window.location.href = "admin.html";
    return;
  }

  // 🟦 Switch to login form
  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
  });

  // 🟩 Switch to register form
  registerTab.addEventListener("click", () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.classList.add("active");
    loginForm.classList.remove("active");
  });

  // 🔐 LOGIN HANDLER
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const [emailInput, passwordInput] = loginForm.querySelectorAll("input");
    const username = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Network error");
      const data = await res.json();

      if (data.success) {
        // 🧩 Store login data for session
        localStorage.setItem("token", data.token);
        localStorage.setItem("admin_id", data.admin_id);
        localStorage.setItem("username", data.username);

        alert("✅ Login successful!");
        window.location.href = "admin.html";
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("🚨 Server error. Please check backend connection.");
    }
  });

  // 🧾 REGISTER HANDLER
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const [nameInput, emailInput, passInput, confirmInput] =
      registerForm.querySelectorAll("input");

    const full_name = nameInput.value.trim();
    const username = emailInput.value.trim();
    const password = passInput.value.trim();
    const confirmPassword = confirmInput.value.trim();

    if (!full_name || !username || !password || !confirmPassword) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("⚠️ Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, username, password }),
      });

      if (!res.ok) throw new Error("Network error");
      const data = await res.json();

      if (data.success) {
        alert("✅ Registration successful! You can now log in.");
        // Automatically switch back to login tab
        loginTab.click();
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("🚨 Server error. Please check backend connection.");
    }
  });
});
