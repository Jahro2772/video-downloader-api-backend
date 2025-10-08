const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Blocked platforms
const BLOCKED_PLATFORMS = ['youtube.com', 'youtu.be', 'youtube'];

app.get('/', (req, res) => {
  res.json({
    message: 'Video Downloader API with yt-dlp',
    version: '3.0.0',
    status: 'Working',
    supported: ['Instagram', 'Facebook', 'Pinterest', 'LinkedIn', 'Twitter'],
    blocked: ['YouTube']
  });
});

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Block YouTube
  const isYouTube = BLOCKED_PLATFORMS.some(platform => 
    url.toLowerCase().includes(platform)
  );
  
  if (isYouTube) {
    return res.status(403).json({ 
      error: 'YouTube downloads are not supported',
      message: 'This service only supports Instagram, Facebook, Pinterest, and LinkedIn'
    });
  }

  // Validate supported platforms
  const supportedPlatforms = [
    'instagram.com',
    'facebook.com', 
    'fb.com',
    'fb.watch',
    'pinterest.com',
    'linkedin.com',
    'twitter.com',
    'x.com'
  ];

  const isSupported = supportedPlatforms.some(platform => 
    url.toLowerCase().includes(platform)
  );

  if (!isSupported) {
    return res.status(400).json({ 
      error: 'Unsupported platform',
      supported: supportedPlatforms
    });
  }

  try {
    console.log(`📥 Downloading: ${url}`);
    
    // Get video info using yt-dlp
    const videoInfo = await getVideoInfo(url);
    
    res.json({
      videoUrl: videoInfo.url,
      title: videoInfo.title || `video_${Date.now()}.mp4`,
      thumbnail: videoInfo.thumbnail || 'https://picsum.photos/400/400',
      platform: getPlatformName(url),
      fileSize: videoInfo.filesize || 0,
      duration: videoInfo.duration || 0
    });

  } catch (error) {
    console.error('❌ Download error:', error.message);
    res.status(500).json({ 
      error: 'Failed to download video',
      details: error.message,
      tip: 'Try again or check if the video is public'
    });
  }
});

// Get video info using yt-dlp
async function getVideoInfo(url) {
  try {
    // yt-dlp command to get video info in JSON format
    const command = `yt-dlp --dump-json --no-warnings "${url}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 seconds timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    const info = JSON.parse(stdout);
    
    // Get the best video URL
    let videoUrl = info.url;
    
    // For Instagram, prefer formats without audio issues
    if (url.includes('instagram.com')) {
      const formats = info.formats || [];
      const bestFormat = formats.find(f => 
        f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4'
      ) || formats.find(f => f.ext === 'mp4') || formats[0];
      
      if (bestFormat) {
        videoUrl = bestFormat.url;
      }
    }

    return {
      url: videoUrl,
      title: info.title,
      thumbnail: info.thumbnail,
      filesize: info.filesize || info.filesize_approx,
      duration: info.duration
    };

  } catch (error) {
    console.error('yt-dlp error:', error);
    throw new Error('Could not extract video. Video might be private or unavailable.');
  }
}

// Get platform name from URL
function getPlatformName(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('instagram.com')) return 'instagram';
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.')) return 'facebook';
  if (urlLower.includes('pinterest.com')) return 'pinterest';
  if (urlLower.includes('linkedin.com')) return 'linkedin';
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
  return 'unknown';
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🚀 Using yt-dlp for video downloads`);
  console.log(`🚫 YouTube downloads are blocked`);
});

module.exports = app;
