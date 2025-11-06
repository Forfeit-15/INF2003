/* =========================================================
   Mini IMDB – Frontend-Only App (SQL/NoSQL aligned fallbacks)
   - NO BACKEND CALLS (pure front-end)
   - Reviews: NoSQL-shaped, 1-per-user per tconst with overwrite prompt, delete
   - Watchlist: LEGACY first (localStorage.watchlist) + mirror to NoSQL Lists
   - Search logs: NoSQL-shaped (localStorage.search_logs)
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

const searchInput = document.getElementById("search-input");

const genreMenu = document.getElementById("genre-menu");
const yearMenu = document.getElementById("year-menu");
const ratingMenu = document.getElementById("rating-menu");

const homeLogo = document.getElementById("home-logo");

// Profile + watchlist
const profileBtn = document.getElementById("profile-btn");
const profileMenu = document.getElementById("profile-menu");
const watchlistModal = document.getElementById("watchlist-modal");
const watchlistBackdrop = document.getElementById("watchlist-backdrop");
const watchlistClose = document.getElementById("watchlist-close");
const watchlistBody = document.getElementById("watchlist-body");

// Movie detail + reviews
const movieModal = document.getElementById("movie-modal");
const movieBackdrop = document.getElementById("movie-backdrop");
const movieClose = document.getElementById("movie-close");
const movieTitle = document.getElementById("movie-title");
const movieMeta = document.getElementById("movie-meta");
const reviewsList = document.getElementById("reviews-list");
const reviewForm = document.getElementById("review-form");
const reviewText = document.getElementById("review-text");
const reviewTags = document.getElementById("review-tags");
const reviewSpoiler = document.getElementById("review-spoiler");
const reviewError = document.getElementById("review-error");
const starRating = document.getElementById("star-rating");
const starHint = document.getElementById("star-hint");

/* ================================
   CONSTANTS / FALLBACK (SQL-shaped)
==================================*/
const YEAR_RANGES = [
  { label: "2020 — 2025", start: 2020, end: 2025 },
  { label: "2010 — 2019", start: 2010, end: 2019 },
  { label: "2000 — 2009", start: 2000, end: 2009 },
  { label: "1990 — 1999", start: 1990, end: 1999 },
  { label: "Before 1990", start: 0, end: 1989 },
];

/* ---------- SQL tables (fallback) ---------- */
const SQL_TITLE = [
  { tconst: "tt1375666", titleType: "movie", primaryTitle: "Inception", originalTitle: "Inception", isAdult: 0, startYear: 2010, endYear: null, runtimeMinutes: 148 },
  { tconst: "tt0468569", titleType: "movie", primaryTitle: "The Dark Knight", originalTitle: "The Dark Knight", isAdult: 0, startYear: 2008, endYear: null, runtimeMinutes: 152 },
  { tconst: "tt0816692", titleType: "movie", primaryTitle: "Interstellar", originalTitle: "Interstellar", isAdult: 0, startYear: 2014, endYear: null, runtimeMinutes: 169 },
  { tconst: "tt6751668", titleType: "movie", primaryTitle: "Parasite", originalTitle: "Gisaengchung", isAdult: 0, startYear: 2019, endYear: null, runtimeMinutes: 132 },
  { tconst: "tt0120338", titleType: "movie", primaryTitle: "Titanic", originalTitle: "Titanic", isAdult: 0, startYear: 1997, endYear: null, runtimeMinutes: 194 },
];

const SQL_GENRE = [
  { genreID: 1, genreName: "Action" },
  { genreID: 2, genreName: "Sci-Fi" },
  { genreID: 3, genreName: "Drama" },
  { genreID: 4, genreName: "Thriller" },
  { genreID: 5, genreName: "Romance" },
];

const SQL_HAS_GENRE = [
  { tconst: "tt1375666", genreID: 2 }, { tconst: "tt1375666", genreID: 4 },
  { tconst: "tt0468569", genreID: 1 }, { tconst: "tt0468569", genreID: 3 },
  { tconst: "tt0816692", genreID: 2 }, { tconst: "tt0816692", genreID: 3 },
  { tconst: "tt6751668", genreID: 4 }, { tconst: "tt6751668", genreID: 3 },
  { tconst: "tt0120338", genreID: 5 }, { tconst: "tt0120338", genreID: 3 },
];

const SQL_RATING = [
  { tconst: "tt1375666", averageRating: 8.8, numVotes: 2400000 },
  { tconst: "tt0468569", averageRating: 9.0, numVotes: 2800000 },
  { tconst: "tt0816692", averageRating: 8.6, numVotes: 1900000 },
  { tconst: "tt6751668", averageRating: 8.6, numVotes: 900000 },
  { tconst: "tt0120338", averageRating: 7.9, numVotes: 1300000 },
];

const SQL_TITLE_AKAS = {
  tt1375666: [
    { titleId: "tt1375666", ordering: 1, title: "Inception", region: "US", language: "en", types: ["imdbDisplay"], attributes: [], isOriginalTitle: true },
    { titleId: "tt1375666", ordering: 2, title: "Origin", region: "JP", language: "ja", types: ["working"], attributes: [], isOriginalTitle: false }
  ],
  tt0120338: [
    { titleId: "tt0120338", ordering: 1, title: "Titanic", region: "US", language: "en", types: ["imdbDisplay"], attributes: [], isOriginalTitle: true }
  ]
};

const SQL_PERSON = [
  { nconst: "nm0000138", primaryName: "Leonardo DiCaprio", birthYear: 1974, deathYear: null },
  { nconst: "nm0000288", primaryName: "Christopher Nolan", birthYear: 1970, deathYear: null },
  { nconst: "nm0000198", primaryName: "Kate Winslet", birthYear: 1975, deathYear: null },
  { nconst: "nm0000114", primaryName: "James Cameron", birthYear: 1954, deathYear: null },
  { nconst: "nm0814280", primaryName: "Song Kang-ho", birthYear: 1967, deathYear: null },
];

const SQL_PROFESSION = [
  { professionID: 1, professionName: "actor" },
  { professionID: 2, professionName: "actress" },
  { professionID: 3, professionName: "director" },
  { professionID: 4, professionName: "writer" },
];

const SQL_HAS_PROFESSION = [
  { nconst: "nm0000138", professionID: 1 },
  { nconst: "nm0000288", professionID: 3 },
  { nconst: "nm0000198", professionID: 2 },
  { nconst: "nm0000114", professionID: 3 }, { nconst: "nm0000114", professionID: 4 },
  { nconst: "nm0814280", professionID: 1 },
];

const SQL_PRINCIPALS = [
  { tconst: "tt1375666", nconst: "nm0000288", ordering: 1, category: "director", job: null, characterName: null },
  { tconst: "tt1375666", nconst: "nm0000138", ordering: 2, category: "actor", job: null, characterName: "Cobb" },
  { tconst: "tt0120338", nconst: "nm0000114", ordering: 1, category: "director", job: null, characterName: null },
  { tconst: "tt0120338", nconst: "nm0000198", ordering: 2, category: "actress", job: null, characterName: "Rose" },
];

/* ---------- NoSQL Reviews (fallback) ---------- */
const FALLBACK_REVIEWS = {
  tt1375666: [
    { user_id: 7,  stars: 9, text: "Mind-bending score and pacing.", tags: ["soundtrack", "pacing"], spoiler: false, created_at: "2025-10-01T12:45:00Z" },
    { user_id: 12, stars: 9, text: "Dream layers still hold up.",     tags: ["concept"],             spoiler: false, created_at: "2025-11-01T08:12:00Z" },
  ],
  tt0468569: [
    { user_id: 23, stars: 10, text: "Ledger's Joker is unmatched.", tags: ["performance"], spoiler: false, created_at: "2025-09-20T10:00:00Z" },
  ],
};

/* ================================
   AUTH / USER HELPERS
==================================*/
const isLoggedIn = () => !!localStorage.getItem("user");
function getUserId() {
  const raw = localStorage.getItem("user");
  if (!raw) return 42; // stable demo id so features work logged-out
  try {
    const u = JSON.parse(raw);
    return (u && (u.user_id ?? u.id)) ?? 42;
  } catch { return 42; }
}

/* ================================
   WATCHLIST (legacy-first + NoSQL mirror)
==================================*/
// Legacy store (what the UI reads/writes)
function getLegacyWatchlist() {
  try { return JSON.parse(localStorage.getItem("watchlist") || "[]"); }
  catch { return []; }
}
function setLegacyWatchlist(arr) {
  localStorage.setItem("watchlist", JSON.stringify(arr));
}
// NoSQL Lists doc (mirror only; per-user)
function getListDoc() {
  const user_id = getUserId();
  const all = JSON.parse(localStorage.getItem("lists") || "{}");
  if (!all[user_id]) {
    all[user_id] = { user_id, items: [], created_at: new Date().toISOString() };
    localStorage.setItem("lists", JSON.stringify(all));
  }
  return all[user_id];
}
function setListDoc(doc) {
  const all = JSON.parse(localStorage.getItem("lists") || "{}");
  all[doc.user_id] = doc;
  localStorage.setItem("lists", JSON.stringify(all));
}
function resolveTconst(movie) {
  if (movie.tconst) return movie.tconst;
  const t = SQL_TITLE.find(tt => tt.primaryTitle === movie.title && tt.startYear === movie.year);
  return t?.tconst || null;
}
// Add to legacy + mirror to Lists
function addToWatchlist(movie) {
  const list = getLegacyWatchlist();
  const key = `${movie.title} (${movie.year})`;
  const exists = list.some(m => (m.tconst && movie.tconst)
    ? m.tconst === movie.tconst
    : `${m.title} (${m.year})` === key);
  if (!exists) {
    list.push(movie);
    setLegacyWatchlist(list);
  }
  // Mirror
  const tconst = resolveTconst(movie);
  if (tconst) {
    const doc = getListDoc();
    if (!doc.items.some(i => i.tconst === tconst)) {
      doc.items.push({ tconst, added_at: new Date().toISOString(), note: "" });
      setListDoc(doc);
    }
  }
}
// Remove from legacy + mirror
function removeFromWatchlistByKeyOrTconst({ key, tconst }) {
  let list = getLegacyWatchlist();
  list = list.filter(m => {
    const mKey = `${m.title} (${m.year})`;
    const matchByKey = key ? (mKey === key) : false;
    const matchByTconst = tconst ? (m.tconst ? m.tconst === tconst : resolveTconst(m) === tconst) : false;
    return !(matchByKey || matchByTconst);
  });
  setLegacyWatchlist(list);
  if (tconst) {
    const doc = getListDoc();
    doc.items = doc.items.filter(i => i.tconst !== tconst);
    setListDoc(doc);
  }
}
// One-time migration from Lists -> Legacy (keeps your old UX intact)
function migrateListsToLegacyOnce() {
  if (localStorage.getItem("__migrated_lists_to_legacy__")) return;
  const legacy = getLegacyWatchlist();
  const user_id = getUserId();
  const allLists = JSON.parse(localStorage.getItem("lists") || "{}");
  const doc = allLists[user_id];
  if (doc && Array.isArray(doc.items)) {
    for (const it of doc.items) {
      const t = SQL_TITLE.find(tt => tt.tconst === it.tconst);
      if (!t) continue;
      const exists = legacy.some(m =>
        (m.tconst && m.tconst === t.tconst) ||
        (`${m.title} (${m.year})` === `${t.primaryTitle} (${t.startYear})`)
      );
      if (!exists) {
        legacy.push({
          tconst: t.tconst,
          title: t.primaryTitle,
          year: t.startYear,
          genres: getGenresForTitle(t.tconst),
          ratingAvg: (RATING_BY_TCONST.get(t.tconst)?.averageRating ?? null)
        });
      }
    }
    setLegacyWatchlist(legacy);
  }
  localStorage.setItem("__migrated_lists_to_legacy__", "1");
}

/* ================================
   REVIEWS PERSISTENCE (local, per tconst)
==================================*/
function getLocalReviews(tconst) {
  const all = JSON.parse(localStorage.getItem("reviews") || "{}");
  return all[tconst] || [];
}
function setLocalReviews(tconst, arr) {
  const all = JSON.parse(localStorage.getItem("reviews") || "{}");
  all[tconst] = arr; localStorage.setItem("reviews", JSON.stringify(all));
}
function upsertLocalReviewByUser(tconst, userId, review) {
  const arr = getLocalReviews(tconst);
  const i = arr.findIndex(r => r.user_id === userId);
  if (i >= 0) arr[i] = review; else arr.push(review);
  setLocalReviews(tconst, arr);
}
function removeLocalReviewByUser(tconst, userId) {
  const arr = getLocalReviews(tconst).filter(r => r.user_id !== userId);
  setLocalReviews(tconst, arr);
}

/* ================================
   SEARCH LOGS (NoSQL-shaped)
==================================*/
function logSearch({ query = "", filters = {}, results_count = 0 }) {
  const user_id = getUserId(); // can be 42 for anonymous
  const logs = JSON.parse(localStorage.getItem("search_logs") || "[]");
  logs.push({ user_id, query, filters, results_count, ts: new Date().toISOString() });
  localStorage.setItem("search_logs", JSON.stringify(logs));
}

/* ================================
   DATA MAPPERS (SQL → UI)
==================================*/
const GENRE_BY_ID = new Map(SQL_GENRE.map(g => [g.genreID, g.genreName]));
const RATING_BY_TCONST = new Map(SQL_RATING.map(r => [r.tconst, r]));
function getGenresForTitle(tconst) {
  return SQL_HAS_GENRE.filter(hg => hg.tconst === tconst).map(hg => GENRE_BY_ID.get(hg.genreID));
}
function composeMoviesFromSQL() {
  return SQL_TITLE.map(t => {
    const rating = RATING_BY_TCONST.get(t.tconst);
    const genres = getGenresForTitle(t.tconst);
    return {
      tconst: t.tconst,
      title: t.primaryTitle,
      year: t.startYear,
      genres,
      ratingAvg: rating?.averageRating ?? null,
      _sql: t, _rating: rating, _akas: SQL_TITLE_AKAS[t.tconst] || [],
    };
  });
}

/* ================================
   FETCH (front-end fallback only)
==================================*/
function fetchData(endpoint, params = {}) {
  // No backend; just filter local fallback data
  if (endpoint === "movies") {
    let data = composeMoviesFromSQL();
    if (params.genre) {
      const g = String(params.genre).toLowerCase();
      data = data.filter(m => (m.genres || []).some(x => x.toLowerCase() === g));
    }
    if (params.year_start && params.year_end) {
      data = data.filter(m => m.year >= params.year_start && m.year <= params.year_end);
    }
    if (params.min_rating) {
      data = data.filter(m => (m.ratingAvg ?? 0) >= Number(params.min_rating));
    }
    if (params.q) {
      const q = params.q.toLowerCase();
      data = data.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m._sql.originalTitle || "").toLowerCase().includes(q)
      );
    }
    return data;
  }
  if (endpoint === "actors") {
    const profById = new Map(SQL_PROFESSION.map(p => [p.professionID, p.professionName]));
    const profsByPerson = new Map();
    SQL_HAS_PROFESSION.forEach(hp => {
      const arr = profsByPerson.get(hp.nconst) || [];
      arr.push(profById.get(hp.professionID));
      profsByPerson.set(hp.nconst, arr);
    });
    return SQL_PERSON.map(p => ({
      nconst: p.nconst,
      primaryName: p.primaryName,
      birthYear: p.birthYear,
      deathYear: p.deathYear, // field always present (null if living)
      professions: profsByPerson.get(p.nconst) || [],
    }));
  }
  if (endpoint === "genres") return SQL_GENRE.map(g => ({ name: g.genreName, genreID: g.genreID }));
  return [];
}

function dedupeByUserKeepLatest(list) {
  const map = new Map();
  for (const r of list) {
    const k = r.user_id ?? "_";
    const prev = map.get(k);
    if (!prev || new Date(r.created_at) > new Date(prev.created_at)) map.set(k, r);
  }
  return Array.from(map.values()).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
}

async function fetchReviews(tconst) {
  // Merge fallback "others" + your local reviews; dedupe by user, keep latest
  const others = FALLBACK_REVIEWS[tconst] || [];
  const mine = getLocalReviews(tconst);
  return dedupeByUserKeepLatest([...others, ...mine]);
}

/* ================================
   RENDERERS
==================================*/
let currentMovies = [];
function escapeHtml(text) { const div = document.createElement("div"); div.textContent = text; return div.innerHTML; }

function renderMovies(movies) {
  currentMovies = movies;
  const showAdd = true; // legacy watchlist works without login
  if (!movies.length) { moviesContainer.innerHTML = "<p>No movies found.</p>"; moviesCount.textContent = "0 result(s)"; return; }
  moviesContainer.innerHTML = movies.map((m) => {
    const key = `${m.title} (${m.year})`;
    const genresStr = Array.isArray(m.genres) ? m.genres.join(", ") : (m.genre || "");
    const ratingVal = m.rating ?? m.averageRating ?? m.ratingAvg ?? "";
    const escapedTitle = escapeHtml(m.title);
    return `
      <article class="card" data-key="${escapeHtml(key)}" tabindex="0" role="button" aria-label="Open ${escapedTitle}">
        ${showAdd ? `<button class="add-btn" title="Add to Watchlist" aria-label="Add ${escapedTitle} to Watchlist" data-key="${escapeHtml(key)}">+</button>` : ""}
        <h2>${escapedTitle}</h2>
        <p class="meta">${m.year} • ${escapeHtml(genresStr)} • ⭐ ${ratingVal}</p>
      </article>
    `;
  }).join("");
  moviesCount.textContent = `${movies.length} result(s)`;
}

function renderActors(people) {
  if (!people.length) { actorsContainer.innerHTML = "<p>No people found.</p>"; actorsCount.textContent = "0 result(s)"; return; }
  actorsContainer.innerHTML = people.map((p) => {
    const life = (p.deathYear === null || typeof p.deathYear === "undefined") ? `b. ${p.birthYear}` : `${p.birthYear}–${p.deathYear}`;
    const prof = (p.professions || []).join(", ");
    return `
      <article class="card">
        <h2>${escapeHtml(p.primaryName)}</h2>
        <p class="meta">${life}${prof ? " • " + escapeHtml(prof) : ""}</p>
      </article>
    `;
  }).join("");
  actorsCount.textContent = `${people.length} result(s)`;
}

function renderGenres(genres) {
  if (!genres.length) { genresContainer.innerHTML = "<p>No genres found.</p>"; genresCount.textContent = "0 result(s)"; return; }
  genresContainer.innerHTML = genres.map((g) => `
    <article class="card">
      <h2>${escapeHtml(g.name)}</h2>
      <p class="meta">ID: ${g.genreID}</p>
    </article>
  `).join("");
  genresCount.textContent = `${genres.length} result(s)`;
}

/* ================================
   DROPDOWNS (populate + control)
==================================*/
function populateDropdowns(movies) {
  const genres = Array.from(new Set(movies.flatMap(m => Array.isArray(m.genres) ? m.genres : (m.genre ? [m.genre] : [])))).sort();

  genreMenu.innerHTML = genres.map((g) => `<span role="menuitem" tabindex="0">${escapeHtml(g)}</span>`).join("");
  genreMenu.querySelectorAll("span").forEach((span) => {
    span.addEventListener("click", () => { filterMovies({ genre: span.textContent }); closeAllDropdowns(); });
    span.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); filterMovies({ genre: span.textContent }); closeAllDropdowns(); } });
  });

  yearMenu.innerHTML = YEAR_RANGES.map((r) => `<span role="menuitem" tabindex="0">${escapeHtml(r.label)}</span>`).join("");
  yearMenu.querySelectorAll("span").forEach((span, i) => {
    const range = YEAR_RANGES[i];
    const handler = () => { filterMovies({ year_start: range.start, year_end: range.end }); closeAllDropdowns(); };
    span.addEventListener("click", handler);
    span.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(); } });
  });

  ratingMenu.innerHTML = [5, 6, 7, 8, 9].map((r) => `<span role="menuitem" tabindex="0">${r}+</span>`).join("");
  ratingMenu.querySelectorAll("span").forEach((span) => {
    const val = parseInt(span.textContent);
    const handler = () => { filterMovies({ min_rating: val }); closeAllDropdowns(); };
    span.addEventListener("click", handler);
    span.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(); } });
  });
}

function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-content").forEach((content) => {
    content.style.opacity = "0"; content.style.transform = "translateY(-5px)";
    setTimeout(() => (content.style.display = "none"), 150);
  });
  document.querySelectorAll(".dropbtn, .profile-btn").forEach((btn) => btn.setAttribute("aria-expanded", "false"));
}

/* ================================
   PROFILE MENU (login/logout/watchlist)
==================================*/
function populateProfileMenu() {
  if (!profileMenu) return;
  const logged = isLoggedIn();
  profileMenu.innerHTML = "";

  const vw = document.createElement("button");
  vw.textContent = "View Watchlist";
  vw.setAttribute("role", "menuitem");
  vw.addEventListener("click", () => { openWatchlist(); closeAllDropdowns(); });
  profileMenu.appendChild(vw);

  if (logged) {
    const lo = document.createElement("button");
    lo.textContent = "Logout";
    lo.setAttribute("role", "menuitem");
    lo.addEventListener("click", () => { localStorage.removeItem("user"); closeAllDropdowns(); loadAll(); });
    profileMenu.appendChild(lo);
  } else {
    const li = document.createElement("button");
    li.textContent = "Login";
    li.setAttribute("role", "menuitem");
    li.addEventListener("click", () => { window.location.href = "login.html"; });
    profileMenu.appendChild(li);
  }
}

/* ================================
   WATCHLIST MODAL (legacy list)
==================================*/
function openWatchlist() {
  renderWatchlist();
  watchlistModal.hidden = false; watchlistModal.setAttribute("aria-hidden", "false");
  setTimeout(() => watchlistClose?.focus(), 100);
}
function closeWatchlist() {
  watchlistModal.hidden = true; watchlistModal.setAttribute("aria-hidden", "true");
  profileBtn?.focus();
}
function renderWatchlist() {
  const legacy = getLegacyWatchlist();
  if (!legacy.length) { watchlistBody.innerHTML = `<p>Your watchlist is empty.</p>`; return; }

  watchlistBody.innerHTML = legacy.map((m) => {
    const tconst = resolveTconst(m);
    const rating = tconst ? (RATING_BY_TCONST.get(tconst)?.averageRating ?? "") : (m.ratingAvg ?? m.rating ?? "");
    const genres = Array.isArray(m.genres) ? m.genres.join(", ")
                 : (tconst ? getGenresForTitle(tconst).join(", ") : (m.genre || ""));
    const key = `${m.title} (${m.year})`;
    return `
      <div class="watchlist-item" data-key="${escapeHtml(key)}" ${tconst ? `data-tconst="${tconst}"` : ""}>
        <div>${escapeHtml(m.title)} <span class="meta">• ${m.year} • ${escapeHtml(genres)} • ⭐ ${rating}</span></div>
        <button class="icon-btn remove-btn" aria-label="Remove ${escapeHtml(key)}">Remove</button>
      </div>
    `;
  }).join("");
}

/* ================================
   MOVIE MODAL + REVIEWS
==================================*/
function openMovieModal() {
  movieModal.hidden = false; movieModal.setAttribute("aria-hidden", "false");
  setTimeout(() => movieClose?.focus(), 50);
}
function closeMovieModal() {
  movieModal.hidden = true; movieModal.setAttribute("aria-hidden", "true");
  homeLogo?.focus();
}

function renderReviews(list) {
  const logged = isLoggedIn();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myId = user?.id || user?.user_id;

  if (!list.length) { reviewsList.innerHTML = `<p>No reviews yet.</p>`; return; }

  reviewsList.innerHTML = list.map(r => {
    const ts = new Date(r.created_at).toLocaleString();
    const tagText = r.tags && r.tags.length ? ` • <span class="tags">#${r.tags.join(" #")}</span>` : "";
    const spoiler = r.spoiler ? `<span class="spoiler" title="Contains spoilers">spoiler</span>` : "";
    const isMine = logged && myId === r.user_id;
    const you = isMine ? `<span class="you-badge">You</span>` : "";
    const actions = isMine
      ? `<div class="actions">
           <button class="icon-btn edit-btn" data-user="${r.user_id}">Edit</button>
           <button class="icon-btn danger delete-btn" data-user="${r.user_id}">Delete</button>
         </div>`
      : "";
    return `
      <article class="review">
        <div class="review-head">
          <div class="left">
            <span class="author">User ${r.user_id ?? "?"}</span>${you}
          </div>
          <span class="stars">⭐ ${r.stars}</span>
        </div>
        <div class="desc">${escapeHtml(r.text)}</div>
        <div class="meta" style="margin-top:.35rem;">${ts}${tagText} ${spoiler}</div>
        ${actions}
      </article>
    `;
  }).join("");
}

// star rating widget
let selectedStars = 0;
function paintStars(n) {
  selectedStars = n;
  if (!starRating) return;
  const buttons = starRating.querySelectorAll(".star");
  buttons.forEach(btn => {
    const val = Number(btn.dataset.value);
    const filled = val <= n;
    btn.classList.toggle("filled", filled);
    btn.setAttribute("aria-checked", filled && val === n ? "true" : "false");
    btn.textContent = filled ? "★" : "☆";
  });
  starHint.textContent = n ? `${n}/10` : "";
}
function wireStarEvents() {
  if (!starRating) return;
  const buttons = starRating.querySelectorAll(".star");
  let hoverTemp = 0;
  buttons.forEach(btn => {
    btn.addEventListener("click", () => { paintStars(Number(btn.dataset.value)); });
    btn.addEventListener("mouseenter", () => { hoverTemp = selectedStars; paintStars(Number(btn.dataset.value)); });
    btn.addEventListener("mouseleave", () => { paintStars(hoverTemp || selectedStars); });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); paintStars(Number(btn.dataset.value)); }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); paintStars(Math.max(0, selectedStars - 1)); }
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); paintStars(Math.min(10, selectedStars + 1)); }
    });
  });
}

async function renderMovieDetail(movie) {
  try {
    movieTitle.textContent = movie.title;

    const genresStr = Array.isArray(movie.genres)
      ? movie.genres.join(", ")
      : (movie.genre || "");
    const ratingVal = movie.rating ?? movie.averageRating ?? movie.ratingAvg ?? "";
    movieMeta.textContent = `${movie.year} • ${genresStr} • ⭐ ${ratingVal}`;

    // Open the modal early so the user sees something while reviews load
    openMovieModal();

    const tconst = movie.tconst || `${movie.title} (${movie.year})`;

    // Load & render reviews
    const list = await fetchReviews(tconst);
    renderReviews(list);

    // Prepare star widget + prefilling if user already reviewed
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const myId = user?.id || user?.user_id || 42;

    wireStarEvents();

    const myExisting = list.find(r => r.user_id === myId);
    paintStars(myExisting ? Number(myExisting.stars) : 0);
    if (myExisting) {
      starHint.textContent = `${Number(myExisting.stars)}/10 • You already reviewed this (edit or delete below).`;
    }

    // Review list actions
    reviewsList.onclick = (e) => {
      const del = e.target.closest(".delete-btn");
      if (del) {
        if (!confirm("Delete your review?")) return;
        removeLocalReviewByUser(tconst, myId);
        fetchReviews(tconst).then(renderReviews);
        reviewText.value = ""; reviewTags.value = ""; reviewSpoiler.checked = false; paintStars(0);
        return;
      }
      const edit = e.target.closest(".edit-btn");
      if (edit) {
        const mine = getLocalReviews(tconst).find(r => r.user_id === myId) || myExisting;
        if (!mine) return;
        paintStars(Number(mine.stars));
        reviewText.value = mine.text || "";
        reviewTags.value = (mine.tags || []).join(", ");
        reviewSpoiler.checked = !!mine.spoiler;
        reviewText.focus();
      }
    };

    // Submit handler
    reviewForm.onsubmit = (e) => {
      e.preventDefault();
      reviewError.textContent = "";

      if (!selectedStars || selectedStars < 1) { reviewError.textContent = "Pick a star rating (1–10)."; return; }

      const textVal = reviewText.value.trim();
      const tagsVal = reviewTags.value.trim();
      if (!textVal) { reviewError.textContent = "Write a short review."; return; }

      const already = !!getLocalReviews(tconst).find(r => r.user_id === myId);
      if (already && !confirm("You already posted a review for this title. Overwrite it?")) return;

      const review = {
        user_id: myId,
        stars: selectedStars,
        text: textVal,
        tags: tagsVal ? tagsVal.split(",").map(s => s.trim()).filter(Boolean) : [],
        spoiler: !!reviewSpoiler.checked,
        created_at: new Date().toISOString(),
      };

      upsertLocalReviewByUser(tconst, myId, review);
      fetchReviews(tconst).then(renderReviews);
      reviewText.value = ""; reviewTags.value = ""; reviewSpoiler.checked = false;
      starHint.textContent = `${selectedStars}/10 • Review saved.`;
    };

  } catch (err) {
    console.error("Failed to render movie details:", err);
    movieMeta.textContent = "Failed to load details. Try again.";
    reviewsList.innerHTML = `<p class="error-msg">Could not load reviews.</p>`;
    openMovieModal(); // ensure modal still opens on error
  }
}

/* ================================
   FILTERING / SEARCH / LOAD
==================================*/
function filterMovies(params) {
  try {
    const data = fetchData("movies", params);
    renderMovies(data);
    // Search logs (NoSQL shape)
    logSearch({
      query: params.q || "",
      filters: {
        min_rating: params.min_rating ?? null,
        year_start: params.year_start ?? null,
        year_end: params.year_end ?? null,
        genres: params.genre ? [params.genre] : []
      },
      results_count: data.length
    });
  } catch (err) {
    console.error("Error filtering movies:", err);
    moviesContainer.innerHTML = "<p>Error loading movies. Please try again.</p>";
  }
}

function loadAll() {
  populateProfileMenu();
  try {
    const movies = fetchData("movies");
    const people = fetchData("actors");
    const genres = fetchData("genres");

    renderMovies(movies);
    populateDropdowns(movies);
    renderActors(people);
    renderGenres(genres);
  } catch (err) {
    console.error("Error loading data:", err);
  }
}

/* ================================
   EVENTS
==================================*/
if (searchInput) {
  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    searchTimeout = setTimeout(() => { q ? filterMovies({ q }) : loadAll(); }, 300);
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
    const addBtn = e.target.closest(".add-btn");
    if (addBtn) {
      const key = addBtn.dataset.key;
      const movie = currentMovies.find((m) => `${m.title} (${m.year})` === key);
      if (movie) {
        addToWatchlist(movie);
        addBtn.textContent = "✓";
        addBtn.setAttribute("aria-label", `${movie.title} added to watchlist`);
        setTimeout(() => { addBtn.textContent = "+"; addBtn.setAttribute("aria-label", `Add ${movie.title} to Watchlist`); }, 900);
      }
      return;
    }
    const card = e.target.closest(".card");
    if (card) {
      const key = card.dataset.key;
      const movie = currentMovies.find((m) => `${m.title} (${m.year})` === key);
      if (movie) await renderMovieDetail(movie);
    }
  });

  moviesContainer.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card");
    if (!card) return;
    e.preventDefault();
    const key = card.dataset.key;
    const movie = currentMovies.find((m) => `${m.title} (${m.year})` === key);
    if (movie) await renderMovieDetail(movie);
  });
}

// Watchlist modal
if (watchlistBackdrop) watchlistBackdrop.addEventListener("click", closeWatchlist);
if (watchlistClose) watchlistClose.addEventListener("click", closeWatchlist);

// Movie modal
if (movieBackdrop) movieBackdrop.addEventListener("click", closeMovieModal);
if (movieClose) movieClose.addEventListener("click", closeMovieModal);

// Escape to close modals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (watchlistModal && !watchlistModal.hidden) closeWatchlist();
    if (movieModal && !movieModal.hidden) closeMovieModal();
  }
});

// Watchlist remove (by key or tconst)
if (watchlistBody) {
  watchlistBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-btn");
    if (!btn) return;
    const row = btn.closest(".watchlist-item");
    const tconst = row?.dataset.tconst;
    const key = row?.dataset.key;
    removeFromWatchlistByKeyOrTconst({ key, tconst });
    renderWatchlist();
  });
}

/* ================================
   NAVBAR DROPDOWNS (hover + touch + keyboard)
==================================*/
document.querySelectorAll(".dropdown").forEach((dropdown) => {
  if (dropdown.dataset.dropdownWired === "1") return;
  dropdown.dataset.dropdownWired = "1";

  const content = dropdown.querySelector(".dropdown-content");
  const btn = dropdown.querySelector(".dropbtn, .profile-btn");
  if (!content || !btn) return;

  let timeoutId;
  dropdown.addEventListener("mouseenter", () => {
    clearTimeout(timeoutId);
    content.style.display = "block";
    btn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => { content.style.opacity = "1"; content.style.transform = "translateY(0)"; });
  });
  dropdown.addEventListener("mouseleave", () => {
    timeoutId = setTimeout(() => {
      content.style.opacity = "0"; content.style.transform = "translateY(-5px)";
      btn.setAttribute("aria-expanded", "false");
      setTimeout(() => (content.style.display = "none"), 150);
    }, 150);
  });

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = content.style.display === "block";
    document.querySelectorAll(".dropdown .dropdown-content").forEach((c) => { c.style.opacity = "0"; c.style.transform = "translateY(-5px)"; setTimeout(() => (c.style.display = "none"), 150); });
    document.querySelectorAll(".dropbtn, .profile-btn").forEach((b) => b.setAttribute("aria-expanded", "false"));
    if (!isOpen) {
      content.style.display = "block";
      btn.setAttribute("aria-expanded", "true");
      requestAnimationFrame(() => { content.style.opacity = "1"; content.style.transform = "translateY(0)"; });
    }
  });

  btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); } });
  content.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      content.style.opacity = "0";
      content.style.transform = "translateY(-5px)";
      btn.setAttribute("aria-expanded", "false");
      setTimeout(() => (content.style.display = "none"), 150);
      btn.focus();
    }
  });
});

document.addEventListener("click", (e) => {
  const isDropdown = e.target.closest(".dropdown");
  if (isDropdown) return;
  document.querySelectorAll(".dropdown .dropdown-content").forEach((c) => { c.style.opacity = "0"; c.style.transform = "translateY(-5px)"; setTimeout(() => (c.style.display = "none"), 150); });
  document.querySelectorAll(".dropbtn, .profile-btn").forEach((b) => b.setAttribute("aria-expanded", "false"));
});

/* ================================
   BOOT
==================================*/
migrateListsToLegacyOnce();
loadAll();
