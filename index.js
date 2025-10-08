const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const API_HOST = 'social-media-video-downloader.p.rapidapi.com';

// Helper function for API calls
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
        version: '2.0.0',
        features: [
            'Instagram Media Post',
            'Instagram User Profile',
            'Instagram User ID from Username',
            'Facebook Post Details',
            'Facebook Profile Details',
            'Facebook Profile Reels',
            'Facebook Profile Photos',
            'TikTok User Details',
            'TikTok Post Details'
        ]
    });
});

// 1. Download Video/Post
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

        const data = await callRapidAPI('/smvd/get/all', { url });

        if (data && data.success) {
            return res.json({
                success: true,
                platform: data.platform || 'unknown',
                videoUrl: data.url || data.download_url,
                thumbnail: data.thumbnail || data.picture,
                title: data.title || 'media',
                duration: data.duration || 0,
                fileSize: 0
            });
        }

        throw new Error('Media not found');

    } catch (error) {
        console.error('Download Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 2. Instagram User Profile
app.get('/api/instagram/profile', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username parameter is required'
            });
        }

        console.log('👤 Instagram profile request for:', username);

        const data = await callRapidAPI('/smvd/get/instagram/user', { username });

        res.json({
            success: true,
            platform: 'instagram',
            data: data
        });

    } catch (error) {
        console.error('Instagram Profile Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 3. Instagram User ID from Username
app.get('/api/instagram/userid', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username parameter is required'
            });
        }

        console.log('🔍 Instagram User ID request for:', username);

        const data = await callRapidAPI('/smvd/get/instagram/userid', { username });

        res.json({
            success: true,
            platform: 'instagram',
            userId: data.user_id || data.id,
            username: username
        });

    } catch (error) {
        console.error('Instagram UserID Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 4. Instagram Media Post Info
app.get('/api/instagram/post', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL parameter is required'
            });
        }

        console.log('📸 Instagram post info request for:', url);

        const data = await callRapidAPI('/smvd/get/instagram/post', { url });

        res.json({
            success: true,
            platform: 'instagram',
            data: data
        });

    } catch (error) {
        console.error('Instagram Post Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 5. Facebook Post Details
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

        const data = await callRapidAPI('/smvd/get/facebook/post', { url });

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

// 6. Facebook Profile Details
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

        const data = await callRapidAPI('/smvd/get/facebook/profile', { username });

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

// 7. Facebook Profile ID
app.get('/api/facebook/profileid', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username parameter is required'
            });
        }

        console.log('🔍 Facebook Profile ID request for:', username);

        const data = await callRapidAPI('/smvd/get/facebook/profileid', { username });

        res.json({
            success: true,
            platform: 'facebook',
            profileId: data.id || data.profile_id,
            username: username
        });

    } catch (error) {
        console.error('Facebook Profile ID Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 8. Facebook Profile Reels
app.get('/api/facebook/reels', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username parameter is required'
            });
        }

        console.log('🎬 Facebook reels request for:', username);

        const data = await callRapidAPI('/smvd/get/facebook/reels', { username });

        res.json({
            success: true,
            platform: 'facebook',
            data: data
        });

    } catch (error) {
        console.error('Facebook Reels Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 9. Facebook Profile Photos
app.get('/api/facebook/photos', async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username parameter is required'
            });
        }

        console.log('📷 Facebook photos request for:', username);

        const data = await callRapidAPI('/smvd/get/facebook/photos', { username });

        res.json({
            success: true,
            platform: 'facebook',
            data: data
        });

    } catch (error) {
        console.error('Facebook Photos Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 10. TikTok User Details
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

        const data = await callRapidAPI('/smvd/get/tiktok/user', { username });

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

// 11. TikTok Post Details
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

        const data = await callRapidAPI('/smvd/get/tiktok/post', { url });

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

// Start server
app.listen(PORT, () => {
    console.log('✅ Server running on port', PORT);
    console.log('🔑 RapidAPI:', RAPIDAPI_KEY ? 'Configured ✅' : 'Not configured ❌');
    console.log('📱 Features: 11 endpoints ready');
});
