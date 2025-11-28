# nosql.py
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from datetime import datetime
from db import get_connection

nosql_bp = Blueprint("nosql", __name__)

# --- Mongo client / DB ---
client = MongoClient("mongodb://localhost:27017")  # adjust if needed
db = client["project2_nosql"]  # separate logical DB for NoSQL part

reviews_col = db["reviews"]
watchlists_col = db["watchlists"]
logs_col = db["search_logs"]


def _now_iso():
  return datetime.utcnow()


def _clean_review(doc):
  return {
      "id": str(doc.get("_id")),
      "tconst": doc.get("tconst"),
      "user_id": doc.get("user_id"),
      "username": doc.get("username"),
      "stars": doc.get("stars", 0),
      "text": doc.get("text", ""),
      "spoiler": bool(doc.get("spoiler", False)),
      "tags": doc.get("tags", []),
      "created_at": doc.get("created_at"),
      "updated_at": doc.get("updated_at"),
  }


# ==========================
#  REVIEWS API (Mongo)
# ==========================

@nosql_bp.get("/api/reviews/<tconst>")
def get_reviews(tconst):
  """Return all reviews for a given movie."""
  docs = list(reviews_col.find({"tconst": tconst}))
  return jsonify([_clean_review(d) for d in docs]), 200


@nosql_bp.post("/api/reviews/<tconst>")
def upsert_review(tconst):
  """Create or update a review for a movie by user_id."""

  data = request.get_json() or {}
  user_id = data.get("user_id")
  username = data.get("username") or f"user-{user_id}"
  stars = int(data.get("stars") or 0)
  text = data.get("text") or ""
  spoiler = bool(data.get("spoiler"))
  tags = data.get("tags") or []

  if not user_id:
    return jsonify({"error": "user_id required"}), 400

  now = _now_iso()

  result = reviews_col.find_one_and_update(
      {
          "tconst": tconst,
          "user_id": user_id,
      },
      {
          "$set": {
              "tconst": tconst,
              "user_id": user_id,
              "username": username,
              "stars": stars,
              "text": text,
              "spoiler": spoiler,
              "tags": tags,
              "updated_at": now,
          },
          "$setOnInsert": {
              "created_at": now,
          },
      },
      upsert=True,
      return_document=True,
  )

  # result might be None if older pymongo; re-query if needed
  if result is None:
    result = reviews_col.find_one({"tconst": tconst, "user_id": user_id})

  return jsonify(_clean_review(result)), 200


@nosql_bp.delete("/api/reviews/<tconst>/<int:user_id>")
def delete_review(tconst, user_id):
  """Delete a user's review for a movie."""
  reviews_col.delete_one({"tconst": tconst, "user_id": user_id})
  return jsonify({"message": "deleted"}), 200


# ==========================
#  WATCHLIST + SEARCH LOGS
# (we'll wire frontend later)
# ==========================

@nosql_bp.get("/api/watchlist/<int:user_id>")
def get_watchlist(user_id):
    doc = watchlists_col.find_one({"user_id": user_id})
    if not doc or not doc.get("items"):
        return jsonify([]), 200

    # Collect the tconsts from Mongo watchlist
    tconsts = [it["tconst"] for it in doc["items"] if "tconst" in it]
    if not tconsts:
        return jsonify([]), 200

    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    format_strings = ",".join(["%s"] * len(tconsts))
    cur.execute(
        f"""
        SELECT
          t.tconst,
          t.primaryTitle AS title,
          t.startYear    AS year,
          t.averageRating AS rating,
          GROUP_CONCAT(DISTINCT g.genreName ORDER BY g.genreName) AS genres
        FROM Title t
        LEFT JOIN HasGenre hg ON hg.tconst = t.tconst
        LEFT JOIN Genre    g  ON g.genreID = hg.genreID
        WHERE t.tconst IN ({format_strings})
        GROUP BY
          t.tconst,
          t.primaryTitle,
          t.startYear,
          t.averageRating
        """,
        tconsts,
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for r in rows:
        genres_list = r["genres"].split(",") if r["genres"] else []
        result.append({
            "tconst": r["tconst"],
            "title":  r["title"],
            "year":   r["year"],
            "genres": genres_list,
            "rating": r["rating"],
        })

    return jsonify(result), 200

@nosql_bp.post("/api/watchlist/<int:user_id>")
def add_watchlist_item(user_id):
    data = request.get_json() or {}
    tconst = (data.get("tconst") or "").strip()
    note = (data.get("note") or "").strip() or None

    if not tconst:
        return jsonify({"error": "tconst is required"}), 400

    # Upsert per-user doc and push a new item if not already present
    watchlists_col.update_one(
        {"user_id": user_id},
        {
            "$setOnInsert": {"user_id": user_id, "created_at": _now_iso()},
            "$addToSet": {  # prevents duplicate tconst
                "items": {
                    "tconst": tconst,
                    "added_at": _now_iso(),
                    "note": note,
                }
            },
        },
        upsert=True,
    )

    return jsonify({"message": "added"}), 201


@nosql_bp.delete("/api/watchlist/<int:user_id>")
def remove_watchlist_item(user_id):
    data = request.get_json() or {}
    tconst = (data.get("tconst") or "").strip()

    if not tconst:
        return jsonify({"error": "tconst is required"}), 400

    watchlists_col.update_one(
        {"user_id": user_id},
        {"$pull": {"items": {"tconst": tconst}}},
    )

    return jsonify({"message": "removed"}), 200


@nosql_bp.post("/api/search_logs/<int:user_id>")
def log_search(user_id):
    data = request.get_json() or {}
    q = (data.get("q") or "").strip()

    # if empty query, don't log
    if not q:
        return jsonify({"message": "empty query, not logged"}), 200

    doc = {
        "user_id": user_id,
        "q": q,
        "ts": _now_iso(),
    }
    logs_col.insert_one(doc)
    return jsonify({"message": "logged"}), 201

@nosql_bp.get("/api/search_logs/<int:user_id>")
def get_user_logs(user_id):
    cursor = (
        logs_col
        .find({"user_id": user_id})
        .sort("ts", -1)
        .limit(200)
    )
    out = []
    for d in cursor:
        out.append({
            "q": d.get("q", ""),
            "ts": d.get("ts").isoformat() if d.get("ts") else None,
        })
    return jsonify(out), 200