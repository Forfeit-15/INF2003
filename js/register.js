// js/register.js
const API_BASE = "http://127.0.0.1:5000";

const form = document.getElementById("register-form");
const usernameInput = document.getElementById("username");
const displayNameInput = document.getElementById("display_name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("error-msg");

// If already logged in, bounce back to main app
if (localStorage.getItem("user")) {
  window.location.href = "index.html";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const username = usernameInput.value.trim();
  const display_name = displayNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !email || !password) {
    errorMsg.textContent = "Please fill in username, email and password.";
    return;
  }

  if (password.length < 4) {
    errorMsg.textContent = "Password should be at least 4 characters.";
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, display_name, email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      errorMsg.textContent =
        data.error || data.message || "Unable to register.";
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    // auth.py returns the user object directly
    const user = data;

    // Auto-login after successful registration
    localStorage.setItem("user", JSON.stringify(user));

    setTimeout(() => {
      window.location.href = "index.html";
    }, 100);
  } catch (err) {
    console.error("Register error:", err);
    errorMsg.textContent = "Server unavailable. Please try again.";
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});
