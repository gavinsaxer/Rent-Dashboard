import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

app = FastAPI(title="Rent Analyzer API")

# CRUCIAL: Enable CORS (Cross-Origin Resource Sharing)
# This allows your frontend (which will run on a different port) to securely talk to this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to your specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)


# Fetch all locations currently being tracked
@app.get("/api/locations")
def get_locations():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, zip_code, city, state FROM zip_codes;")
        locations = cursor.fetchall()
        cursor.close()
        conn.close()
        return locations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Fetch all active listings for a specific zip code
@app.get("/api/listings/{zip_code}")
def get_listings(zip_code: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT al.id, al.address, al.property_type, al.bedrooms, 
                   al.bathrooms, al.square_footage, al.price, al.days_on_market, al.last_seen_date
            FROM active_listings al
            JOIN zip_codes z ON al.zip_code_id = z.id
            WHERE z.zip_code = %s
            ORDER BY al.price ASC;
        """
        cursor.execute(query, (zip_code,))
        listings = cursor.fetchall()

        cursor.close()
        conn.close()

        if not listings:
            raise HTTPException(
                status_code=404, detail=f"No active listings found for {zip_code}"
            )

        return listings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
