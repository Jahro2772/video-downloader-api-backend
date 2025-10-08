const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { IgApiClient } = require('instagram-private-api');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Instagram credentials (Railway environment variables)
const IG_USERNAME = process.env.IG_USERNAME || '';
const IG_PASSWORD = process.env.IG_PASSWORD || '';

let ig = null;

// Initialize Instagram client
async function initInstagram() {
  if (!IG_USERNAME || !IG_PASSWORD) {
    console.log('⚠️  Instagram credentials not configured');
    return false;
  }

  try {
    ig = new IgApiClient();
    ig.state.generateDevice(IG_USERNAME);
    
    await ig.account.login(IG_USERNAME, IG_PASSWORD);
    console.log('✅ Instagram client logged in successfully');
    return true;
  } catch (error) {
    console.error('❌ Instagram login failed:', error.message);
    return false;
  }
}

app.get('/', (req, res) => {
  res.json({
    message: 'Video Downloader API - Instagram Private API',
    version: '9.0.0',
    status: ig ? 'Working' : 'Instagram Not Configured',
    supported: ['Instagram', 'Facebook', 'TikTok'],
    note: 'Using Instagram Private API for reliable downloads'
  });
});

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    console.log(`📥 Processing: ${url}`);
    
    let videoData;
    
    if (url.includes('instagram.com')) {
      videoData = await downloadInstagram(url);
    } else if (url.includes('facebook.com') || url.includes('fb.')) {
      videoData = await downloadFacebook(url);
    } else if (url.includes('tiktok.com')) {
      videoData = await downloadTikTok(url);
    } else {
      return res.status(400).json({ 
        error: 'Unsupported platform',
        supported: ['Instagram', 'Facebook', 'TikTok']
      });
    }
    
    res.json(videoData);

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to download video',
      details: error.message
    });
  }
});

// Instagram Downloader using Private API
async function downloadInstagram(url) {
  if (!ig) {
    throw new Error('Instagram client not initialized. Please configure IG_USERNAME and IG_PASSWORD');
  }

  try {
    // Extract media ID from URL
    const mediaId = await getMediaIdFromUrl(url);
    
    if (!mediaId) {
      throw new Error('Could not extract media ID from URL');
    }

    // Get media info
    const mediaInfo = await ig.media.info(mediaId);
    const item = mediaInfo.items[0];

    let videoUrl = null;
    let thumbnail = null;

    // Check if it's a video
    if (item.video_versions && item.video_versions.length > 0) {
      // Get highest quality video
      videoUrl = item.video_versions[0].url;
      thumbnail = item.image_versions2?.candidates?.[0]?.url;
    } else if (item.carousel_media) {
      // Handle carousel posts
      const videoItem = item.carousel_media.find(m => m.video_versions);
      if (videoItem) {
        videoUrl = videoItem.video_versions[0].url;
        thumbnail = videoItem.image_versions2?.candidates?.[0]?.url;
      }
    }

    if (!videoUrl) {
      throw new Error('No video found in this post');
    }

    return {
      videoUrl: videoUrl,
      title: `instagram_${Date.now()}.mp4`,
      thumbnail: thumbnail || 'https://picsum.photos/400/400',
      platform: 'instagram',
      fileSize: 0,
      duration: item.video_duration || 0
    };

  } catch (error) {
    console.error('Instagram Private API error:', error);
    throw new Error(`Failed to download Instagram video: ${error.message}`);
  }
}

// Extract media ID from Instagram URL
async function getMediaIdFromUrl(url) {
  try {
    // Method 1: Extract shortcode from URL
    const shortcodeMatch = url.match(/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
    if (shortcodeMatch && shortcodeMatch[1]) {
      const shortcode = shortcodeMatch[1];
      
      // Convert shortcode to media ID
      const mediaId = await ig.media.getIdFromShortcode(shortcode);
      return mediaId;
    }

    throw new Error('Invalid Instagram URL format');
  } catch (error) {
    console.error('Media ID extraction error:', error);
    return null;
  }
}

// Facebook Downloader (fallback to scraping)
async function downloadFacebook(url) {
  try {
    const response = await axios.post('https://www.getfvid.com/downloader',
      `url=${encodeURIComponent(url)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 15000
      }
    );

    const html = response.data;
    const hdMatch = html.match(/href="([^"]+)"[^>]*>Download\s+(?:in\s+)?(?:High|HD)/i);
    const sdMatch = html.match(/href="([^"]+)"[^>]*>Download/i);
    
    const videoUrl = hdMatch ? hdMatch[1] : (sdMatch ? sdMatch[1] : null);
    
    if (videoUrl) {
      return {
        videoUrl: videoUrl,
        title: `facebook_${Date.now()}.mp4`,
        thumbnail: 'https://picsum.photos/400/400',
        platform: 'facebook',
        fileSize: 0,
        duration: 0
      };
    }
    
    throw new Error('Could not extract Facebook video');
  } catch (error) {
    throw new Error('Failed to download Facebook video');
  }
}

// TikTok Downloader
async function downloadTikTok(url) {
  try {
    const response = await axios.post('https://www.tikwm.com/api/',
      { url: url },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 15000
      }
    );

    if (response.data && response.data.data && response.data.data.play) {
      return {
        videoUrl: response.data.data.play,
        title: `tiktok_${Date.now()}.mp4`,
        thumbnail: response.data.data.cover || 'https://picsum.photos/400/400',
        platform: 'tiktok',
        fileSize: 0,
        duration: response.data.data.duration || 0
      };
    }
    
    throw new Error('Could not extract TikTok video');
  } catch (error) {
    throw new Error('Failed to download TikTok video');
  }
}

// Initialize on startup
(async () => {
  await initInstagram();
  
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔐 Instagram Private API ${ig ? '✅ Ready' : '❌ Not configured'}`);
  });
})();

module.exports = app;
