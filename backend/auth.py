# auth.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector

auth_bp = Blueprint("auth", __name__)

def get_db():
    # adapt this to whatever you're already using
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="12345678",
        database="project2",
    )

def row_to_user(row):
    # row order must match your SELECT
    return {
        "user_id": row[0],
        "username": row[1],
        "email": row[2],
        "display_name": row[3],
        "bio": row[4],
        "is_admin": bool(row[5]),
        "is_active": bool(row[6]),
    }

@auth_bp.post("/api/register")
def register():
    data = request.get_json() or {}
    username     = (data.get("username") or "").strip()
    email        = (data.get("email") or "").strip()
    password     = data.get("password") or ""
    display_name = (data.get("display_name") or "").strip()

    if not username or not email or not password:
        return jsonify({"error": "username, email, and password are required"}), 400

    pw_hash = generate_password_hash(password)

    conn = get_db()
    cur = conn.cursor()

    # check if username / email taken
    cur.execute(
        "SELECT user_id FROM users WHERE username = %s OR email = %s",
        (username, email),
    )
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "username or email already in use"}), 409

    cur.execute(
        """
        INSERT INTO users (username, email, password_hash, display_name)
        VALUES (%s, %s, %s, %s)
        """,
        (username, email, pw_hash, display_name or username),
    )
    conn.commit()

    user_id = cur.lastrowid
    cur.execute(
        """
        SELECT user_id, username, email, display_name, bio, is_admin, is_active
        FROM users WHERE user_id = %s
        """,
        (user_id,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify(row_to_user(row)), 201

@auth_bp.post("/api/login")
def login():
    data = request.get_json() or {}
    identifier = (data.get("username") or data.get("email") or "").strip()
    password   = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"error": "username/email and password are required"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT user_id, username, email, display_name, bio, is_admin,
               is_active, password_hash
        FROM users
        WHERE (username = %s OR email = %s)
        """,
        (identifier, identifier),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"error": "invalid credentials"}), 401

    user_id, username, email, display_name, bio, is_admin, is_active, pw_hash = row

    if not is_active:
        return jsonify({"error": "account is disabled"}), 403

    if not check_password_hash(pw_hash, password):
        return jsonify({"error": "invalid credentials"}), 401

    user = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "display_name": display_name,
        "bio": bio,
        "is_admin": bool(is_admin),
        "is_active": bool(is_active),
    }
    return jsonify(user), 200

# ========== USER SELF PROFILE (READ + UPDATE) ==========

@auth_bp.get("/api/users/<int:user_id>")
def get_user_profile(user_id):
    """Get a single user's profile (used for 'My Profile').
       For simplicity we don't check auth here – frontend only calls this for
       the currently logged-in user.
    """
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT user_id, username, email, display_name, bio, is_admin, is_active
        FROM users
        WHERE user_id = %s
        """,
        (user_id,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"error": "user not found"}), 404

    return jsonify(row_to_user(row)), 200


@auth_bp.put("/api/users/<int:user_id>")
def update_user_profile(user_id):
    """Update the logged-in user's own profile.
       We allow: display_name, bio, and optional password change.
    """
    data = request.get_json() or {}
    display_name = (data.get("display_name") or "").strip()
    bio = (data.get("bio") or "").strip()
    new_password = data.get("password") or ""

    # Build dynamic SET clause
    fields = []
    values = []

    if display_name:
        fields.append("display_name = %s")
        values.append(display_name)
    if bio or bio == "":
        fields.append("bio = %s")
        values.append(bio)

    if new_password:
        pw_hash = generate_password_hash(new_password)
        fields.append("password_hash = %s")
        values.append(pw_hash)

    if not fields:
        return jsonify({"error": "nothing to update"}), 400

    values.append(user_id)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE users SET {', '.join(fields)} WHERE user_id = %s",
        tuple(values),
    )
    conn.commit()

    # Return updated row
    cur.execute(
        """
        SELECT user_id, username, email, display_name, bio, is_admin, is_active
        FROM users
        WHERE user_id = %s
        """,
        (user_id,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"error": "user not found"}), 404

    return jsonify(row_to_user(row)), 200

# ========== ADMIN: MANAGE USERS (R, U, D) ==========

@auth_bp.get("/api/admin/users")
def admin_list_users():
    """List all users (for admin panel).
       NOTE: For this project we assume frontend only calls this if is_admin is true.
       In a real app you'd verify an admin token here.
    """
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT user_id, username, email, display_name, bio, is_admin, is_active
        FROM users
        ORDER BY user_id
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([row_to_user(r) for r in rows]), 200


@auth_bp.put("/api/admin/users/<int:user_id>")
def admin_update_user(user_id):
    """Admin can toggle is_admin / is_active (and optionally display_name/bio)."""
    data = request.get_json() or {}

    fields = []
    values = []

    if "is_admin" in data:
        fields.append("is_admin = %s")
        values.append(1 if data["is_admin"] else 0)
    if "is_active" in data:
        fields.append("is_active = %s")
        values.append(1 if data["is_active"] else 0)
    if "display_name" in data:
        fields.append("display_name = %s")
        values.append((data["display_name"] or "").strip())
    if "bio" in data:
        fields.append("bio = %s")
        values.append((data["bio"] or "").strip())

    if not fields:
        return jsonify({"error": "nothing to update"}), 400

    values.append(user_id)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE users SET {', '.join(fields)} WHERE user_id = %s",
        tuple(values),
    )
    conn.commit()

    cur.execute(
        """
        SELECT user_id, username, email, display_name, bio, is_admin, is_active
        FROM users
        WHERE user_id = %s
        """,
        (user_id,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"error": "user not found"}), 404

    return jsonify(row_to_user(row)), 200


@auth_bp.delete("/api/admin/users/<int:user_id>")
def admin_delete_user(user_id):
    """Admin delete user. Here we do a hard delete; you could also soft-delete."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "user deleted"}), 200
