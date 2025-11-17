const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../')));

app.use(express.static(path.join(__dirname, '../')));
app.use(express.static(path.join(__dirname, '../css'))); // Add CSS directory
app.use(express.static(path.join(__dirname, '../js')));  // Add JS directory
app.use(express.static(path.join(__dirname, '../img'))); // Add images directory

// Specific route for CSS files to ensure they're served correctly
app.get('*.css', (req, res, next) => {
  res.setHeader('Content-Type', 'text/css');
  next();
});

// FIXED: Database path - point to project root where Python creates it
const dbPath = path.join(__dirname, '../carz_auctions.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');

    // Verify tables exist on startup
    verifyDatabaseTables();
  }
});

// Function to verify and create tables if they don't exist
function verifyDatabaseTables() {
  console.log('🔍 Verifying database tables...');

  const createTablesSQL = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Auctions table
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
    );

    -- Bids table
    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auction_id INTEGER,
      user_id INTEGER,
      amount REAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (auction_id) REFERENCES auctions (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `;

  db.exec(createTablesSQL, (err) => {
    if (err) {
      console.error('❌ Error creating tables:', err);
    } else {
      console.log('Database tables verified/created');

      // Check if we have sample data
      checkSampleData();
    }
  });
}

// Function to check if we need sample data
function checkSampleData() {
  db.get('SELECT COUNT(*) as count FROM auctions', (err, row) => {
    if (err) {
      console.error('❌ Error checking auctions:', err);
      return;
    }

    if (row.count === 0) {
      console.log('No auctions found, adding sample data...');
      addSampleData();
    } else {
      console.log(`Found ${row.count} auctions in database`);
    }
  });
}

// Function to add sample data
function addSampleData() {
  const sampleAuctions = [
    ['Toyota Camry 2022', 'Like new with low mileage', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400', 15000, 15000, '2024-12-31 23:59:59'],
    ['Ford Mustang GT', 'Brand new sports car', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400', 45000, 45000, '2024-12-25 23:59:59'],
    ['Honda Civic 2021', 'Well maintained, great condition', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400', 20000, 20000, '2024-12-20 23:59:59']
  ];

  const insertAuctionSQL = `
    INSERT INTO auctions (car_name, car_description, image_url, starting_bid, current_bid, end_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  sampleAuctions.forEach((auction, index) => {
    db.run(insertAuctionSQL, auction, function(err) {
      if (err) {
        console.error(`❌ Error inserting auction ${index + 1}:`, err);
      } else {
        console.log(` Added auction: ${auction[0]}`);
      }
    });
  });

  // Add a test user
  db.run(
    'INSERT OR IGNORE INTO users (email, password, name) VALUES (?, ?, ?)',
    ['test@example.com', 'password123', 'Test User'],
    function(err) {
      if (err) {
        console.error('❌ Error adding test user:', err);
      } else {
        console.log(' Added test user: test@example.com');
      }
    }
  );
}

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Debug endpoint to check database status
app.get('/api/debug/db-status', (req, res) => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const tableCounts = {};
    let completed = 0;

    if (tables.length === 0) {
      return res.json({ tables: [], counts: {} });
    }

    tables.forEach(table => {
      db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
        if (err) {
          tableCounts[table.name] = 'Error';
        } else {
          tableCounts[table.name] = row.count;
        }

        completed++;
        if (completed === tables.length) {
          res.json({
            database: dbPath,
            tables: tables.map(t => t.name),
            counts: tableCounts,
            status: 'OK'
          });
        }
      });
    });
  });
});

// Register endpoint
app.post('/api/register', (req, res) => {
  console.log('Registration attempt:', req.body.email);

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  db.run(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
    [email, password, name],
    function(err) {
      if (err) {
        console.error('❌ Registration error:', err.message);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ success: false, error: 'Email already exists' });
        }
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      console.log('User registered:', email);
      res.json({
        success: true,
        user_id: this.lastID,
        message: 'User registered successfully'
      });
    }
  );
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  db.get(
    'SELECT id, email, name, created_at FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, row) => {
      if (err) {
        console.error('❌ Login error:', err);
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (!row) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      res.json({
        success: true,
        user: {
          id: row.id,
          email: row.email,
          name: row.name,
          created_at: row.created_at
        }
      });
    }
  );
});

// Auctions endpoint
app.get('/api/auctions', (req, res) => {
  console.log('Fetching auctions...');

  const query = `
    SELECT
      a.*,
      COUNT(DISTINCT b.user_id) as bidder_count
    FROM auctions a
    LEFT JOIN bids b ON a.id = b.auction_id
    WHERE a.status = 'active'
    GROUP BY a.id
    ORDER BY a.end_time ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching auctions:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch auctions',
        details: err.message
      });
    }

    console.log(`Found ${rows.length} auctions`);
    res.json(rows);
  });
});

// Bid endpoint
app.post('/api/auctions/:id/bid', (req, res) => {
  const auctionId = req.params.id;
  const { user_id, amount } = req.body;

  console.log(`💰 Bid attempt: auction=${auctionId}, user=${user_id}, amount=${amount}`);

  if (!user_id || !amount) {
    return res.status(400).json({ success: false, error: 'User ID and amount are required' });
  }

  // Check if auction exists and is active
  db.get(
    'SELECT * FROM auctions WHERE id = ? AND status = "active"',
    [auctionId],
    (err, auction) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (!auction) {
        return res.status(404).json({ success: false, error: 'Auction not found or ended' });
      }

      if (amount <= auction.current_bid) {
        return res.status(400).json({
          success: false,
          error: 'Bid must be higher than current bid'
        });
      }

      // Check if user already bid
      db.get(
        'SELECT * FROM bids WHERE auction_id = ? AND user_id = ?',
        [auctionId, user_id],
        (err, existingBid) => {
          if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
          }

          if (existingBid) {
            return res.status(400).json({
              success: false,
              error: 'You have already placed a bid on this auction'
            });
          }

          // Place the bid
          db.run(
            'INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)',
            [auctionId, user_id, amount],
            function(err) {
              if (err) {
                return res.status(500).json({ success: false, error: 'Failed to place bid' });
              }

              // Update current bid
              db.run(
                'UPDATE auctions SET current_bid = ? WHERE id = ?',
                [amount, auctionId],
                (err) => {
                  if (err) {
                    return res.status(500).json({ success: false, error: 'Failed to update auction' });
                  }

                  res.json({
                    success: true,
                    message: 'Bid placed successfully'
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('Server started successfully!');
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log('\n Debug endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/debug/db-status`);
  console.log('\nMain endpoints:');
  console.log(`   POST http://localhost:${PORT}/api/register`);
  console.log(`   POST http://localhost:${PORT}/api/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auctions`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
