const express = require('express');
const cors = require('cors');
const {analyzeUrl} = require('./services/analysisService');

const app = express();
const PORT = 3001;

//Middleware
app.use(cors());
app.use(express.json());

// API endpoints
app.post('/analyze', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'J-Fox needs a URL to analyze!' });
    }

    console.log(`Received URL to analyze: ${url}`);

    const result = await analyzeUrl(url);

    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json({ error: result.error });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`J-Fox is live and listening on http://localhost:${PORT}`);
});