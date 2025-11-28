const API_BASE = "http://127.0.0.1:5000";

const form = document.getElementById("profile-form");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const displayNameInput = document.getElementById("display_name");
const bioInput = document.getElementById("bio");
const passwordInput = document.getElementById("password");
const msgEl = document.getElementById("profile-msg");

// Get current user from localStorage
let user = null;
try {
  user = JSON.parse(localStorage.getItem("user") || "null");
} catch {
  user = null;
}

// If not logged in, go to login
if (!user) {
  window.location.href = "login.html";
}

// Pre-fill fields
usernameInput.value = user.username || "";
emailInput.value = user.email || "";
displayNameInput.value = user.display_name || user.username || "";
bioInput.value = user.bio || "";

// Handle submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.textContent = "";

  const display_name = displayNameInput.value.trim();
  const bio = bioInput.value.trim();
  const password = passwordInput.value.trim();

  const payload = { display_name, bio };
  if (password) {
    payload.password = password;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  try {
    const res = await fetch(`${API_BASE}/api/users/${user.user_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      msgEl.textContent = data.error || "Unable to update profile.";
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    // Update localStorage with latest user data
    localStorage.setItem("user", JSON.stringify(data));
    user = data;
    passwordInput.value = "";
    msgEl.textContent = "Profile updated successfully.";
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  } catch (err) {
    console.error("Profile update error:", err);
    msgEl.textContent = "Server unavailable. Please try again.";
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});
