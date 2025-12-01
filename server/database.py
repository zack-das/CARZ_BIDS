import sqlite3
from datetime import datetime, timedelta
import json
import os

class CarAuctionDB:
    def __init__(self, db_name=None):
        if db_name is None:

            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.db_name = os.path.join(base_dir, "carz_auctions.db")
        else:
            self.db_name = db_name
        print(f"Python database path: {self.db_name}")



    def init_db(self):
        """Initialize database tables with gallery and specs support"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Auctions table with gallery and specs as JSON
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS auctions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                car_name TEXT NOT NULL,
                car_description TEXT,
                image_url TEXT,
                starting_bid REAL NOT NULL,
                current_bid REAL NOT NULL,
                bidder_count INTEGER DEFAULT 0,
                end_time TIMESTAMP NOT NULL,
                gallery_json TEXT,
                specs_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            )
        """)

        # Bids table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bids (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                auction_id INTEGER,
                user_id INTEGER,
                amount REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (auction_id) REFERENCES auctions (id),
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(auction_id, user_id)
            )
        """)

        conn.commit()
        conn.close()

    def register_user(self, email, password, name):
        """Register a new user"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
                (email, password, name),
            )
            conn.commit()
            return {"success": True, "user_id": cursor.lastrowid}
        except sqlite3.IntegrityError:
            return {"success": False, "error": "Email already exists"}
        finally:
            conn.close()

    def login_user(self, email, password):
        """Login user"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, email, name, created_at FROM users WHERE email = ? AND password = ?",
            (email, password)
        )
        user = cursor.fetchone()
        conn.close()

        if user:
            return {
                "success": True,
                "user": {
                    "id": user[0],
                    "email": user[1],
                    "name": user[2],
                    "created_at": user[3]
                }
            }
        else:
            return {"success": False, "error": "Invalid credentials"}

    def get_auctions(self):
        """Get all active auctions with proper gallery and specs"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                a.*,
                COUNT(DISTINCT b.user_id) as actual_bidder_count
            FROM auctions a
            LEFT JOIN bids b ON a.id = b.auction_id
            WHERE a.status = 'active'
            GROUP BY a.id
            ORDER BY a.end_time ASC
        """)

        columns = [col[0] for col in cursor.description]
        raw_auctions = cursor.fetchall()

        # Convert to proper format with gallery and specs
        auctions = []
        for row in raw_auctions:
            auction_dict = dict(zip(columns, row))

            # Parse gallery JSON
            if auction_dict.get('gallery_json'):
                auction_dict['gallery'] = json.loads(auction_dict['gallery_json'])
            else:
                auction_dict['gallery'] = []

            # Parse specs JSON
            if auction_dict.get('specs_json'):
                auction_dict['specs'] = json.loads(auction_dict['specs_json'])
            else:
                auction_dict['specs'] = {}

            auctions.append(auction_dict)

        conn.close()
        return auctions

    def place_bid(self, auction_id, user_id, amount):
        """Place a bid on an auction"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        # Check if auction exists and is active
        cursor.execute(
            'SELECT * FROM auctions WHERE id = ? AND status = "active"',
            (auction_id,)
        )
        auction_row = cursor.fetchone()

        if not auction_row:
            conn.close()
            return {"success": False, "error": "Auction not found or ended"}

        columns = [col[0] for col in cursor.description]
        auction = dict(zip(columns, auction_row))

        # Check if auction has ended
        if datetime.now() > datetime.strptime(auction['end_time'], '%Y-%m-%d %H:%M:%S'):
            conn.close()
            return {"success": False, "error": "Auction has ended"}

        # Check if user has already bid
        cursor.execute(
            "SELECT * FROM bids WHERE auction_id = ? AND user_id = ?",
            (auction_id, user_id),
        )
        existing_bid = cursor.fetchone()

        if existing_bid:
            conn.close()
            return {"success": False, "error": "You have already placed a bid on this vehicle"}

        # Check if bid is valid
        if amount <= auction['current_bid']:
            conn.close()
            return {"success": False, "error": f"Bid must be higher than current bid of ksh{auction['current_bid']:,.0f}"}

        try:
            # Place the bid
            cursor.execute(
                "INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)",
                (auction_id, user_id, amount),
            )

            # Update current bid
            cursor.execute(
                "UPDATE auctions SET current_bid = ? WHERE id = ?",
                (amount, auction_id)
            )

            conn.commit()
            conn.close()
            return {"success": True, "message": "Bid placed successfully!"}

        except sqlite3.IntegrityError as e:
            conn.close()
            return {"success": False, "error": "You have already placed a bid on this vehicle"}

    def get_user_bid(self, auction_id, user_id):
        """Check if user has already bid on this auction"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM bids WHERE auction_id = ? AND user_id = ?",
            (auction_id, user_id),
        )
        bid = cursor.fetchone()
        conn.close()

        return bool(bid)

    def add_sample_data(self):
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        # First, make sure tables exist
        self.init_db()

        # Then clear existing data
        cursor.execute("DELETE FROM bids")
        cursor.execute("DELETE FROM auctions")
        cursor.execute("DELETE FROM users")
        conn.commit()

        # Calculate end times
        now = datetime.now()


        sample_auctions = [
            (
                "Pagani Huayra",
                "Mid-engine sports car produced by Italian automaker Pagani",
                "/img/imgi_265_18015-MC20BluInfinito-scaled-e1707920217641.jpg",
                2015000000,
                2650000,
                8,
                (now + timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S'),
                json.dumps([
                    {
                        "type": "image",
                        "src": "/img/imgi_265_18015-MC20BluInfinito-scaled-e1707920217641.jpg",
                        "alt": "Pagani Huayra Front"
                    },
                    {
                        "type": "image",
                        "src": "/img/imgi_265_18015-MC20BluInfinito-scaled-e1707920217641.jpg",
                        "alt": "Pagani Huayra Side"
                    },
                    {
                        "type": "iframe",
                        "src": "https://www.youtube.com/embed/1rYKERKZOgc",
                        "alt": "Pagani Huayra Interior"
                    }
                ]),
                json.dumps({
                    "engine": "6.0L V12",
                    "horsepower": "730 hp",
                    "torque": "740 lb-ft",
                    "acceleration": "2.8s 0-60 mph",
                    "topSpeed": "238 mph",
                    "transmission": "7-speed automatic"
                })
            ),
            (
                "Porsche Taycan Turbo",
                "All-electric luxury sports sedan",
                "/img/imgi_263_prosche-electric-car-01.jpg",
                18000000,
                16000000,
                12,
                (now + timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S'),
                json.dumps([
                    {
                        "type": "image",
                        "src": "/img/imgi_263_prosche-electric-car-01.jpg",
                        "alt": "Porsche Taycan Front"
                    },
                    {
                        "type": "iframe",
                        "src": "https://www.youtube.com/embed/Oi-xWqXnufI",
                        "alt": "Porsche Taycan Interior"
                    }
                ]),
                json.dumps({
                    "engine": "Dual Electric Motors",
                    "horsepower": "750 hp",
                    "torque": "774 lb-ft",
                    "acceleration": "2.6s 0-60 mph",
                    "topSpeed": "161 mph",
                    "range": "201 miles"
                })
            ),
            (
                "Nissan Leaf",
                "Compact all-electric hatchback",
                "/img/imgi_253_250308-all-new-nissan-leaf-dynamic-pictures-01.jpg",
                1100000,
                9000000,
                5,
                (now + timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S'),
                json.dumps([
                    {
                        "type": "iframe",
                        "src": "https://www.youtube.com/embed/TDklt0vweyA",
                        "alt": "Nissan Leaf Front"
                    }
                ]),
                json.dumps({
                    "engine": "Electric Motor",
                    "horsepower": "147 hp",
                    "torque": "236 lb-ft",
                    "acceleration": "7.4s 0-60 mph",
                    "topSpeed": "89 mph",
                    "range": "149 miles"
                })
            ),
            (
                "Rolls Royce Phantom",
                "Full-sized luxury saloon car",
                "/img/imgi_247_rolls_royce_phantom_top_10.jpg",
                45000000,
                5000000,
                6,
                (now + timedelta(days=3)).strftime('%Y-%m-%d %H:%M:%S'),
                json.dumps([
                    {
                        "type": "iframe",
                        "src": "https://www.youtube.com/embed/FzO6KdXHeeU",
                        "alt": "Rolls Royce Phantom"
                    }
                ]),
                json.dumps({
                    "engine": "6.75L V12",
                    "horsepower": "563 hp",
                    "torque": "664 lb-ft",
                    "acceleration": "5.1s 0-60 mph",
                    "topSpeed": "155 mph",
                    "transmission": "8-speed automatic"
                })
            ),
        ]

        cursor.executemany(
            """
            INSERT INTO auctions (car_name, car_description, image_url, starting_bid, current_bid, bidder_count, end_time, gallery_json, specs_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            sample_auctions,
        )


        cursor.execute(
            "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
            ("test@example.com", "password123", "Test User"),
        )

        conn.commit()
        conn.close()
        print("Sample car data with gallery and specs added successfully!")

# Global database instance
db = CarAuctionDB()


if __name__ == "__main__":
    db.add_sample_data()

