from database import db

print("Initializing database...")
db.init_db()
print("Adding sample data...")
db.add_sample_data()
print("Database initialized successfully!")
print("Tables created: users, auctions, bids")
print("Sample data added: 3 auctions and 1 test user")
