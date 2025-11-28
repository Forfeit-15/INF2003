/* =========================================================
   MovieBase – Frontend App (SQL/NoSQL aligned)
   - Reviews: frontend-only (localStorage) + hard-coded others
   - Watchlist: legacy localStorage + “View Watchlist” in profile
   - Search logs: localStorage
========================================================= */

/* ================================
   DOM ELEMENTS
==================================*/

const moviesContainer = document.getElementById("movies-container");
const moviesCount = document.getElementById("movies-count");

const actorsContainer = document.getElementById("actors-container");
const actorsCount = document.getElementById("actors-count");

const genresContainer = document.getElementById("genres-container");
const genresCount = document.getElementById("genres-count");

const topUserContainer = document.getElementById("top-user-container");
const topUserCount = document.getElementById("top-user-count");

const searchInput = document.getElementById("search-input");

const genreMenu = document.getElementById("genre-menu");
const yearMenu = document.getElementById("year-menu");
const ratingMenu = document.getElementById("rating-menu");

const homeLogo = document.getElementById("home-logo");

/* profile dropdown */
const profileBtn = document.getElementById("profile-btn");
const profileMenu = document.getElementById("profile-menu");

/* watchlist modal */
const watchlistModal = document.getElementById("watchlist-modal");
const watchlistBackdrop = document.getElementById("watchlist-backdrop");
const watchlistClose = document.getElementById("watchlist-close");
const watchlistBody = document.getElementById("watchlist-body");

/* movie modal + reviews */
const movieModal = document.getElementById("movie-modal");
const movieBackdrop = document.getElementById("movie-backdrop");
const movieTitle = document.getElementById("movie-title");
const movieMeta = document.getElementById("movie-meta");
const reviewsList = document.getElementById("reviews-list");
const reviewForm = document.getElementById("review-form");
const reviewText = document.getElementById("review-text");
const reviewTags = document.getElementById("review-tags");
const spoilerCheckbox = document.getElementById("review-spoiler");
const reviewError = document.getElementById("review-error");
const movieClose = document.getElementById("movie-close");

/* star rating widget */
const starContainer = document.getElementById("star-rating"); // radiogroup
const starHint = document.getElementById("star-hint");

/* timeout handler */
let searchLogTimeout = null;

const searchLogModal = document.getElementById("searchlog-modal");
const searchLogBackdrop = document.getElementById("searchlog-backdrop");
const searchLogClose = document.getElementById("searchlog-close");
const searchLogBody = document.getElementById("searchlog-body");

/* search history button (next to search bar) */
const searchHistoryBtn = document.getElementById("search-history-btn");


/* ================================
   CONSTANTS / FALLBACK DATA
==================================*/

const YEAR_RANGES = [
  { label: "2020 — 2025", start: 2020, end: 2025 },
  { label: "2010 — 2019", start: 2010, end: 2019 },
  { label: "2000 — 2009", start: 2000, end: 2009 },
  { label: "1990 — 1999", start: 1990, end: 1999 },
  { label: "Before 1990", start: 0, end: 1989 }
];

/* “other people’s reviews” hard-coded */
const FALLBACK_REVIEWS = {
  tt1375666: [
    {
      user_id: 7,
      stars: 9,
      text: "Mind-bending score and pacing.",
      tags: ["music", "pacing"],
      spoiler: false,
      created_at: "2025-10-01T12:45:00Z"
    },
    {
      user_id: 12,
      stars: 9,
      text: "Dream layers still hold up.",
      tags: ["re-watchable"],
      spoiler: false,
      created_at: "2025-11-01T08:12:00Z"
    }
  ],
  tt0468569: [
    {
      user_id: 23,
      stars: 10,
      text: "Ledger's Joker steals the show.",
      tags: ["performance", "villain"],
      spoiler: false,
      created_at: "2025-11-02T15:00:00Z"
    }
  ]
};

/* ================================
   AUTH (FAKE)
==================================*/

function isLoggedIn() {
  return !!localStorage.getItem("user");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getUserId() {
  const u = getUser();
  if (!u) return 42; // anonymous
  return u.id || u.user_id || 42;
}

function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem("user");
}

/* ================================
   PROFILE DROPDOWN
==================================*/

function closeAllDropdowns(exceptMenu) {
  document.querySelectorAll(".dropdown .dropdown-content").forEach((c) => {
    if (exceptMenu && c === exceptMenu) return; // keep this menu open

    c.style.opacity = "0";
    c.style.transform = "translateY(-5px)";
    setTimeout(() => {
      if (exceptMenu && c === exceptMenu) return; // extra safety
      c.style.display = "none";
    }, 150);
  });

  document
    .querySelectorAll(".dropbtn, .profile-btn")
    .forEach((b) => b.setAttribute("aria-expanded", "false"));
}


/* dynamic menu like your original version */
function populateProfileMenu() {
  if (!profileMenu) return;
  const logged = isLoggedIn();
  profileMenu.innerHTML = "";

  // View watchlist (always present)
  const viewWL = document.createElement("button");
  viewWL.textContent = "View watchlist";
  viewWL.className = "menu-item";
  viewWL.setAttribute("role", "menuitem");
  viewWL.addEventListener("click", () => {
    if (!logged) {
      window.location.href = "login.html";
      return;
    }
    openWatchlist();
    closeAllDropdowns();
  });
  profileMenu.appendChild(viewWL);

  if (logged) {
    const user = getUser();

    // My Profile
    const myProfile = document.createElement("button");
    myProfile.textContent = "My profile";
    myProfile.className = "menu-item";
    myProfile.setAttribute("role", "menuitem");
    myProfile.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
    profileMenu.appendChild(myProfile);

    // Admin: Manage users
    if (user && user.is_admin) {
      const manage = document.createElement("button");
      manage.textContent = "Manage users";
      manage.className = "menu-item";
      manage.setAttribute("role", "menuitem");
      manage.addEventListener("click", () => {
        window.location.href = "admin.html";
      });
      profileMenu.appendChild(manage);
    }

    // Logout
    const lo = document.createElement("button");
    lo.textContent = "Logout";
    lo.className = "menu-item";
    lo.setAttribute("role", "menuitem");
    lo.addEventListener("click", () => {
      clearUser();
      closeAllDropdowns();
      loadAll(); // reload UI in logged-out state
    });
    profileMenu.appendChild(lo);

  } else {
    // Logged-out branch (keep your existing Login + Register)
    const li = document.createElement("button");
    li.textContent = "Login";
    li.className = "menu-item";
    li.setAttribute("role", "menuitem");
    li.addEventListener("click", () => {
      window.location.href = "login.html";
    });
    profileMenu.appendChild(li);

    const reg = document.createElement("button");
    reg.textContent = "Register";
    reg.className = "menu-item";
    reg.setAttribute("role", "menuitem");
    reg.addEventListener("click", () => {
      window.location.href = "register.html";
    });
    profileMenu.appendChild(reg);
  }
}

/* toggle profile dropdown via click */
if (profileBtn && profileMenu) {
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = profileMenu.style.display === "block";

    if (isOpen) {
      // close everything
      closeAllDropdowns();
    } else {
      // close others, keep this one open
      closeAllDropdowns(profileMenu);
      profileBtn.setAttribute("aria-expanded", "true");
      profileMenu.style.display = "block";
      requestAnimationFrame(() => {
        profileMenu.style.opacity = "1";
        profileMenu.style.transform = "translateY(0)";
      });
    }
  });
}


/* close dropdowns when clicking outside any .dropdown */
document.addEventListener("click", (e) => {
  const isDropdown = e.target.closest(".dropdown");
  if (!isDropdown) {
    closeAllDropdowns();
  }
});

/* ================================
   WATCHLIST (legacy + modal)
==================================*/

function getLegacyWatchlist() {
  const raw = localStorage.getItem("watchlist");
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function setLegacyWatchlist(list) {
  localStorage.setItem("watchlist", JSON.stringify(list));
}

async function fetchWatchlist() {
  const legacy = getLegacyWatchlist();

  if (!isLoggedIn()) {
    return legacy;
  }

  const user = getUser();
  const userId = user?.id || user?.user_id;
  if (!userId) return legacy;

  try {
    const res = await fetch(`${API_BASE}/api/watchlist/${userId}`);
    if (!res.ok) {
      console.warn("Watchlist API error", res.status);
      return legacy;
    }
    const serverList = await res.json();
    // keep local cache in sync
    setLegacyWatchlist(serverList);
    return serverList;
  } catch (err) {
    console.warn("Watchlist API unreachable, falling back to local only:", err);
    return legacy;
  }
}

// Use the same key format everywhere
function makeMovieKey(movie) {
  return `${movie.title} (${movie.year})`;
}

// Store keys for movies in watchlist so UI can show "Added"
let watchlistKeys = new Set();

function updateWatchlistButtonState(key, added) {
  document.querySelectorAll(".btn-watchlist").forEach((btn) => {
    if (btn.dataset.key !== key) return;

    const icon = btn.querySelector(".btn-watchlist-icon");
    const label = btn.querySelector(".btn-watchlist-label");

    if (added) {
      btn.classList.add("btn-watchlist-added");
      if (icon) icon.textContent = "✓";
      if (label) label.textContent = "Added";
    } else {
      btn.classList.remove("btn-watchlist-added");
      if (icon) icon.textContent = "＋";
      if (label) label.textContent = "Watchlist";
    }
  });
}


function resolveTconst(movie) {
  return movie && movie.tconst ? movie.tconst : null;
}

async function addToWatchlist(movie) {
  if (!movie) return;

  const key = `${movie.title} (${movie.year})`;
  const payload = { ...movie, key };

  // ---- Local cache ----
  const list = getLegacyWatchlist();
  const exists = list.some((m) =>
    m.tconst && movie.tconst
      ? m.tconst === movie.tconst
      : `${m.title} (${m.year})` === key
  );
  if (!exists) {
    list.push(payload);
    setLegacyWatchlist(list);
  }

  // ---- UI state (always, even if not logged in) ----
  // assumes you declared: let watchlistKeys = new Set(); at the top of app.js
  if (typeof watchlistKeys === "undefined") {
    // safety, in case it wasn't declared for some reason
    window.watchlistKeys = new Set();
  }
  watchlistKeys.add(key);

  // assumes you have updateWatchlistButtonState(key, added)
  if (typeof updateWatchlistButtonState === "function") {
    updateWatchlistButtonState(key, true); // switch to "Added" in the UI
  }

  // ---- Server (Mongo) ----
  if (!isLoggedIn()) return;

  const user = getUser();
  const userId = user?.id || user?.user_id;
  if (!userId) return;

  try {
    const res = await fetch(`${API_BASE}/api/watchlist/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("Failed to save watchlist item to server", res.status);
    }
  } catch (err) {
    console.warn("Watchlist API unreachable, saved locally only:", err);
  }
}


function updateWatchlistButtonState(key, added) {
  document.querySelectorAll(".btn-watchlist").forEach((btn) => {
    if (btn.dataset.key !== key) return;

    const icon = btn.querySelector(".btn-watchlist-icon");
    const label = btn.querySelector(".btn-watchlist-label");

    if (added) {
      btn.classList.add("btn-watchlist-added");
      if (icon) icon.textContent = "✓";
      if (label) label.textContent = "Added";
    } else {
      btn.classList.remove("btn-watchlist-added");
      if (icon) icon.textContent = "＋";
      if (label) label.textContent = "Watchlist";
    }
  });
}


async function removeFromWatchlistByKey(key) {
  if (!key) return;

  // ---- Local cache ----
  let list = getLegacyWatchlist();
  const item = list.find((m) => `${m.title} (${m.year})` === key);
  const tconst = item && item.tconst ? item.tconst : null;

  list = list.filter((m) => `${m.title} (${m.year})` !== key);
  setLegacyWatchlist(list);

  // ---- Server (Mongo) ----
  if (!isLoggedIn()) return;

  const user = getUser();
  const userId = user?.id || user?.user_id;
  if (!userId) return;

  try {
    await fetch(`${API_BASE}/api/watchlist/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, tconst }),
    });
  } catch (err) {
    console.warn("Failed to remove watchlist item on server:", err);
  }
}

async function renderWatchlistModal() {
  if (!watchlistModal || !watchlistBody) return;

  // Show modal + initial loading text
  watchlistModal.hidden = false;
  watchlistBody.innerHTML = "<p>Loading watchlist...</p>";

  let items = [];

  // ---- 1) Local cache (legacy) ----
  try {
    const legacy = getLegacyWatchlist();
    if (Array.isArray(legacy)) {
      items = [...legacy];
    }
  } catch (err) {
    console.warn("Failed to read legacy watchlist:", err);
  }

  // ---- 2) Server (Mongo) ----
  if (isLoggedIn()) {
    const user = getUser();
    const userId = user?.id || user?.user_id;

    if (userId) {
      try {
        const res = await fetch(`${API_BASE}/api/watchlist/${userId}`);
        if (res.ok) {
          const serverItems = await res.json();

          // merge local + server by key
          const byKey = new Map();

          for (const m of items) {
            const key = m.key || `${m.title} (${m.year})`;
            byKey.set(key, { ...m, key });
          }

          for (const m of serverItems || []) {
            const key = m.key || `${m.title} (${m.year})`;
            if (!byKey.has(key)) {
              byKey.set(key, { ...m, key });
            }
          }

          items = Array.from(byKey.values());

          // keep local cache in sync
          setLegacyWatchlist(items);
        } else {
          console.warn("Failed to fetch watchlist from server:", res.status);
        }
      } catch (err) {
        console.warn("Watchlist API unreachable:", err);
      }
    }
  }

  // ---- 3) Sync global watchlistKeys ----
  if (typeof watchlistKeys === "undefined") {
    window.watchlistKeys = new Set();
  }
  watchlistKeys = new Set(
    items.map((m) => m.key || `${m.title} (${m.year})`)
  );

  // ---- 4) Render list ----
  if (!items.length) {
    watchlistBody.innerHTML = "<p>Your watchlist is empty.</p>";
    return;
  }

  const listHtml = `
    <ul class="watchlist-list">
      ${items
        .map((movie) => {
          const key = movie.key || `${movie.title} (${movie.year})`;
          const title =
            escapeHtml(movie.title || movie.primaryTitle || "Untitled");
          const year = movie.year || movie.startYear || "";
          const rating =
            movie.rating ?? movie.averageRating ?? movie.ratingAvg ?? "";
          const metaPieces = [];
          if (year) metaPieces.push(year);
          if (rating) metaPieces.push(`⭐ ${rating}`);

          return `
            <li>
              <div class="watchlist-main">
                <div class="watchlist-title">${title}</div>
                <div class="watchlist-meta">
                  ${metaPieces.join(" • ")}
                </div>
              </div>
              <button class="remove-watchlist-btn"
                      data-key="${escapeHtml(key)}">
                Remove
              </button>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;

  watchlistBody.innerHTML = listHtml;
}


function openWatchlist() {
  if (!watchlistModal) return;
  renderWatchlistModal();
  watchlistModal.hidden = false;
  watchlistModal.setAttribute("aria-hidden", "false");
}

function closeWatchlist() {
  if (!watchlistModal) return;
  watchlistModal.hidden = true;
  watchlistModal.setAttribute("aria-hidden", "true");
}

if (watchlistClose) watchlistClose.addEventListener("click", closeWatchlist);
if (watchlistBackdrop)
  watchlistBackdrop.addEventListener("click", closeWatchlist);

/* one-time migration marker (kept for compatibility) */
function migrateListsToLegacyOnce() {
  if (!localStorage.getItem("__migrated_lists_to_legacy__")) {
    localStorage.setItem("__migrated_lists_to_legacy__", "1");
  }
}

if (watchlistBody) {
  watchlistBody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".remove-watchlist-btn");
    if (!btn) return;
    const key = btn.dataset.key;
    if (!key) return;
    await removeFromWatchlistByKey(key);
    updateWatchlistButtonState(key, false);  // reset buttons on main page
    await renderWatchlistModal();

  });
}

/* ================================
   REVIEWS (localStorage)
==================================*/

function getLocalReviews(tconst) {
  const all = JSON.parse(localStorage.getItem("reviews") || "{}");
  return all[tconst] || [];
}

function setLocalReviews(tconst, arr) {
  const all = JSON.parse(localStorage.getItem("reviews") || "{}");
  all[tconst] = arr;
  localStorage.setItem("reviews", JSON.stringify(all));
}

function upsertLocalReview(tconst, review) {
  const arr = getLocalReviews(tconst);
  const idx = arr.findIndex((r) => r.user_id === review.user_id);
  if (idx >= 0) arr[idx] = review;
  else arr.push(review);
  setLocalReviews(tconst, arr);
}

function deleteLocalReviewByUser(tconst, userId) {
  const arr = getLocalReviews(tconst).filter((r) => r.user_id !== userId);
  setLocalReviews(tconst, arr);
}

/* ================================
   SEARCH LOGS
==================================*/

async function logSearch(query) {
  const userId = getUserId();
  if (!userId) return;         // allow only logged-in users
  const q = (query || "").trim();
  if (!q) return;              // don't log empty strings

  try {
    await fetch(`${API_BASE}/api/search_logs/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q }),
    });
  } catch (err) {
    console.warn("Search log API unavailable", err);
  }
}


/* ================================
   FETCH HELPERS (backend API)
==================================*/

const API_BASE = "http://127.0.0.1:5000";

async function fetchData(endpoint, params = {}) {
  const url = new URL(`/api/${endpoint}`, API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("API error:", res.status, await res.text());
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error("Network or parsing error:", err);
    return [];
  }
}

function dedupeByUserKeepLatest(list) {
  const map = new Map();
  for (const r of list) {
    const k = r.user_id ?? "_";
    const prev = map.get(k);
    if (!prev || new Date(r.created_at) > new Date(prev.created_at)) {
      map.set(k, r);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

async function fetchReviews(tconst) {
  const others = FALLBACK_REVIEWS[tconst] || [];
  let server = [];

  try {
    const res = await fetch(`${API_BASE}/api/reviews/${encodeURIComponent(tconst)}`);
    if (res.ok) {
      server = await res.json();
    } else {
      console.warn("Reviews API error", res.status);
    }
  } catch (err) {
    console.warn("Reviews API unreachable, falling back to local only:", err);
  }

  const mine = getLocalReviews(tconst);
  // Merge precedence: local > server > hard-coded
  return dedupeByUserKeepLatest([...server, ...others, ...mine]);
}

/* ================================
   PAGINATION ENGINE (client-side)
================================ */

function paginate(array, page = 1, perPage = 12) {
  const total = array.length;
  const pages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  return {
    page,
    perPage,
    total,
    pages,
    items: array.slice(start, start + perPage)
  };
}

function renderPagination(container, pages, current, callback) {
  if (!container) return;
  if (pages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";

  if (current > 1)
    html += `<button data-page="${current - 1}">‹ Prev</button>`;

  for (let i = 1; i <= pages; i++) {
    html += `<button data-page="${i}" class="${i === current ? "active" : ""}">${i}</button>`;
  }

  if (current < pages)
    html += `<button data-page="${current + 1}">Next ›</button>`;

  container.innerHTML = html;

  container.onclick = (e) => {
    const btn = e.target.closest("button[data-page]");
    if (!btn) return;
    const pg = Number(btn.dataset.page);
    callback(pg);
  };
}

/* ================================
   RENDER HELPERS
==================================*/

let currentMovies = [];

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderMovies(movies) {
  currentMovies = movies;

  if (!movies.length) {
    moviesContainer.innerHTML = "<p>No movies found.</p>";
    moviesCount.textContent = "0 result(s)";
    return;
  }

  const canWatchlist = isLoggedIn();

  moviesContainer.innerHTML = movies
    .map((m) => {
      const key = `${m.title} (${m.year})`;
      const genresStr = Array.isArray(m.genres)
        ? m.genres.join(", ")
        : m.genre || "";
      const ratingVal = m.rating ?? m.averageRating ?? m.ratingAvg ?? "";
      const escapedTitle = escapeHtml(m.title);
      const escapedKey = escapeHtml(key);

      // --- NEW: determine if already in watchlist ---
      const inWatchlist =
        typeof watchlistKeys !== "undefined" &&
        watchlistKeys.has(key);

      // --- UPDATED BUTTON HTML ---
      const addBtnHtml = canWatchlist
        ? `
          <button
            class="btn-watchlist ${inWatchlist ? "btn-watchlist-added" : ""}"
            title="${inWatchlist ? `In Watchlist` : `Add ${escapedTitle} to watchlist`}"
            aria-label="Add ${escapedTitle} to watchlist"
            data-key="${escapedKey}"
          >
            <span class="btn-watchlist-icon">
              ${inWatchlist ? "✓" : "＋"}
            </span>
            <span class="btn-watchlist-label">
              ${inWatchlist ? "Added" : "Watchlist"}
            </span>
          </button>
        `
        : ""; // not logged in → hide button

      return `
        <article class="card media-card"
                 data-key="${escapedKey}"
                 tabindex="0"
                 role="button"
                 aria-label="Open ${escapedTitle}">
          <div class="media-main">
            <div class="media-title">${escapedTitle}</div>
            <div class="media-meta">
              ${m.year} • ${escapeHtml(genresStr)}${
                ratingVal ? ` • ⭐ ${ratingVal}` : ""
              }
            </div>
          </div>
          ${addBtnHtml}
        </article>
      `;
    })
    .join("");

  moviesCount.textContent = `${movies.length} result(s)`;
}



function renderActors(people) {
  if (!people.length) {
    actorsContainer.innerHTML = "<p>No people found.</p>";
    actorsCount.textContent = "0 result(s)";
    return;
  }

  actorsContainer.innerHTML = people
    .map((p) => {
      const life =
        p.deathYear === null || typeof p.deathYear === "undefined"
          ? `b. ${p.birthYear}`
          : `${p.birthYear}–${p.deathYear}`;
      const prof = (p.professions || []).join(", ");

      return `
        <article class="card media-card">
          <div class="media-main">
            <div class="media-title">${escapeHtml(p.primaryName)}</div>
            <div class="media-meta">
              ${life}${prof ? " • " + escapeHtml(prof) : ""}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  actorsCount.textContent = `${people.length} result(s)`;
}


function renderGenres(genres) {
  if (!genres.length) {
    genresContainer.innerHTML = "<p>No genres found.</p>";
    genresCount.textContent = "0 result(s)";
    return;
  }

  genresContainer.innerHTML = genres
    .map(
      (g) => `
      <article class="card"
               data-genre="${escapeHtml(g.name)}"
               tabindex="0"
               role="button"
               aria-label="Show standout movies for ${escapeHtml(g.name)}">
        <h2>${escapeHtml(g.name)}</h2>
        <p class="meta">ID: ${g.genreID}</p>
      </article>
    `
    )
    .join("");

  genresCount.textContent = `${genres.length} result(s)`;
}

function renderTopUserRated(list) {
  if (!topUserContainer || !topUserCount) return;

  if (!list.length) {
    topUserContainer.innerHTML = "<p>No user-rated movies yet.</p>";
    topUserCount.textContent = "0 result(s)";
    return;
  }

  topUserContainer.innerHTML = list
    .map((m) => {
      const key = `${m.title} (${m.year})`;
      const genresStr = Array.isArray(m.genres)
        ? m.genres.join(", ")
        : m.genre || "";
      const ratingUsers = m.rating_users ?? "";
      const ratingSystem = m.rating_system ?? "";

      const ratingLine = [
        ratingUsers ? `User ★ ${ratingUsers}` : "",
        ratingSystem ? `IMDb ★ ${ratingSystem}` : "",
      ]
        .filter(Boolean)
        .join(" • ");

      const escapedTitle = escapeHtml(m.title);

      return `
        <article class="card"
                 data-key="${escapeHtml(key)}"
                 tabindex="0"
                 role="button"
                 aria-label="Open ${escapedTitle}">
          <h2>${escapedTitle}</h2>
          <p class="meta">
            ${m.year} • ${escapeHtml(genresStr)}${
              ratingLine ? " • " + ratingLine : ""
            }
          </p>
        </article>
      `;
    })
    .join("");

  topUserCount.textContent = `${list.length} result(s)`;
}

/* ==========
   PAGED WRAPPERS
========== */

let moviesRaw = [];
let moviesPage = 1;

function renderMoviesPaged(list, page = 1) {
  moviesRaw = list;
  moviesPage = page;

  const p = paginate(list, page, 14);
  renderMovies(p.items);

  renderPagination(
    document.getElementById("movies-pagination"),
    p.pages,
    p.page,
    (pg) => renderMoviesPaged(moviesRaw, pg)
  );
}

let actorsRaw = [];
let actorsPage = 1;

function renderActorsPaged(list, page = 1) {
  actorsRaw = list;
  actorsPage = page;

  const p = paginate(list, page, 15);
  renderActors(p.items);

  renderPagination(
    document.getElementById("actors-pagination"),
    p.pages,
    p.page,
    (pg) => renderActorsPaged(actorsRaw, pg)
  );
}

let genresRaw = [];
let genresPage = 1;

function renderGenresPaged(list, page = 1) {
  genresRaw = list;
  genresPage = page;

  const p = paginate(list, page, 30);
  renderGenres(p.items);

  renderPagination(
    document.getElementById("genres-pagination"),
    p.pages,
    p.page,
    (pg) => renderGenresPaged(genresRaw, pg)
  );
}

let topUserRaw = [];
let topUserPage = 1;

function renderTopUserRatedPaged(list, page = 1) {
  topUserRaw = list;
  topUserPage = page;

  const p = paginate(list, page, 12);
  renderTopUserRated(p.items);

  renderPagination(
    document.getElementById("topuser-pagination"),
    p.pages,
    p.page,
    (pg) => renderTopUserRatedPaged(topUserRaw, pg)
  );
}

// === Top User Rated horizontal nav ===
const topUserPrev = document.querySelector(".topuser-prev");
const topUserNext = document.querySelector(".topuser-next");

function updateTopUserNavState() {
  if (!topUserContainer || !topUserPrev || !topUserNext) return;

  const maxScroll = topUserContainer.scrollWidth - topUserContainer.clientWidth;
  const x = topUserContainer.scrollLeft || 0;

  topUserPrev.disabled = x <= 1;
  topUserNext.disabled = x >= maxScroll - 1;
}

if (topUserContainer && topUserPrev && topUserNext) {
  const scrollAmount = () =>
    Math.max(260, Math.floor(topUserContainer.clientWidth * 0.9));

  topUserPrev.addEventListener("click", () => {
    topUserContainer.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
  });

  topUserNext.addEventListener("click", () => {
    topUserContainer.scrollBy({ left: scrollAmount(), behavior: "smooth" });
  });

  topUserContainer.addEventListener("scroll", updateTopUserNavState);

  requestAnimationFrame(updateTopUserNavState);
}


/* ================================
   DROPDOWNS
==================================*/

function populateDropdowns(movies) {
  const genres = Array.from(
    new Set(
      movies.flatMap((m) =>
        Array.isArray(m.genres)
          ? m.genres
          : m.genre
          ? [m.genre]
          : []
      )
    )
  ).sort();

  genreMenu.innerHTML = genres
    .map(
      (g) =>
        `<span role="menuitem" tabindex="0">${escapeHtml(g)}</span>`
    )
    .join("");

  yearMenu.innerHTML = YEAR_RANGES.map(
    (range) => `
    <span role="menuitem" tabindex="0"
          data-start="${range.start}"
          data-end="${range.end}">
      ${range.label}
    </span>
  `
  ).join("");

  ratingMenu.innerHTML = `
    <span role="menuitem" tabindex="0" data-min="9">9+</span>
    <span role="menuitem" tabindex="0" data-min="8">8+</span>
    <span role="menuitem" tabindex="0" data-min="7">7+</span>
    <span role="menuitem" tabindex="0" data-min="0">All</span>
  `;
}

function wireDropdownMenu(menu, callback) {
  if (!menu) return;
  menu.addEventListener("click", (e) => {
    const item = e.target.closest("[role='menuitem']");
    if (!item) return;
    callback(item);
  });
  menu.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const item = e.target.closest("[role='menuitem']");
    if (!item) return;
    e.preventDefault();
    callback(item);
  });
}

wireDropdownMenu(genreMenu, (item) => {
  const genreName = item.textContent.trim();
  filterMovies({ genre: genreName });
});

wireDropdownMenu(yearMenu, (item) => {
  const start = Number(item.dataset.start);
  const end = Number(item.dataset.end);
  filterMovies({ year_start: start, year_end: end });
});

wireDropdownMenu(ratingMenu, (item) => {
  const min = Number(item.dataset.min);
  filterMovies({ min_rating: min });
});

/* click-to-open for Genre / Year / Rating dropdowns */
document.querySelectorAll(".dropbtn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = btn.nextElementSibling;
    if (!dropdown || !dropdown.classList.contains("dropdown-content")) return;

    const isOpen = dropdown.style.display === "block";

    if (isOpen) {
      // clicking again closes it
      closeAllDropdowns();
    } else {
      // close others, then open this one
      closeAllDropdowns(dropdown);
      btn.setAttribute("aria-expanded", "true");
      dropdown.style.display = "block";
      requestAnimationFrame(() => {
        dropdown.style.opacity = "1";
        dropdown.style.transform = "translateY(0)";
      });
    }
  });
});


/* prevent clicks inside dropdown menus from bubbling up and closing them */
document.querySelectorAll(".dropdown-content").forEach((menu) => {
  menu.addEventListener("click", (e) => e.stopPropagation());
  menu.addEventListener("keydown", (e) => e.stopPropagation());
});

/* ================================
   MOVIE MODAL + REVIEWS
==================================*/

function openMovieModal() {
  movieModal.hidden = false;
  movieModal.setAttribute("aria-hidden", "false");
  setTimeout(() => movieClose?.focus(), 50);
}

function closeMovieModal() {
  movieModal.hidden = true;
  movieModal.setAttribute("aria-hidden", "true");
}

if (movieClose) movieClose.addEventListener("click", closeMovieModal);
if (movieBackdrop)
  movieBackdrop.addEventListener("click", closeMovieModal);

function renderReviews(list) {
  const logged = isLoggedIn();
  const user = getUser();
  const myId = user?.id || user?.user_id;

  if (!list.length) {
    reviewsList.innerHTML = "<p>No reviews yet.</p>";
  } else {
    reviewsList.innerHTML = list
      .map((r) => {
        const ts = new Date(r.created_at).toLocaleString();
        const owner = r.user_id === myId;
        const displayName = r.username || r.display_name || `User ${r.user_id}`;
        const spoilerClass = r.spoiler ? "spoiler-review" : "";
        const spoilerLabel = r.spoiler
          ? `<span class="pill pill-spoiler">Spoiler</span>`
          : "";
        const stars =
          "★".repeat(r.stars) + "☆".repeat(10 - r.stars);
        const tags = (r.tags || [])
          .map(
            (t) =>
              `<span class="pill pill-tag">${escapeHtml(
                t
              )}</span>`
          )
          .join(" ");
        const ownerActions = owner
          ? `
              <button class="review-edit-btn" data-user="${r.user_id}">Edit</button>
              <button class="review-delete-btn" data-user="${r.user_id}">Delete</button>
            `
          : "";
        return `
          <article class="review ${spoilerClass}">
            <header>
              <span class="review-user">${escapeHtml(displayName)}</span>
              <span class="review-stars">${stars}</span>
              ${spoilerLabel}
              <time datetime="${r.created_at}">${ts}</time>
            </header>
            <p>${escapeHtml(r.text)}</p>
            <footer>
              ${tags}
              ${ownerActions}
            </footer>
          </article>
        `;
      })
      .join("");
  }

  if (!logged) {
    reviewText.disabled = true;
    reviewTags.disabled = true;
    spoilerCheckbox.disabled = true;
    starHint.textContent = "Login to rate & review";
    if (starContainer) {
      starContainer
        .querySelectorAll(".star")
        .forEach((s) => (s.disabled = true));
    }
  } else {
    reviewText.disabled = false;
    reviewTags.disabled = false;
    spoilerCheckbox.disabled = false;
    if (starContainer) {
      starContainer
        .querySelectorAll(".star")
        .forEach((s) => (s.disabled = false));
    }
  }
}

function wireStarEvents() {
  if (!starContainer) return;
  const stars = Array.from(
    starContainer.querySelectorAll(".star")
  );

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const value = Number(star.dataset.value);
      starContainer.setAttribute("data-value", String(value));
      stars.forEach((s) => {
        const sVal = Number(s.dataset.value);
        const active = sVal <= value;
        s.textContent = active ? "★" : "☆";
        s.setAttribute("aria-checked", active ? "true" : "false");
      });
      starHint.textContent = `You rated: ${value}/10`;
    });
  });
}

async function renderMovieDetail(movie) {
  try {
    const tconst =
      movie.tconst || `${movie.title} (${movie.year})`;
    movieTitle.textContent = movie.title;

    const genresStr = Array.isArray(movie.genres)
      ? movie.genres.join(", ")
      : movie.genre || "";
    const ratingVal =
      movie.ratingAvg ?? movie.rating ?? movie.averageRating ?? "";

    const metaBits = [
      movie.year || "",
      genresStr,
      ratingVal ? `⭐ ${ratingVal}` : ""
    ].filter(Boolean);

    movieMeta.textContent = metaBits.join(" • ");

    openMovieModal();

    const list = await fetchReviews(tconst);
    renderReviews(list);
    wireStarEvents();

    const user = getUser();
    const myId = user?.id || user?.user_id || 42;
    const displayName =
      user?.display_name ||
      user?.username ||
      (user?.email ? user.email.split("@")[0] : null) ||
      `User ${myId}`;
    const myExisting = list.find((r) => r.user_id === myId);

    // pre-fill if exists
    if (myExisting) {
      reviewText.value = myExisting.text || "";
      spoilerCheckbox.checked = !!myExisting.spoiler;
      reviewTags.value = (myExisting.tags || []).join(", ");
      const stars = myExisting.stars || 0;
      starContainer.setAttribute("data-value", String(stars));
      const starsEls = Array.from(
        starContainer.querySelectorAll(".star")
      );
      starsEls.forEach((s) => {
        const v = Number(s.dataset.value);
        const active = v <= stars;
        s.textContent = active ? "★" : "☆";
        s.setAttribute("aria-checked", active ? "true" : "false");
      });
      starHint.textContent = `You rated: ${stars}/10`;
    } else {
      reviewText.value = "";
      spoilerCheckbox.checked = false;
      reviewTags.value = "";
      starContainer.setAttribute("data-value", "0");
      Array.from(starContainer.querySelectorAll(".star")).forEach(
        (s) => {
          s.textContent = "☆";
          s.setAttribute("aria-checked", "false");
        }
      );
      starHint.textContent = "Click a star to rate";
    }

    // submit handler
    if (reviewForm) {
      reviewForm.onsubmit = async (e) => {
        e.preventDefault();
        reviewError.textContent = "";

        if (!isLoggedIn()) {
          alert("Please log in to submit a review.");
          return;
        }

        const starsVal = Number(
          starContainer.getAttribute("data-value") || "0"
        );
        if (!starsVal || starsVal < 1) {
          reviewError.textContent =
            "Please choose a rating (1–10 stars).";
          return;
        }

        const text = reviewText.value.trim();
        if (!text) {
          reviewError.textContent = "Review text cannot be empty.";
          return;
        }

        const tags = reviewTags.value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const spoiler = spoilerCheckbox.checked;
        const now = new Date().toISOString();

        const review = {
          user_id: myId,
          username: displayName,
          stars: starsVal,
          text,
          spoiler,
          tags,
          created_at: now
        };

        const existing = await fetchReviews(tconst);
        const already = existing.find((r) => r.user_id === myId);
        if (already) {
          const overwrite = confirm(
            "You already have a review. Overwrite it?"
          );
          if (!overwrite) return;
        }

        try {
          const res = await fetch(
            `${API_BASE}/api/reviews/${encodeURIComponent(tconst)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(review),
            }
          );
          if (!res.ok) {
            console.warn("Failed to save review to server", res.status);
          }
        } catch (err) {
          console.warn("Reviews API unreachable, saving locally only:", err);
        }

        upsertLocalReview(tconst, review);

        const updated = await fetchReviews(tconst);
        renderReviews(updated);
        alert("Review saved.");
      };
    }

    // edit / delete inline
    reviewsList.onclick = async (e) => {
      const userObj = getUser();
      const myId2 = userObj?.id || userObj?.user_id || 42;

      const delBtn = e.target.closest(".review-delete-btn");
      const editBtn = e.target.closest(".review-edit-btn");

      if (!delBtn && !editBtn) return;

      if (delBtn) {
        const uid = Number(delBtn.dataset.user);
        if (uid !== myId2) {
          alert("You can only delete your own review.");
          return;
        }
        const ok = confirm("Delete your review?");
        if (!ok) return;
        try {
          await fetch(
            `${API_BASE}/api/reviews/${encodeURIComponent(tconst)}/${myId2}`,
            { method: "DELETE" }
          );
        } catch (err) {
          console.warn("Failed to delete review on server:", err);
        }

        deleteLocalReviewByUser(tconst, myId2);

        const updated = await fetchReviews(tconst);
        renderReviews(updated);
      } else if (editBtn) {
        const uid = Number(editBtn.dataset.user);
        if (uid !== myId2) {
          alert("You can only edit your own review.");
          return;
        }
        const existing = (await fetchReviews(tconst)).find(
          (r) => r.user_id === myId2
        );
        if (!existing) return;

        reviewText.value = existing.text || "";
        spoilerCheckbox.checked = !!existing.spoiler;
        reviewTags.value = (existing.tags || []).join(", ");
        const stars = existing.stars || 0;
        starContainer.setAttribute("data-value", String(stars));
        const starsEls = Array.from(
          starContainer.querySelectorAll(".star")
        );
        starsEls.forEach((s) => {
          const v = Number(s.dataset.value);
          const active = v <= stars;
          s.textContent = active ? "★" : "☆";
          s.setAttribute(
            "aria-checked",
            active ? "true" : "false"
          );
        });
        starHint.textContent = `You rated: ${stars}/10`;
        reviewText.focus();
      }
    };
  } catch (err) {
    console.error("Error rendering movie modal:", err);
  }
}

/* ================================
   FILTER / LOAD
==================================*/

async function filterMovies(params) {
  try {
    const data = await fetchData("movies", params);
    renderMoviesPaged(data);
  } catch (err) {
    console.error("Error filtering movies:", err);
    moviesContainer.innerHTML =
      "<p>Error loading movies. Please try again.</p>";
  }
}

async function filterAboveGenreAvg(genreName) {
  try {
    const payload = await fetchData("movies/above_genre_avg", {
      genre: genreName,
      min_votes: 50,
    });

    const data = payload.movies || [];
    const genreAvg = payload.genreAvg;

    renderMoviesPaged(data);

    if (moviesCount) {
      let text = `${data.length} standout result(s) for "${genreName}"`;
      if (typeof genreAvg === "number") {
        text += ` (above genre average: ${genreAvg.toFixed(2)})`;
      } else {
        text += ` (above genre average)`;
      }
      moviesCount.textContent = text;
    }
  } catch (err) {
    console.error("Error loading standout movies:", err);
    moviesContainer.innerHTML =
      "<p>Error loading standout movies. Please try again.</p>";
  }
}

async function loadAll() {
  populateProfileMenu();

  try {
    const [movies, people, genres, topUser] = await Promise.all([
      fetchData("movies"),
      fetchData("actors"),
      fetchData("genres"),
      fetchData("top_user_rated", { limit: 10, min_reviews: 2 }),
    ]);

    renderMoviesPaged(movies);
    populateDropdowns(movies);
    renderActorsPaged(people);
    renderGenresPaged(genres);
    renderTopUserRatedPaged(topUser);
  } catch (err) {
    console.error("Error loading data:", err);
  }
}


/* ================================
   GLOBAL EVENTS
==================================*/

function hasActiveFilters(p) {
  return !!(
    p.genre ||
    p.min_rating ||
    p.year_start ||
    p.year_end
  );
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim();

    // still send full params to backend if you want
    filterMovies({ q });

    clearTimeout(searchLogTimeout);
    searchLogTimeout = setTimeout(() => {
      if (q.length < 2) return;  // ignore 1-letter noise
      logSearch(q);
    }, 600); // user paused typing
  });
}

if (homeLogo) {
  homeLogo.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    loadAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (moviesContainer) {
  moviesContainer.addEventListener("click", async (e) => {
    const addBtn = e.target.closest(".btn-watchlist");
    if (addBtn) {
  const key = addBtn.dataset.key;
  const movie = currentMovies.find((m) => `${m.title} (${m.year})` === key);
  if (movie) {
    await addToWatchlist(movie);
    updateWatchlistButtonState(key, true);
  }
  return;
}


    const card = e.target.closest(".media-card");
    if (card) {
      const key = card.dataset.key;
      const movie = currentMovies.find(
        (m) => `${m.title} (${m.year})` === key
      );
      if (movie) await renderMovieDetail(movie);
    }
  });

  moviesContainer.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".media-card");
    if (!card) return;
    e.preventDefault();
    const key = card.dataset.key;
    const movie = currentMovies.find(
      (m) => `${m.title} (${m.year})` === key
    );
    if (movie) await renderMovieDetail(movie);
  });
}


if (genresContainer) {
  // Click with mouse
  genresContainer.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const genreName = card.dataset.genre;
    if (!genreName) return;

    filterAboveGenreAvg(genreName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Keyboard (Enter / Space)
  genresContainer.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card");
    if (!card) return;
    e.preventDefault();
    const genreName = card.dataset.genre;
    if (!genreName) return;

    filterAboveGenreAvg(genreName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ================================
   SEARCH HISTORY MODAL
==================================*/

function formatSearchTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

async function renderSearchLogModal() {
  if (!searchLogBody) return;

  const user = getUser();
  if (!user) {
    searchLogBody.innerHTML = "<p>Please log in to see your search history.</p>";
    return;
  }

  const userId = user.id || user.user_id;
  if (!userId) {
    searchLogBody.innerHTML = "<p>Unable to determine user id.</p>";
    return;
  }

  searchLogBody.innerHTML = "<p>Loading search history…</p>";

  try {
    const [userRes, trendingRes] = await Promise.all([
      fetch(`${API_BASE}/api/search_logs/${encodeURIComponent(userId)}`),
      fetch(`${API_BASE}/api/search_trending`),
    ]);

    let userData = [];
    let trendingData = [];

    if (userRes.ok) {
      userData = (await userRes.json().catch(() => [])) || [];
    }
    if (trendingRes.ok) {
      trendingData = (await trendingRes.json().catch(() => [])) || [];
    }

    if (!userRes.ok && !trendingRes.ok) {
      searchLogBody.innerHTML =
        "<p>Error loading search history. Please try again.</p>";
      return;
    }

    if (!Array.isArray(userData)) userData = [];
    if (!Array.isArray(trendingData)) trendingData = [];

    // Newest first for personal history
    userData.sort((a, b) => new Date(b.ts) - new Date(a.ts));

    const sections = [];

    // --- Your search history ---
    if (userData.length) {
      sections.push(`
        <h3>Your recent searches</h3>
        <table class="user-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Query</th>
            </tr>
          </thead>
          <tbody>
            ${userData
              .map(
                (log) => `
              <tr>
                <td>${formatSearchTime(log.ts)}</td>
                <td>${escapeHtml(log.q || "")}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `);
    } else {
      sections.push("<p>No searches logged for your account yet.</p>");
    }

    // --- Trending searches (last N days via TTL) ---
    if (trendingData.length) {
      sections.push(`
        <h3 style="margin-top:1rem;">Trending searches (last 7 days)</h3>
        <table class="user-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Query</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            ${trendingData
              .map(
                (row, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${escapeHtml(row.q || "")}</td>
                <td>${row.count ?? 0}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `);
    }

    searchLogBody.innerHTML =
      sections.join("") || "<p>No searches logged yet.</p>";
  } catch (err) {
    console.error("Error loading search logs:", err);
    searchLogBody.innerHTML =
      "<p>Server unavailable. Please try again later.</p>";
  }
}

function openSearchLogModal() {
  if (!searchLogModal) return;
  renderSearchLogModal();
  searchLogModal.hidden = false;
  searchLogBackdrop.hidden = false;
  searchLogModal.setAttribute("aria-hidden", "false");
}

function closeSearchLogModal() {
  if (!searchLogModal) return;
  searchLogModal.hidden = true;
  searchLogBackdrop.hidden = true;
  searchLogModal.setAttribute("aria-hidden", "true");
}

/* close via X and backdrop */
if (searchLogClose) {
  searchLogClose.addEventListener("click", closeSearchLogModal);
}
if (searchLogBackdrop) {
  searchLogBackdrop.addEventListener("click", closeSearchLogModal);
}

/* button next to search bar */
if (searchHistoryBtn) {
  searchHistoryBtn.addEventListener("click", () => {
    if (!isLoggedIn()) {
      window.location.href = "login.html";
      return;
    }
    openSearchLogModal();
  });
}

/* ================================
   BOOT
==================================*/

migrateListsToLegacyOnce();
loadAll();
