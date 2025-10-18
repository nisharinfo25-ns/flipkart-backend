const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
app.use(express.json());

// Flipkart credentials
const CLIENT_ID = 'YOUR_FLIPKART_APP_ID';
const CLIENT_SECRET = 'YOUR_FLIPKART_SECRET';
const REDIRECT_URI = 'https://flipkart-backend-delta.vercel.app/'; // replace with your free domain
const TOKEN_FILE = 'token.txt'; // file to store access token
const cors = require('cors');
app.use(cors());  // allow all origins

// Step 1: Login → Flipkart OAuth
app.get('/login', (req, res) => {
    const authURL = `https://seller.flipkart.com/api/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    res.redirect(authURL);
});

// Step 2: Callback → get access token & store in file
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
        const accessToken = response.data.access_token;

        // Store token in file
        fs.writeFileSync(TOKEN_FILE, accessToken, 'utf8');

        res.send(`Access Token stored successfully! You can now fetch orders from /orders endpoint.`);
    } catch (err) {
        res.send('Error getting access token: ' + err);
    }
});

// Step 3: Orders endpoint → read token from file
app.get('/orders', async (req, res) => {
    try {
        const ACCESS_TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8');
        const orders = await axios.get('https://api.flipkart.net/sellers/orders', {
            headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
        });
        res.json(orders.data);
    } catch (err) {
        res.send('Error fetching orders: ' + err);
    }
});

// CORS for Lovable frontend
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://indiabizz.lovable.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
