# Rent Analyzer Dashboard

> **A quick full-stack sandbox project built to refamiliarize myself with modern web development, ETL pipelines, API integrations, and relational databases.**

This project tracks active rental listings across specific zip codes. It consists of a Python-based data pipeline that pulls live market data from the RentCast API, stores it in a PostgreSQL database, and a React frontend that visualizes the data through interactive charts and tables.

## Local Setup

Create a `.env` file in your project root and add your connection strings and API keys:
```env

RENTCAST_API_KEY=your_rentcast_key_here

DATABASE_URL=your_neon_postgres_connection_string_here```

# Install required Python packages
pip install requests psycopg2-binary python-dotenv

# Run the ETL script
python fetch_data.py

# Navigate to the frontend folder
cd frontend

# Install Node dependencies
npm install

# Start the Vite dev server
npm run dev