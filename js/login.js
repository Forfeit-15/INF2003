const API_BASE = "http://127.0.0.1:5000";

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("error-msg");

// If already logged in, redirect to app
if (localStorage.getItem("user")) {
  window.location.href = "index.html";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    errorMsg.textContent = "Please fill in all fields.";
    return;
  }

  // Disable form during submission
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Network error");
    }

    const data = await res.json();

    if (data.success) {
      // Store user data (Note: In production, use secure session tokens)
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Small delay to ensure storage is set before redirect
      setTimeout(() => {
        window.location.href = "index.html";
      }, 100);
    } else {
      errorMsg.textContent = data.message || "Invalid credentials.";
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  } catch (err) {
    console.warn("Server unavailable, using fallback authentication:", err.message);
    
    // Fallback for front-end testing only
    // WARNING: This is NOT secure and should only be used for development
    if (email === "demo@example.com" && password === "1234") {
      localStorage.setItem("user", JSON.stringify({ email, name: "Demo User" }));
      
      setTimeout(() => {
        window.location.href = "index.html";
      }, 100);
    } else {
      errorMsg.textContent = "Server unavailable or invalid credentials.";
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
});

// Add Enter key support for better accessibility
emailInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    passwordInput.focus();
  }
});

passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    form.requestSubmit();
  }
});