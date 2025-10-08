// Instagram credentials - GEÇİCİ TEST (sonra düzelteceğiz)
const IG_USERNAME = 'youstartakademi';
const IG_PASSWORD = 'Budka4727..';
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { IgApiClient } = require('instagram-private-api');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS
app.use(cors());
app.use(express.json());

// Instagram credentials
const IG_USERNAME = process.env.IG_USERNAME || '';
const IG_PASSWORD = process.env.IG_PASSWORD || '';

let igClient = null;

// Instagram login
async function initInstagramClient() {
    if (!IG_USERNAME || !IG_PASSWORD) {
        console.log('⚠️  Instagram credentials not configured');
        return;
    }

    try {
        igClient = new IgApiClient();
        igClient.state.generateDevice(IG_USERNAME);
        await igClient.account.login(IG_USERNAME, IG_PASSWORD);
        console.log('✅ Instagram session başlatıldı');
    } catch (error) {
        console.error('❌ Instagram login failed:', error.message);
        igClient = null;
    }
}

// Server başlarken Instagram'a login
initInstagramClient();

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Video Downloader API is running',
        instagramConfigured: !!igClient,
        version: '3.0.0'
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
        else if (url.includes('pinterest.com')) platform = 'pinterest';
        else if (url.includes('linkedin.com')) platform = 'linkedin';

        // Instagram Private API
        if (platform === 'instagram' && igClient) {
            try {
                const mediaId = extractInstagramMediaId(url);
                if (!mediaId) {
                    throw new Error('Invalid Instagram URL');
                }

                const mediaInfo = await igClient.media.info(mediaId);
                const item = mediaInfo.items[0];

                let videoUrl = null;
                let thumbnail = null;

                if (item.video_versions) {
                    // Video/Reel
                    videoUrl = item.video_versions[0].url;
                    thumbnail = item.image_versions2?.candidates[0]?.url || null;
                } else if (item.carousel_media) {
                    // Carousel - ilk video'yu al
                    const firstVideo = item.carousel_media.find(m => m.video_versions);
                    if (firstVideo) {
                        videoUrl = firstVideo.video_versions[0].url;
                        thumbnail = firstVideo.image_versions2?.candidates[0]?.url || null;
                    }
                }

                if (!videoUrl) {
                    throw new Error('No video found in this post');
                }

                return res.json({
                    success: true,
                    platform: 'instagram',
                    videoUrl: videoUrl,
                    thumbnail: thumbnail,
                    duration: item.video_duration || 0,
                    fileSize: 0
                });

            } catch (error) {
                console.error('Instagram API error:', error.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch Instagram video: ' + error.message
                });
            }
        }

        // Facebook fallback
        if (platform === 'facebook') {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const html = response.data;
                const hdMatch = html.match(/"playable_url":"([^"]+)"/);
                const sdMatch = html.match(/"playable_url_quality_hd":"([^"]+)"/);

                const videoUrl = (hdMatch || sdMatch)?.[1]?.replace(/\\u0025/g, '%').replace(/\\/g, '');

                if (videoUrl) {
                    return res.json({
                        success: true,
                        platform: 'facebook',
                        videoUrl: videoUrl,
                        duration: 0,
                        fileSize: 0
                    });
                }
            } catch (error) {
                console.error('Facebook scraping error:', error.message);
            }
        }

        // Pinterest fallback
        if (platform === 'pinterest') {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
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
            } catch (error) {
                console.error('Pinterest scraping error:', error.message);
            }
        }

        // Platform not supported
        return res.status(400).json({
            success: false,
            error: 'Unsupported platform or unable to extract video'
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

// Helper function: Extract Instagram media ID
function extractInstagramMediaId(url) {
    const patterns = [
        /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/tv\/([A-Za-z0-9_-]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return igClient.media.getIdFromShortcode(match[1]);
        }
    }

    return null;
}

// Start server
app.listen(PORT, () => {
    console.log('✅ Server running on port', PORT);
    console.log('🔐 Instagram Private API', igClient ? '✅ Configured' : '❌ Not configured');
});

