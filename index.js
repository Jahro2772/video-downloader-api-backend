const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Cobalt API endpoint
const COBALT_API = 'https://api.cobalt.tools/api/json';

app.get('/', (req, res) => {
  res.json({
    message: 'Video Downloader API - Powered by Cobalt',
    version: '5.0.0',
    status: 'Working',
    supported: ['Instagram', 'Facebook', 'TikTok', 'Twitter', 'YouTube (shorts)', 'Pinterest'],
    powered_by: 'Cobalt.tools'
  });
});

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Block YouTube main videos
  if (url.includes('youtube.com/watch') && !url.includes('shorts')) {
    return res.status(403).json({ 
      error: 'YouTube videos are not supported',
      message: 'Only YouTube Shorts are allowed'
    });
  }

  try {
    console.log(`📥 Downloading: ${url}`);
    
    const videoData = await downloadWithCobalt(url);
    
    res.json({
      videoUrl: videoData.url,
      title: `video_${Date.now()}.mp4`,
      thumbnail: videoData.thumb || 'https://picsum.photos/400/400',
      platform: getPlatform(url),
      fileSize: 0,
      duration: 0
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to download video',
      details: error.message,
      tip: 'Make sure the video is public and the URL is correct'
    });
  }
});

// Download using Cobalt API
async function downloadWithCobalt(url) {
  try {
    const response = await axios.post(COBALT_API, {
      url: url,
      vCodec: 'h264',
      vQuality: '720',
      aFormat: 'mp3',
      isAudioOnly: false,
      isTTFullAudio: false,
      isAudioMuted: false,
      dubLang: false,
      disableMetadata: false
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('Cobalt response:', response.data);

    if (response.data.status === 'error' || response.data.status === 'rate-limit') {
      throw new Error(response.data.text || 'Cobalt API error');
    }

    if (response.data.status === 'redirect' || response.data.status === 'tunnel') {
      return {
        url: response.data.url,
        thumb: response.data.thumb
      };
    }

    if (response.data.status === 'picker') {
      // Multiple videos (carousel), return first one
      if (response.data.picker && response.data.picker.length > 0) {
        return {
          url: response.data.picker[0].url,
          thumb: response.data.picker[0].thumb
        };
      }
    }

    throw new Error('Could not extract video URL from response');

  } catch (error) {
    if (error.response) {
      throw new Error(`Cobalt API error: ${error.response.data?.text || error.response.statusText}`);
    }
    throw new Error(error.message);
  }
}

// Get platform name
function getPlatform(url) {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com') || url.includes('fb.')) return 'facebook';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('pinterest.com')) return 'pinterest';
  return 'unknown';
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🎥 Video downloader powered by Cobalt.tools`);
});

module.exports = app;
