from database import db
import os

print("=== Starting database initialization ===")
print("Database path:", db.db_name)
print("Current working directory:", os.getcwd())

# Check if file exists before
if os.path.exists(db.db_name):
    print(f"Database file exists before init: {os.path.getsize(db.db_name)} bytes")
else:
    print("Database file does NOT exist before init")

print("Initializing database...")
db.init_db()

# Check after init_db
if os.path.exists(db.db_name):
    print(f"Database file exists after init_db: {os.path.getsize(db.db_name)} bytes")
else:
    print("Database file does NOT exist after init_db")

print("Adding sample data...")
db.add_sample_data()

# Check after add_sample_data
if os.path.exists(db.db_name):
    size = os.path.getsize(db.db_name)
    print(f"Database file exists after add_sample_data: {size} bytes")
    if size == 0:
        print("⚠️ WARNING: Database file is still 0 bytes!")
else:
    print("Database file does NOT exist after add_sample_data")

print("=== Database initialization complete ===")
