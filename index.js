const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Video Downloader API - Instagram Scraper',
    version: '4.0.0',
    status: 'Working',
    supported: ['Instagram', 'Facebook', 'TikTok']
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
    } else {
      return res.status(400).json({ 
        error: 'Unsupported platform',
        supported: ['Instagram', 'Facebook']
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

// Instagram Downloader using SaveFrom.net API
async function downloadInstagram(url) {
  try {
    // Method 1: Using SaveFrom.net API
    const response = await axios.post('https://v3.saveFrom.net/api/ajaxSearch', 
      new URLSearchParams({
        q: url,
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
      // Parse HTML response to find video URL
      const html = response.data.data;
      const videoMatch = html.match(/href="([^"]+)"[^>]*>Download<\/a>/i);
      
      if (videoMatch && videoMatch[1]) {
        return {
          videoUrl: videoMatch[1],
          title: `instagram_${Date.now()}.mp4`,
          thumbnail: 'https://picsum.photos/400/400',
          platform: 'instagram',
          fileSize: 0,
          duration: 0
        };
      }
    }
    
    // Method 2: Fallback to direct extraction
    return await downloadInstagramDirect(url);
    
  } catch (error) {
    console.error('Instagram download failed:', error.message);
    throw new Error('Could not download Instagram video. It may be private or deleted.');
  }
}

// Direct Instagram extraction (backup method)
async function downloadInstagramDirect(url) {
  try {
    // Get Instagram page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Try to find video URL in page source
    const videoMatch = html.match(/"video_url":"([^"]+)"/);
    
    if (videoMatch && videoMatch[1]) {
      const videoUrl = videoMatch[1].replace(/\\u0026/g, '&');
      
      return {
        videoUrl: videoUrl,
        title: `instagram_${Date.now()}.mp4`,
        thumbnail: 'https://picsum.photos/400/400',
        platform: 'instagram',
        fileSize: 0,
        duration: 0
      };
    }
    
    throw new Error('Video URL not found in page');
    
  } catch (error) {
    throw new Error('Failed to extract video from Instagram');
  }
}

// Facebook Downloader
async function downloadFacebook(url) {
  try {
    const response = await axios.post('https://www.getfvid.com/downloader', 
      new URLSearchParams({
        url: url
      }), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 15000
      }
    );

    if (response.data) {
      // Parse response to find video URL
      const html = response.data;
      const hdMatch = html.match(/href="([^"]+)"[^>]*>Download HD Video/i);
      const sdMatch = html.match(/href="([^"]+)"[^>]*>Download SD Video/i);
      
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
    }
    
    throw new Error('Could not extract Facebook video');
    
  } catch (error) {
    console.error('Facebook download failed:', error.message);
    throw new Error('Could not download Facebook video');
  }
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🎥 Instagram & Facebook video downloader ready`);
});

module.exports = app;
