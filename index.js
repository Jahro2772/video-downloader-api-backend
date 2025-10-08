const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Free Video Downloader API',
        supportedPlatforms: ['Instagram', 'Facebook', 'TikTok'],
        version: '6.0.0'
    });
});

// Download endpoint
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

        // Platform detection
        let platform = 'unknown';
        if (url.includes('instagram.com')) platform = 'instagram';
        else if (url.includes('facebook.com') || url.includes('fb.com')) platform = 'facebook';
        else if (url.includes('tiktok.com')) platform = 'tiktok';

        // TikWM API - Instagram & TikTok
        if (platform === 'instagram' || platform === 'tiktok') {
            try {
                const response = await axios.post('https://www.tikwm.com/api/', {
                    url: url,
                    hd: 1
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0'
                    },
                    timeout: 30000
                });

                const data = response.data;

                if (data.code === 0 && data.data) {
                    const videoData = data.data;

                    return res.json({
                        success: true,
                        platform: platform,
                        videoUrl: videoData.hdplay || videoData.play || videoData.wmplay,
                        thumbnail: videoData.cover || videoData.origin_cover,
                        title: videoData.title || videoData.desc || 'video',
                        duration: videoData.duration || 0,
                        fileSize: videoData.size || 0,
                        author: videoData.author?.nickname || 'Unknown'
                    });
                }

                throw new Error('Video not found or invalid URL');

            } catch (error) {
                console.error('TikWM API Error:', error.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to download: ' + error.message
                });
            }
        }

        // Facebook - Scraping Method
        if (platform === 'facebook') {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 15000
                });

                const html = response.data;
                
                // Try multiple patterns
                const patterns = [
                    /"playable_url":"([^"]+)"/,
                    /"browser_native_hd_url":"([^"]+)"/,
                    /"browser_native_sd_url":"([^"]+)"/
                ];

                let videoUrl = null;
                for (const pattern of patterns) {
                    const match = html.match(pattern);
                    if (match) {
                        videoUrl = match[1].replace(/\\u0025/g, '%').replace(/\\/g, '');
                        break;
                    }
                }

                if (videoUrl) {
                    return res.json({
                        success: true,
                        platform: 'facebook',
                        videoUrl: videoUrl,
                        thumbnail: null,
                        duration: 0,
                        fileSize: 0
                    });
                }

                throw new Error('Video not found');

            } catch (error) {
                console.error('Facebook scraping error:', error.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to download Facebook video'
                });
            }
        }

        // Pinterest
        if (platform === 'pinterest') {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 15000
                });

                const html = response.data;
                const videoMatch = html.match(/"video_list":\{[^}]*"V_720P":\{"url":"([^"]+)"/);

                if (videoMatch) {
                    return res.json({
                        success: true,
                        platform: 'pinterest',
                        videoUrl: videoMatch[1],
                        duration: 0,
                        fileSize: 0
                    });
                }

                throw new Error('Video not found');

            } catch (error) {
                console.error('Pinterest error:', error.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to download Pinterest video'
                });
            }
        }

        // Unsupported platform
        return res.status(400).json({
            success: false,
            error: 'Platform not supported'
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('✅ Server running on port', PORT);
    console.log('🆓 Free API - No authentication needed!');
    console.log('📱 Supported: Instagram, Facebook, TikTok, Pinterest');
});
