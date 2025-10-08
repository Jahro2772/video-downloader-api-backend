const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Social Media Video Downloader API',
        version: '1.0.0'
    });
});

app.get('/api/download', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL parameter is required'
            });
        }

        console.log('📥 Download request for:', url);

        // RapidAPI Call
        const response = await axios.get('https://social-media-video-downloader.p.rapidapi.com/smvd/get/all', {
            params: { url: url },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com'
            },
            timeout: 30000
        });

        const data = response.data;

        // Success response
        if (data && data.success) {
            return res.json({
                success: true,
                platform: data.platform || 'unknown',
                videoUrl: data.url || data.download_url,
                thumbnail: data.thumbnail || data.picture,
                title: data.title || 'video',
                duration: data.duration || 0,
                fileSize: 0
            });
        }

        throw new Error('Video not found');

    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

app.listen(PORT, () => {
    console.log('✅ Server running on port', PORT);
    console.log('🔑 RapidAPI:', RAPIDAPI_KEY ? 'Configured ✅' : 'Not configured ❌');
});
