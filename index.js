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
        version: '5.0.0',
        features: [
            'Instagram Media Download',
            'Instagram User Profile',
            'Instagram User ID',
            'Facebook Post Details',
            'Facebook Profile',
            'TikTok Post',
            'TikTok User'
        ]
    });
});

// 1. Instagram Media Download
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
            shortcode: shortcode
        });

        // Check for error
        if (data.error) {
            return res.status(400).json({
                success: false,
                error: data.error.message || 'Failed to fetch video'
            });
        }

        // Extract video from contents array
        if (!data.contents || data.contents.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No content found'
            });
        }

        const content = data.contents[0];
        let videoUrl = null;
        let thumbnail = null;

        // MAIN FIX: Check for videos array first
        if (content.videos && content.videos.length > 0) {
            // Get highest quality video (usually first one - 750p)
            videoUrl = content.videos[0].url;
        }

        // Fallback to renderable videos
        if (!videoUrl && content.renderableVideos && content.renderableVideos.length > 0) {
            const video = content.renderableVideos[0];
            videoUrl = video.url || null;
        }

        // Get thumbnail
        if (data.metadata && data.metadata.thumbnailUrl) {
            thumbnail = data.metadata.thumbnailUrl;
        } else if (content.thumbnail) {
            thumbnail = content.thumbnail;
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
            title: data.metadata?.title || 'Instagram Video',
            author: data.metadata?.author?.username || 'Unknown',
            duration: Math.floor(data.metadata?.additionalData?.video_duration || 0),
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

        const data = await callRapidAPI('/instagram/v3/user/profile/details', {
            username: username
        });

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

// 3. Instagram User ID
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

        const data = await callRapidAPI('/instagram/v3/user/profile/id-from-username', {
            username: username
        });

        res.json({
            success: true,
            platform: 'instagram',
            data: data
        });

    } catch (error) {
        console.error('Instagram UserID Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 4. Facebook Post Details
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

        const data = await callRapidAPI('/facebook/v3/post/details', {
            url: url
        });

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

// 5. Facebook Profile
app.get('/api/facebook/profile', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL parameter is required'
            });
        }

        console.log('👤 Facebook profile request for:', url);

        const data = await callRapidAPI('/facebook/v3/profile/details', {
            url: url
        });

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

// 6. TikTok Post
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

        const data = await callRapidAPI('/tiktok/v3/post/details', {
            url: url
        });

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

// 7. TikTok User
app.get('/api/tiktok/user', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL parameter is required'
            });
        }

        console.log('👤 TikTok user request for:', url);

        const data = await callRapidAPI('/tiktok/v3/user/details', {
            url: url
        });

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
    console.log('📱 Features: 7 endpoints ready');
});
