const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Video Downloader API - Reliable & Free',
    version: '8.0.0',
    status: 'Working',
    reliability: 'High - Uses multiple fallback methods',
    supported: ['Instagram', 'Facebook', 'TikTok', 'Twitter']
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
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      videoData = await downloadTwitter(url);
    } else {
      return res.status(400).json({ 
        error: 'Unsupported platform',
        supported: ['Instagram', 'Facebook', 'TikTok', 'Twitter']
      });
    }
    
    res.json(videoData);

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to download video',
      details: error.message,
      tip: 'Make sure the video is public and try again'
    });
  }
});

// Instagram Downloader with fallback methods
async function downloadInstagram(url) {
  // Method 1: InstaVideoSave API (Most reliable)
  try {
    const response = await axios.get('https://v3.instavideosave.net/', {
      params: { url: url },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    console.log('InstaVideoSave response:', response.data);

    if (response.data && response.data.url && response.data.url[0]) {
      return {
        videoUrl: response.data.url[0].url,
        title: `instagram_${Date.now()}.mp4`,
        thumbnail: response.data.thumb || 'https://picsum.photos/400/400',
        platform: 'instagram',
        fileSize: 0,
        duration: 0
      };
    }

    throw new Error('Method 1 failed');
  } catch (error) {
    console.log('Method 1 failed, trying Method 2...');
  }

  // Method 2: DownloadGram API
  try {
    const response = await axios.post('https://downloadgram.org/reel-downloader.php', 
      `url=${encodeURIComponent(url)}&submit=`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 15000
      }
    );

    const html = response.data;
    const match = html.match(/href="([^"]+)"[^>]*>\s*Download\s+Video/i);
    
    if (match && match[1]) {
      return {
        videoUrl: match[1],
        title: `instagram_${Date.now()}.mp4`,
        thumbnail: 'https://picsum.photos/400/400',
        platform: 'instagram',
        fileSize: 0,
        duration: 0
      };
    }

    throw new Error('Method 2 failed');
  } catch (error) {
    console.log('Method 2 failed, trying Method 3...');
  }

  // Method 3: SnapInsta API
  try {
    const response = await axios.post('https://snapinsta.app/api/ajaxSearch',
      new URLSearchParams({
        q: url,
        t: 'media',
        lang: 'en'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 15000
      }
    );

    if (response.data && response.data.data) {
      const html = response.data.data;
      const match = html.match(/href="([^"]+)"[^>]*download/i);
      
      if (match && match[1]) {
        return {
          videoUrl: match[1],
          title: `instagram_${Date.now()}.mp4`,
          thumbnail: 'https://picsum.photos/400/400',
          platform: 'instagram',
          fileSize: 0,
          duration: 0
        };
      }
    }
  } catch (error) {
    console.log('All methods failed');
  }

  throw new Error('Could not download Instagram video. It may be private or deleted.');
}

// Facebook Downloader
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

// Twitter Downloader
async function downloadTwitter(url) {
  try {
    const response = await axios.post('https://twitsave.com/info',
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
    const match = html.match(/href="([^"]+)"[^>]*>Download/i);
    
    if (match && match[1]) {
      return {
        videoUrl: match[1],
        title: `twitter_${Date.now()}.mp4`,
        thumbnail: 'https://picsum.photos/400/400',
        platform: 'twitter',
        fileSize: 0,
        duration: 0
      };
    }
    
    throw new Error('Could not extract Twitter video');
  } catch (error) {
    throw new Error('Failed to download Twitter video');
  }
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🎯 Multi-platform video downloader with fallback methods`);
  console.log(`📊 Reliability: HIGH - Using proven free APIs`);
});

module.exports = app;
