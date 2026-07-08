import os
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import date

load_dotenv()
API_KEY = os.getenv("RENTCAST_API_KEY")
DB_URL = os.getenv("DATABASE_URL")


def fetch_and_store_listings():
    try:
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()
        print("Connected to database")
    except Exception as e:
        print(f"Database connection failed: {e}")
        return

    cursor.execute("SELECT id, zip_code FROM zip_codes;")
    zip_codes = cursor.fetchall()

    for zip_id, zip_code in zip_codes:
        print(f"Fetching active listings for {zip_code}...")

        # New API Endpoint: Limits to 500 active listings per zip code
        url = f"https://api.rentcast.io/v1/listings/rental/long-term?zipCode={zip_code}&status=Active&limit=500"
        headers = {"accept": "application/json", "X-Api-Key": API_KEY}

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            listings = response.json()
            print(f"Found {len(listings)} active listings in {zip_code}.")

            # The "Upsert" Query
            insert_query = """
                INSERT INTO active_listings 
                (id, zip_code_id, address, property_type, bedrooms, bathrooms, square_footage, price, days_on_market, last_seen_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) 
                DO UPDATE SET 
                    price = EXCLUDED.price,
                    days_on_market = EXCLUDED.days_on_market,
                    last_seen_date = EXCLUDED.last_seen_date;
            """

            # Loop through the JSON array and insert/update each listing
            for item in listings:
                listing_id = item.get("id")
                address = item.get("formattedAddress")
                prop_type = item.get("propertyType")
                beds = item.get("bedrooms")
                baths = item.get("bathrooms")
                sqft = item.get("squareFootage")
                price = item.get("price")
                dom = item.get("daysOnMarket")

                # Only save if we have the critical data
                if listing_id and price:
                    cursor.execute(
                        insert_query,
                        (
                            listing_id,
                            zip_id,
                            address,
                            prop_type,
                            beds,
                            baths,
                            sqft,
                            price,
                            dom,
                            date.today(),
                        ),
                    )

            print(f"Successfully saved database for {zip_code}.")

        else:
            print(f"API Error for {zip_code}: {response.status_code} - {response.text}")

    # Commit changes and close
    conn.commit()
    cursor.close()
    conn.close()
    print("Data pipeline complete.")


if __name__ == "__main__":
    fetch_and_store_listings()
