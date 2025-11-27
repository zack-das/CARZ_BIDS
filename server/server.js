const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware configuration
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../')));

// Database configuration
const dbPath = path.join(__dirname, 'carz_auctions.db');

// Initialize database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
    verifyDatabaseTables();
  }
});

/**
 * Verify that required database tables exist
 * Logs warning if tables are missing (requires Python initialization)
 */
function verifyDatabaseTables() {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error checking database tables:', err);
      return;
    }

    if (tables.length === 0) {
      console.log('No database tables found. Please run: python init_db.py');
    } else {
      checkSampleData();
    }
  });
}

/**
 * Check if sample data exists in the database
 * Provides guidance if no auctions are found
 */
function checkSampleData() {
  db.get('SELECT COUNT(*) as count FROM auctions', (err, row) => {
    if (err) {
      console.error('Error checking auction data:', err);
      return;
    }

    if (row.count === 0) {
      console.log('No auctions found in database');
    }
  });
}

// Enable foreign key constraints for data integrity
db.run('PRAGMA foreign_keys = ON');

// API Endpoints

/**
 * User registration endpoint
 * Creates new user account with email, password, and name
 */
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  db.run(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
    [email, password, name],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ success: false, error: 'Email already exists' });
        }
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      res.json({
        success: true,
        user_id: this.lastID,
        message: 'User registered successfully'
      });
    }
  );
});

/**
 * User login endpoint
 * Authenticates user with email and password
 */
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

/**
 * Get all active auctions with gallery and specifications
 * Returns formatted auction data with parsed JSON fields
 */
app.get('/api/auctions', (req, res) => {
  const query = `
    SELECT
      a.*,
      COUNT(DISTINCT b.user_id) as actual_bidder_count
    FROM auctions a
    LEFT JOIN bids b ON a.id = b.auction_id
    WHERE a.status = 'active'
    GROUP BY a.id
    ORDER BY a.end_time ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching auctions:', err.message);
      return res.status(500).json({ error: 'Failed to fetch auctions' });
    }

    // Parse gallery and specs JSON fields
    const auctions = rows.map(row => {
      const auction = { ...row };

      // Parse gallery JSON
      if (row.gallery_json) {
        try {
          auction.gallery = JSON.parse(row.gallery_json);
        } catch (e) {
          auction.gallery = [];
        }
      } else {
        auction.gallery = [];
      }

      // Parse specifications JSON
      if (row.specs_json) {
        try {
          auction.specs = JSON.parse(row.specs_json);
        } catch (e) {
          auction.specs = {};
        }
      } else {
        auction.specs = {};
      }

      return auction;
    });

    res.json(auctions);
  });
});

/**
 * Place bid on auction endpoint
 * Handles bid validation, user checks, and auction updates
 */
app.post('/api/auctions/:id/bid', (req, res) => {
  const auctionId = req.params.id;
  const { user_id, amount } = req.body;

  // Validate required parameters
  if (!user_id || !amount) {
    return res.status(400).json({ success: false, error: 'User ID and amount are required' });
  }

  // Use transaction for data consistency
  db.serialize(() => {
    // Check if auction exists and is active
    db.get(
      'SELECT * FROM auctions WHERE id = ? AND status = "active"',
      [auctionId],
      (err, auction) => {
        if (err) {
          console.error('Database error checking auction:', err);
          return res.status(500).json({ success: false, error: 'Database error checking auction' });
        }

        if (!auction) {
          return res.status(404).json({ success: false, error: 'Auction not found or ended' });
        }

        // Check if auction has ended
        if (new Date() > new Date(auction.end_time)) {
          return res.status(400).json({ success: false, error: 'Auction has ended' });
        }

        // Check if user has already bid on this auction
        db.get(
          'SELECT * FROM bids WHERE auction_id = ? AND user_id = ?',
          [auctionId, user_id],
          (err, existingBid) => {
            if (err) {
              console.error('Database error checking existing bid:', err);
              return res.status(500).json({ success: false, error: 'Database error checking existing bid' });
            }

            if (existingBid) {
              return res.status(400).json({
                success: false,
                error: 'You have already placed a bid on this vehicle'
              });
            }

            // Validate bid amount
            if (amount <= auction.current_bid) {
              return res.status(400).json({
                success: false,
                error: `Bid must be higher than current bid of ksh${auction.current_bid.toLocaleString()}`
              });
            }

            // Place the bid
            db.run(
              'INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)',
              [auctionId, user_id, amount],
              function(err) {
                if (err) {
                  console.error('Error inserting bid:', err);
                  return res.status(500).json({ success: false, error: 'Failed to place bid' });
                }

                // Update auction current bid
                db.run(
                  'UPDATE auctions SET current_bid = ? WHERE id = ?',
                  [amount, auctionId],
                  (err) => {
                    if (err) {
                      console.error('Error updating auction current bid:', err);
                      return res.status(500).json({ success: false, error: 'Failed to update auction' });
                    }

                    res.json({
                      success: true,
                      message: 'Bid placed successfully!'
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
});

/**
 * Check if user has already bid on specific auction
 */
app.get('/api/auctions/:id/user-bid/:userId', (req, res) => {
  const { id, userId } = req.params;

  db.get(
    'SELECT * FROM bids WHERE auction_id = ? AND user_id = ?',
    [id, userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      res.json({ hasBid: !!row });
    }
  );
});

/**
 * Database status endpoint for monitoring
 * Returns database structure and table counts
 */
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
        tableCounts[table.name] = row ? row.count : 'Error';
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

/**
 * Get specific auction details for debugging
 */
app.get('/api/debug/auctions/:id', (req, res) => {
  const auctionId = req.params.id;

  db.get(
    'SELECT * FROM auctions WHERE id = ?',
    [auctionId],
    (err, auction) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!auction) {
        return res.status(404).json({ error: 'Auction not found' });
      }

      res.json(auction);
    }
  );
});

// Serve the main application page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Car Auction Server Started`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/auctions`);
});
// shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
