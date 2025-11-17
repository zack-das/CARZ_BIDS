import sqlite3


class CarAuctionDB:
    def __init__(self, db_name="carz_auctions.db"):
        self.db_name = db_name
        self.init_db()

    def init_db(self):
        """Initialize database tables"""
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

        # Auctions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS auctions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                car_name TEXT NOT NULL,
                car_description TEXT,
                image_url TEXT,
                starting_bid REAL NOT NULL,
                current_bid REAL NOT NULL,
                end_time TIMESTAMP NOT NULL,
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
                FOREIGN KEY (user_id) REFERENCES users (id)
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
            "SELECT * FROM users WHERE email = ? AND password = ?", (email, password)
        )
        user = cursor.fetchone()
        conn.close()

        if user:
            return {"success": True, "user": dict(user)}
        else:
            return {"success": False, "error": "Invalid credentials"}

    def get_auctions(self):
        """Get all active auctions with bidder count"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT a.*, COUNT(DISTINCT b.user_id) as bidder_count
            FROM auctions a
            LEFT JOIN bids b ON a.id = b.auction_id
            WHERE a.status = 'active'
            GROUP BY a.id
        """)

        auctions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return auctions

    def place_bid(self, auction_id, user_id, amount):
        """Place a bid on an auction"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        # Check if auction exists and is active
        auction = cursor.execute(
            'SELECT * FROM auctions WHERE id = ? AND status = "active"', (auction_id,)
        ).fetchone()

        if not auction:
            conn.close()
            return {"success": False, "error": "Auction not found or ended"}

        # Check if user has already bid
        existing_bid = cursor.execute(
            "SELECT * FROM bids WHERE auction_id = ? AND user_id = ?",
            (auction_id, user_id),
        ).fetchone()

        if existing_bid:
            conn.close()
            return {"success": False, "error": "You have already placed a bid"}

        # Check if bid is valid
        if amount <= auction["current_bid"]:
            conn.close()
            return {"success": False, "error": "Bid must be higher than current bid"}

        # Place the bid
        cursor.execute(
            "INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)",
            (auction_id, user_id, amount),
        )

        # Update current bid
        cursor.execute(
            "UPDATE auctions SET current_bid = ? WHERE id = ?", (amount, auction_id)
        )

        conn.commit()
        conn.close()
        return {"success": True}

    def get_bids(self, auction_id):
        """Get all bids for an auction"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT b.*, u.name as user_name
            FROM bids b
            JOIN users u ON b.user_id = u.id
            WHERE b.auction_id = ?
            ORDER BY b.amount DESC
        """,
            (auction_id,),
        )

        bids = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return bids

    def add_sample_data(self):
        """Add sample auction data"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        print("Dropping existing tables...")
        cursor.execute("DROP TABLE IF EXISTS bids")
        cursor.execute("DROP TABLE IF EXISTS auctions")
        cursor.execute("DROP TABLE IF EXISTS users")
        conn.commit()

        print("Recreating tables...")
        self.init_db()

        # Add sample auctions
        sample_auctions = [
            (
                "Toyota Camry 2022",
                "Like new with low mileage",
                "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400",
                15000,
                15000,
                "2024-12-31 23:59:59",
            ),
            (
                "Ford Mustang GT",
                "Brand new sports car",
                "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400",
                45000,
                45000,
                "2024-12-25 23:59:59",
            ),
            (
                "Honda Civic 2021",
                "Well maintained, great condition",
                "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400",
                20000,
                20000,
                "2024-12-20 23:59:59",
            ),
        ]

        cursor.executemany(
            """
            INSERT INTO auctions (car_name, car_description, image_url, starting_bid, current_bid, end_time)
            VALUES (?, ?, ?, ?, ?, ?)
        """,
            sample_auctions,
        )

        # Add a sample user for testing
        cursor.execute(
            "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
            ("test@example.com", "password123", "Test User"),
        )

        conn.commit()
        conn.close()
        print("Sample data added successfully!")


# Global database instance
db = CarAuctionDB()
