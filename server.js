const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/*', async (req, res) => {
    try {
        const apiResponse = await axios.get(`https://fantasy.premierleague.com${req.url}`);
        res.json(apiResponse.data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the data.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
