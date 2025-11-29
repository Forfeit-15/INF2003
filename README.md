# INF2003

## Requirements:
```
Python 3.10+ (3.11 is fine)
MySQL server (e.g. MySQL / MariaDB) running locally
MongoDB server running locally (default mongodb://localhost:27017)
```
## Getting Started:
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## MySQL Setup
```
Open the dump script included with Workbench and execute it.
```

Make sure the database name and credentials match db.py and auth.py:
```
# db.py
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "project2",
}

# auth.py
return mysql.connector.connect(
    host="localhost",
    user="root",
    password="12345678",
    database="project2",
)
```
Change user, password, and database to whatever you are using locally.

## MongoDB setup (NoSQL)
The app uses a separate logical DB:

Database: project2_nosql

Collections: reviews, watchlists, search_logs

If your MongoDB runs elsewhere, change the URI or DB name:
```
#nosql.py
client = MongoClient("mongodb://localhost:27017")
db = client["project2_nosql"]
```
Run this in the shell of MongoDB Compass:
```
use project2_nosql;

db.createCollection("reviews", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tconst","user_id","stars","text","created_at"],
      properties: {
        tconst: { bsonType: "string", pattern: "^tt\\d{7,}$" },
        user_id:{ bsonType: "int" },
        stars: { bsonType: ["int","double"], minimum: 0, maximum: 10 },
        text:   { bsonType: "string", minLength: 1, maxLength: 2000 },
        tags:   { bsonType: ["array"], items: {bsonType:"string"} },
        spoiler:{ bsonType: ["bool","null"] },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
        username:   { bsonType: "string", minLength: 1, maxLength: 2000 },
      }
    }
  }
});

db.createCollection("watchlists", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id","items","created_at"],
      properties: {
        user_id:{ bsonType: "int" },
        items:  { bsonType: "array",
                  items: { bsonType: "object",
                    required: ["tconst","added_at"],
                    properties: {
                      tconst: { bsonType: "string", pattern: "^tt\\d{7,}$" },
                      added_at: { bsonType: "date" },
                      note: { bsonType: ["string","null"], maxLength: 200 }
                    }
                  } },
        created_at: { bsonType: "date" }
      }
    }
  }
});

db.createCollection("search_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "q", "ts"],
      properties: {
        user_id: { bsonType: "int" },
        q:       { bsonType: "string", minLength: 1, maxLength: 200 },
        ts:      { bsonType: "date" }
      },
      additionalProperties: false
    }
  }
});
```

Alternatively, import the mongodump files. You might need to install MongoDB Database Tools for this. (Not recommended)
```
mongorestore --db project2_nosql mongo_export/project2_nosql
```

## Running the backend
With the virtual environment activated and dependencies installed:
```
cd backend
python -m venv venv
venv\Scripts\activate
python app.py
```

The flask API runs at:
```
http://127.0.0.1:5000
```

Option 1 - open index.html directly.

Option 2 - serve via HTTP server (like five server from Websys)

## Application Features

### SQL (MySQL) side
- Movie search and listing (`/api/movies`)
- Movie details + cast + AKAs (`/api/title/<tconst>`)
- People listing and details (`/api/actors`, `/api/person/<nconst>`)
- Genres listing (`/api/genres`)
- **Nested query feature** – standout movies:
  - `/api/movies/above_genre_avg?genre=...&min_votes=50`  
  - Returns movies whose rating is above (or equal to) the average rating for that genre.

### NoSQL (MongoDB) side
- User reviews for titles (stored in `reviews`)
  - `GET/POST/DELETE /api/reviews/<tconst>`
- User watchlists (stored in `watchlists`)
  - `GET/POST/DELETE /api/watchlist/<user_id>`
- Top user-rated titles (Mongo aggregation + SQL join)
  - `GET /api/top_user_rated?limit=10&min_reviews=2`
- Search logs with TTL, plus trending:
  - `POST /api/search_logs/<user_id>`
  - `GET /api/search_logs/<user_id>`
  - `GET /api/search_trending` (uses only recent logs kept by TTL)

### Authentication
- `POST /api/register`
- `POST /api/login`
- `GET /api/users/<user_id>`
- `PUT /api/users/<user_id>` (update profile / password)

Passwords are hashed using Werkzeug’s `generate_password_hash` / `check_password_hash`.


## Troubleshooting
idk dm me or something