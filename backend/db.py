# db.py
import mysql.connector
from mysql.connector import Error

DB_CONFIG = {
    "host": "localhost",
    "user": "root",         
    "password": "12345678",
    "database": "project2",
}


def get_connection():
    """Create a new DB connection."""
    return mysql.connector.connect(**DB_CONFIG)


def query_all(sql, params=None):
    """Run a SELECT and return all rows as dicts."""
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or [])
        return cur.fetchall()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
