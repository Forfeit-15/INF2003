const API_BASE = "http://127.0.0.1:5000";

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("error-msg");

// If already logged in, redirect to app
if (localStorage.getItem("user")) {
  // if login.html is in a subfolder, go back up one level
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
      // auth.py expects either "email" or "username"; sending email is fine
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Backend returned an auth / validation error
      errorMsg.textContent =
        data.error || data.message || "Invalid credentials.";
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    // ✅ auth.py returns the user object directly
    const user = data;

    // Store user data (Note: In production, use secure session tokens)
    localStorage.setItem("user", JSON.stringify(user));

    // Small delay to ensure storage is set before redirect
    setTimeout(() => {
      window.location.href = "index.html";
    }, 100);
  } catch (err) {
    console.warn(
      "Server unreachable, falling back to demo auth (dev only):",
      err.message
    );

    // Fallback for front-end testing only (when Flask isn't running)
    // WARNING: This is NOT secure and should only be used for development
    if (email === "demo@example.com" && password === "1234") {
      localStorage.setItem(
        "user",
        JSON.stringify({ email, name: "Demo User" })
      );

      setTimeout(() => {
        window.location.href = "index.html";
      }, 100);
    } else {
      errorMsg.textContent =
        "Server unavailable or invalid credentials.";
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
