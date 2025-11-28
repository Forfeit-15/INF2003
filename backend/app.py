# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import query_all, get_connection
from auth import auth_bp 
from nosql import nosql_bp
app = Flask(__name__)
CORS(app)  # allow all origins (you can restrict later)
app.register_blueprint(auth_bp)
app.register_blueprint(nosql_bp)


# ==========================
#  MOVIES LIST / SEARCH
# ==========================
@app.route("/api/movies", methods=["GET"])
def get_movies():
    """
    Query params:
      q          - search string in primaryTitle/originalTitle
      genre      - genreName (case-insensitive exact)
      year_start - integer
      year_end   - integer
      min_rating - float
    """
    q = (request.args.get("q") or "").strip()
    genre = (request.args.get("genre") or "").strip()
    year_start = request.args.get("year_start", type=int)
    year_end = request.args.get("year_end", type=int)
    min_rating = request.args.get("min_rating", type=float)

    sql = """
    SELECT
      t.tconst,
      t.primaryTitle,
      t.originalTitle,
      t.startYear,
      GROUP_CONCAT(DISTINCT g.genreName ORDER BY g.genreName) AS genres,
      t.averageRating,
      t.numVotes
    FROM Title t
    LEFT JOIN HasGenre hg ON hg.tconst = t.tconst
    LEFT JOIN Genre g     ON g.genreID = hg.genreID
    WHERE 1=1
    """
    params = []

    if q:
        sql += " AND (LOWER(t.primaryTitle) LIKE %s OR LOWER(t.originalTitle) LIKE %s)"
        like = f"%{q.lower()}%"
        params.extend([like, like])

    if genre:
        # filter titles that have this genre
        sql += """
        AND EXISTS (
            SELECT 1
            FROM HasGenre hg2
            JOIN Genre g2 ON g2.genreID = hg2.genreID
            WHERE hg2.tconst = t.tconst
              AND LOWER(g2.genreName) = %s
        )
        """
        params.append(genre.lower())

    if year_start is not None and year_end is not None:
        sql += " AND t.startYear BETWEEN %s AND %s"
        params.extend([year_start, year_end])
    elif year_start is not None:
        sql += " AND t.startYear >= %s"
        params.append(year_start)
    elif year_end is not None:
        sql += " AND t.startYear <= %s"
        params.append(year_end)

    if min_rating is not None:
        sql += " AND t.averageRating IS NOT NULL AND t.averageRating >= %s"
        params.append(min_rating)

    sql += """
    GROUP BY t.tconst
    ORDER BY t.startYear DESC, t.primaryTitle
    LIMIT 200
    """

    rows = query_all(sql, params)

    movies = []
    for r in rows:
        genres_list = r["genres"].split(",") if r["genres"] else []
        movies.append({
            "tconst": r["tconst"],
            "title": r["primaryTitle"],
            "originalTitle": r["originalTitle"],
            "year": r["startYear"],
            "genres": genres_list,
            "ratingAvg": r["averageRating"],
            "numVotes": r["numVotes"],
        })
    return jsonify(movies)

@app.route("/api/movies/above_genre_avg", methods=["GET"])
def get_movies_above_genre_average():
    """
    Query params:
      genre      - genreName (required, case-insensitive)
      min_votes  - optional, minimum numVotes to filter tiny/noisy titles (default 50)

    Returns:
      {
        "genre": "Biography",
        "genreAvg": 5.73,
        "count": 6,
        "movies": [ ... ]
      }
    """
    genre = (request.args.get("genre") or "").strip()
    min_votes = request.args.get("min_votes", type=int, default=50)

    if not genre:
        return jsonify({"error": "genre is required"}), 400

    sql = """
    SELECT
      t.tconst,
      t.primaryTitle,
      t.originalTitle,
      t.startYear,
      t.averageRating,
      t.numVotes,
      GROUP_CONCAT(DISTINCT g.genreName ORDER BY g.genreName) AS genres
    FROM Title t
    JOIN HasGenre hg  ON hg.tconst = t.tconst
    JOIN Genre    g   ON g.genreID = hg.genreID
    WHERE LOWER(g.genreName) = %s
      AND t.averageRating IS NOT NULL
      AND t.numVotes >= %s
      AND t.averageRating >= (
          SELECT AVG(t2.averageRating)
          FROM Title t2
          JOIN HasGenre hg2 ON hg2.tconst = t2.tconst
          JOIN Genre    g2  ON g2.genreID = hg2.genreID
          WHERE LOWER(g2.genreName) = %s
            AND t2.averageRating IS NOT NULL
            AND t2.numVotes >= %s
      )
    GROUP BY t.tconst, t.primaryTitle, t.originalTitle,
             t.startYear, t.averageRating, t.numVotes
    ORDER BY t.averageRating DESC, t.numVotes DESC
    LIMIT 200
    """

    rows = query_all(sql, [genre.lower(), min_votes, genre.lower(), min_votes])

    movies = []
    for r in rows:
        genres_list = r["genres"].split(",") if r["genres"] else []
        movies.append({
            "tconst": r["tconst"],
            "title": r["primaryTitle"],
            "originalTitle": r["originalTitle"],
            "year": r["startYear"],
            "genres": genres_list,
            "ratingAvg": r["averageRating"],
            "numVotes": r["numVotes"],
        })

    avg_sql = """
    SELECT AVG(t2.averageRating) AS genreAvg
    FROM Title t2
    JOIN HasGenre hg2 ON hg2.tconst = t2.tconst
    JOIN Genre    g2  ON g2.genreID = hg2.genreID
    WHERE LOWER(g2.genreName) = %s
      AND t2.averageRating IS NOT NULL
      AND t2.numVotes >= %s
    """
    avg_rows = query_all(avg_sql, [genre.lower(), min_votes])
    genre_avg = (
        avg_rows[0]["genreAvg"]
        if avg_rows and avg_rows[0]["genreAvg"] is not None
        else None
    )

    return jsonify({
        "genre": genre,
        "genreAvg": genre_avg,
        "count": len(movies),
        "movies": movies,
    }), 200

# ==========================
#  MOVIE DETAILS
# ==========================
@app.route("/api/title/<tconst>", methods=["GET"])
def get_title_details(tconst):
    # Basic title + ratings + genres
    title_sql = """
    SELECT
      t.tconst,
      t.primaryTitle,
      t.originalTitle,
      t.titleType,
      t.startYear,
      t.endYear,
      t.runtimeMinutes,
      t.isAdult,
      t.averageRating,
      t.numVotes,
      GROUP_CONCAT(DISTINCT g.genreName ORDER BY g.genreName) AS genres
    FROM Title t
    LEFT JOIN HasGenre hg ON hg.tconst = t.tconst
    LEFT JOIN Genre g     ON g.genreID = hg.genreID
    WHERE t.tconst = %s
    GROUP BY t.tconst
    """
    rows = query_all(title_sql, [tconst])
    if not rows:
        return jsonify({"error": "Title not found"}), 404
    t = rows[0]

    # Principals (cast/crew)
    principal_sql = """
    SELECT
      h.ordering,
      h.category,
      h.job,
      h.characterName,
      h.nconst,
      p.primaryName
    FROM HasPrincipal h
    LEFT JOIN Person p ON p.nconst = h.nconst
    WHERE h.tconst = %s
    ORDER BY h.ordering
    """
    principals = query_all(principal_sql, [tconst])

    # AKAs
    akas_sql = """
    SELECT
      ordering,
      title,
      region,
      language,
      types,
      attributes,
      isOriginalTitle
    FROM TitleAkas
    WHERE titleId = %s
    ORDER BY ordering
    """
    akas = query_all(akas_sql, [tconst])

    return jsonify({
        "tconst": t["tconst"],
        "primaryTitle": t["primaryTitle"],
        "originalTitle": t["originalTitle"],
        "titleType": t["titleType"],
        "year": t["startYear"],
        "endYear": t["endYear"],
        "runtimeMinutes": t["runtimeMinutes"],
        "isAdult": t["isAdult"],
        "genres": t["genres"].split(",") if t["genres"] else [],
        "ratingAvg": t["averageRating"],
        "numVotes": t["numVotes"],
        "principals": principals,
        "akas": akas,
    })


# ==========================
#  ACTORS LIST
# ==========================
@app.route("/api/actors", methods=["GET"])
def get_actors():
    """
    Simple list of people + professions.
    You can add search later with ?q=
    """
    q = (request.args.get("q") or "").strip()

    sql = """
    SELECT
      p.nconst,
      p.primaryName,
      p.birthYear,
      p.deathYear,
      GROUP_CONCAT(DISTINCT pr.professionName ORDER BY pr.professionName) AS professions
    FROM Person p
    LEFT JOIN HasProfession hp ON hp.nconst = p.nconst
    LEFT JOIN Profession pr    ON pr.professionID = hp.professionID
    WHERE 1=1
    """
    params = []

    if q:
        sql += " AND LOWER(p.primaryName) LIKE %s"
        params.append(f"%{q.lower()}%")

    sql += """
    GROUP BY p.nconst
    ORDER BY p.primaryName
    LIMIT 200
    """

    rows = query_all(sql, params)

    actors = []
    for r in rows:
        profs = r["professions"].split(",") if r["professions"] else []
        actors.append({
            "nconst": r["nconst"],
            "primaryName": r["primaryName"],
            "birthYear": r["birthYear"],
            "deathYear": r["deathYear"],
            "professions": profs,
        })
    return jsonify(actors)


# ==========================
#  PERSON DETAILS
# ==========================
@app.route("/api/person/<nconst>", methods=["GET"])
def get_person_details(nconst):
    person_sql = """
    SELECT
      p.nconst,
      p.primaryName,
      p.birthYear,
      p.deathYear,
      GROUP_CONCAT(DISTINCT pr.professionName ORDER BY pr.professionName) AS professions
    FROM Person p
    LEFT JOIN HasProfession hp ON hp.nconst = p.nconst
    LEFT JOIN Profession pr    ON pr.professionID = hp.professionID
    WHERE p.nconst = %s
    GROUP BY p.nconst
    """
    rows = query_all(person_sql, [nconst])
    if not rows:
        return jsonify({"error": "Person not found"}), 404
    p = rows[0]

    # Known-for titles
    known_sql = """
    SELECT
      k.tconst,
      t.primaryTitle,
      t.startYear,
      t.averageRating
    FROM KnownFor k
    JOIN Title t ON t.tconst = k.tconst
    WHERE k.nconst = %s
    ORDER BY t.startYear
    """
    known_for = query_all(known_sql, [nconst])

    return jsonify({
        "nconst": p["nconst"],
        "primaryName": p["primaryName"],
        "birthYear": p["birthYear"],
        "deathYear": p["deathYear"],
        "professions": p["professions"].split(",") if p["professions"] else [],
        "knownFor": known_for,
    })


# ==========================
#  GENRES
# ==========================
@app.route("/api/genres", methods=["GET"])
def get_genres():
    sql = "SELECT genreID, genreName FROM Genre ORDER BY genreName"
    rows = query_all(sql)
    return jsonify([
        {"genreID": r["genreID"], "name": r["genreName"]}
        for r in rows
    ])


# ==========================
#  MAIN ENTRYPOINT
# ==========================
if __name__ == "__main__":
    # dev mode
    app.run(host="127.0.0.1", port=5000, debug=True)
