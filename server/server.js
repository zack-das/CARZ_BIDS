const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // Serve your frontend files

// Helper function to run Python scripts
function runPythonScript(scriptName, data) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['-c', `
import sys
import os
sys.path.append(os.path.dirname(__file__))
from database import db
import json

data = json.loads('${JSON.stringify(data)}')
script = "${scriptName}"

if script == "register":
    result = db.register_user(data.email, data.password, data.name)
elif script == "login":
    result = db.login_user(data.email, data.password)
elif script == "get_auctions":
    result = db.get_auctions()
elif script == "place_bid":
    result = db.place_bid(data.auction_id, data.user_id, data.amount)
elif script == "get_bids":
    result = db.get_bids(data.auction_id)

print(json.dumps(result))
        `]);

        let result = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    reject('Failed to parse Python output');
                }
            } else {
                reject(error || 'Python script failed');
            }
        });
    });
}

// API Routes

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        const result = await runPythonScript('register', { name, email, password });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error: ' + error
        });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        const result = await runPythonScript('login', { email, password });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error: ' + error
        });
    }
});

// Get all auctions
app.get('/api/auctions', async (req, res) => {
    try {
        const result = await runPythonScript('get_auctions', {});
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error: ' + error
        });
    }
});

// Place a bid
app.post('/api/auctions/:id/bid', async (req, res) => {
    try {
        const auction_id = parseInt(req.params.id);
        const { user_id, amount } = req.body;

        if (!user_id || !amount) {
            return res.status(400).json({
                success: false,
                error: 'User ID and amount are required'
            });
        }

        const result = await runPythonScript('place_bid', {
            auction_id,
            user_id,
            amount
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error: ' + error
        });
    }
});

// Get bids for an auction
app.get('/api/auctions/:id/bids', async (req, res) => {
    try {
        const auction_id = parseInt(req.params.id);
        const result = await runPythonScript('get_bids', { auction_id });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error: ' + error
        });
    }
});

// Initialize sample data
app.post('/api/init-data', async (req, res) => {
    try {
        // You'll need to add this method to your database.py
        const pythonProcess = spawn('python', ['-c', `
import sys
import os
sys.path.append(os.path.dirname(__file__))
from database import db
db.add_sample_data()
print('{"success": true, "message": "Sample data added"}')
        `]);

        let result = '';
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                res.json(JSON.parse(result));
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to initialize data'
                });
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error: ' + error
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API endpoints:');
    console.log('  POST /api/register');
    console.log('  POST /api/login');
    console.log('  GET  /api/auctions');
    console.log('  POST /api/auctions/:id/bid');
    console.log('  GET  /api/auctions/:id/bids');
});
