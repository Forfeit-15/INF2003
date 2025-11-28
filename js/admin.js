const API_BASE = "http://127.0.0.1:5000";

const tbody = document.getElementById("users-body");
const msgEl = document.getElementById("admin-msg");

// Check admin status
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem("user") || "null");
} catch {
  currentUser = null;
}

if (!currentUser || !currentUser.is_admin) {
  // Not an admin → bounce
  window.location.href = "index.html";
}

// Fetch all users
async function loadUsers() {
  msgEl.textContent = "";
  tbody.innerHTML = "<tr><td colspan='7'>Loading...</td></tr>";

  try {
    const res = await fetch(`${API_BASE}/api/admin/users`);
    const data = await res.json().catch(() => []);

    if (!res.ok) {
      msgEl.textContent = data.error || "Unable to load users.";
      tbody.innerHTML = "";
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='7'>No users found.</td></tr>";
      return;
    }

    tbody.innerHTML = data
    .map((u) => {
      const isSelf = currentUser && u.user_id === currentUser.user_id;

      // For the current admin, show a note instead of buttons
      const actionsHtml = isSelf
        ? `<span class="self-note">Current user</span>`
        : `
          <div class="action-btns">
            <button class="btn-action btn-toggle-admin">
              ${u.is_admin ? "Revoke admin" : "Make admin"}
            </button>
            <button class="btn-action btn-toggle-active">
              ${u.is_active ? "Deactivate" : "Activate"}
            </button>
            <button class="btn-action btn-delete">Delete</button>
          </div>
        `;

      return `
        <tr data-id="${u.user_id}">
          <td>${u.user_id}</td>
          <td>${u.username}</td>
          <td>${u.email}</td>
          <td>${u.display_name || ""}</td>
          <td>${u.is_admin ? "Yes" : "No"}</td>
          <td>${u.is_active ? "Yes" : "No"}</td>
          <td>${actionsHtml}</td>
        </tr>
      `;
    })
    .join("");
  } catch (err) {
    console.error("Admin loadUsers error:", err);
    msgEl.textContent = "Server unavailable.";
    tbody.innerHTML = "";
  }
}

// Handle button actions (event delegation)
tbody.addEventListener("click", async (e) => {
  const row = e.target.closest("tr[data-id]");
  if (!row) return;
  const userId = Number(row.dataset.id);
  if (currentUser && userId === currentUser.user_id) {
    return;
  }
  if (e.target.classList.contains("btn-toggle-admin")) {
    await updateUser(userId, { is_admin: row.children[4].textContent === "No" });
  } else if (e.target.classList.contains("btn-toggle-active")) {
    await updateUser(userId, { is_active: row.children[5].textContent === "No" });
  } else if (e.target.classList.contains("btn-delete")) {
    const ok = confirm("Delete this user? This cannot be undone.");
    if (!ok) return;
    await deleteUser(userId);
  }
});

async function updateUser(userId, patch) {
  msgEl.textContent = "";
  try {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      msgEl.textContent = data.error || "Unable to update user.";
      return;
    }

    await loadUsers();
  } catch (err) {
    console.error("Admin updateUser error:", err);
    msgEl.textContent = "Server unavailable.";
  }
}

async function deleteUser(userId) {
  msgEl.textContent = "";
  try {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      msgEl.textContent = data.error || "Unable to delete user.";
      return;
    }

    await loadUsers();
  } catch (err) {
    console.error("Admin deleteUser error:", err);
    msgEl.textContent = "Server unavailable.";
  }
}

// Initial load
loadUsers();
