# CSE412 Assignment 04 — Indexing Performance

Setup Instructions

1. Download and unzip the project folder.

2. Create a PostgreSQL database:

   ```sql
   psql -U postgres
   CREATE DATABASE assignment04db;
   CREATE USER assignment_user WITH LOGIN;
   GRANT ALL PRIVILEGES ON DATABASE assignment04db TO assignment_user;
   \q
   ```

3. Run the schema to create tables:

   ```bash
   psql -U assignment_user -d assignment04db -f schema.sql
   ```

4. Create a Python virtual environment and activate it:

   ```bash
   python3 -m venv venv
   source venv/bin/activate   # macOS/Linux
   venv\Scripts\activate      # Windows
   ```

5. Install dependencies:

   ```bash
   pip install flask psycopg2-binary faker
   ```

6. Update database connection in `data_generation.py` and `app.py`:

   * Passwordless (recommended for submission):

     ```python
     conn = psycopg2.connect(
         dbname="assignment04db",
         user="assignment_user",
         host="localhost"
     )
     ```

   * With password (optional, if your setup requires it):

     ```python
     conn = psycopg2.connect(
         dbname="assignment04db",
         user="assignment_user",
         password="12345",  # or your password
         host="localhost"
     )
     ```

7. Populate the database with sample data:

   ```bash
   python data_generation.py
   ```

   This inserts 10,000 customers and 10,000 orders.

8. Run the web application:

   ```bash
   python app.py
   ```

9. Access the application in your browser:

   * Single-table search: [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
   * Join search: [http://127.0.0.1:5000/join](http://127.0.0.1:5000/join)

Included Files

* app.py — Flask backend
* schema.sql — Database schema
* data_generation.py — Data insertion script
* templates/index.html — Single-table search UI
* templates/join.html — Join search UI
* A4_report.pdf — Assignment report

Notes

* Submission does not include a database password.
* If your PostgreSQL setup requires a password, add it in `data_generation.py` and `app.py` as shown above.
* Ensure PostgreSQL is running locally before executing scripts.
