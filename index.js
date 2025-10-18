const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());  // allow all origins

// Flipkart App Credentials
const CLIENT_ID = 'YOUR_FLIPKART_APP_ID';       // replace with your App ID
const CLIENT_SECRET = 'YOUR_FLIPKART_SECRET';   // replace with your Secret
const REDIRECT_URI = 'https://flipkart-backend-delta.vercel.app/callback'; // must match your Vercel domain

// Store token in memory (temporary)
let ACCESS_TOKEN = '';

// -------------------- ROUTES -------------------- //

// Step 1: Login → Flipkart OAuth
app.get('/login', (req, res) => {
    const authURL = `https://seller.flipkart.com/api/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    res.redirect(authURL);
});

// Step 2: Callback → get access token & store in memory
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post('https://seller.flipkart.com/api/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        });
        ACCESS_TOKEN = response.data.access_token;
        res.send('✅ Access Token stored in memory! You can now fetch orders from /orders');
    } catch (err) {
        res.status(500).send('❌ Error getting access token: ' + err.message);
    }
});

// Step 3: Orders endpoint → fetch Flipkart orders using stored token
app.get('/orders', async (req, res) => {
    try {
        if (!ACCESS_TOKEN) return res.status(400).send('Token not set. Login first via /login');
        const orders = await axios.get('https://api.flipkart.net/sellers/orders', {
            headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
        });
        res.status(200).json(orders.data);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching orders', details: err.message });
    }
});

// -------------------- START SERVER -------------------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
