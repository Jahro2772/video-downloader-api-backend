const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const RAPIDAPI_KEY = '2bc9ae5da3msh3dd53e63aa343dcp1961c5jsn50d5cac5416d';
const API_HOST = 'social-media-video-downloader.p.rapidapi.com';

// Helper function
async function callRapidAPI(endpoint, params) {
    try {
        const response = await axios.get(`https://${API_HOST}${endpoint}`, {
            params: params,
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': API_HOST
            },
            timeout: 30000
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
}

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Multi-Platform Social Media API',
        version: '3.0.0',
        features: [
            'Instagram Media Download',
            'Instagram User Profile',
            'Facebook Posts',
            'Facebook Profile',
            'TikTok Post',
            'TikTok User'
        ]
    });
});

// 1. Instagram Media Download (Main endpoint)
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

        // Extract shortcode from URL
        const shortcodeMatch = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
        if (!shortcodeMatch) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Instagram URL'
            });
        }

        const shortcode = shortcodeMatch[2];

        // Call RapidAPI
        const data = await callRapidAPI('/instagram/v3/media/post/details', {
            shortcode: shortcode,
            renderableFormats: '720p,480p,360p',
            highres: 'true'
        });

        // Extract video URL
        let videoUrl = null;
        let thumbnail = null;

        if (data.video_url) {
            videoUrl = data.video_url;
        } else if (data.video_versions && data.video_versions.length > 0) {
            videoUrl = data.video_versions[0].url;
        }

        if (data.thumbnail_url) {
            thumbnail = data.thumbnail_url;
        } else if (data.image_versions2 && data.image_versions2.candidates) {
            thumbnail = data.image_versions2.candidates[0].url;
        }

        if (!videoUrl) {
            return res.status(404).json({
                success: false,
                error: 'No video found in this post'
            });
        }

        res.json({
            success: true,
            platform: 'instagram',
            videoUrl: videoUrl,
            thumbnail: thumbnail,
            title: data.caption?.text || 'Instagram Video',
            duration: data.video_duration || 0,
            fileSize: 0
        });

    } catch (error) {
        console.error('Download Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 2. Instagram User Profile
app.get('/api/instagram/user', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username parameter is required'
            });
        }

        console.log('👤 Instagram user request for:', username);

        const data = await callRapidAPI('/instagram/user', { username });

        res.json({
            success: true,
            platform: 'instagram',
            data: data
        });

    } catch (error) {
        console.error('Instagram User Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 3. Facebook Posts
app.get('/api/facebook/post', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL parameter is required'
            });
        }

        console.log('📘 Facebook post request for:', url);

        const data = await callRapidAPI('/facebook/posts', { url });

        res.json({
            success: true,
            platform: 'facebook',
            data: data
        });

    } catch (error) {
        console.error('Facebook Post Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 4. Facebook Profile
app.get('/api/facebook/profile', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username parameter is required'
            });
        }

        console.log('👤 Facebook profile request for:', username);

        const data = await callRapidAPI('/facebook/profile', { username });

        res.json({
            success: true,
            platform: 'facebook',
            data: data
        });

    } catch (error) {
        console.error('Facebook Profile Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 5. TikTok Post
app.get('/api/tiktok/post', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL parameter is required'
            });
        }

        console.log('🎵 TikTok post request for:', url);

        const data = await callRapidAPI('/tiktok/post', { url });

        res.json({
            success: true,
            platform: 'tiktok',
            data: data
        });

    } catch (error) {
        console.error('TikTok Post Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 6. TikTok User
app.get('/api/tiktok/user', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username parameter is required'
            });
        }

        console.log('👤 TikTok user request for:', username);

        const data = await callRapidAPI('/tiktok/user', { username });

        res.json({
            success: true,
            platform: 'tiktok',
            data: data
        });

    } catch (error) {
        console.error('TikTok User Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('✅ Server running on port', PORT);
    console.log('🔑 RapidAPI: Configured ✅');
    console.log('📱 Features: 6 endpoints ready');
});

