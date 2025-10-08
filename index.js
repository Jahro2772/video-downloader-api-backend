const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Video Downloader API is running!',
    version: '1.0.0'
  });
});

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    let result = null;
    
    if (url.includes('instagram.com')) {
      result = downloadInstagram(url);
    } else if (url.includes('facebook.com')) {
      result = downloadFacebook(url);
    } else if (url.includes('pinterest.com')) {
      result = downloadPinterest(url);
    } else {
      return res.status(400).json({ error: 'Unsupported platform' });
    }
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function downloadInstagram(url) {
  return {
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'instagram_' + Date.now() + '.mp4',
    thumbnail: 'https://picsum.photos/200/300',
    platform: 'instagram',
    fileSize: 5510872,
    duration: 154
  };
}

function downloadFacebook(url) {
  return {
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    title: 'facebook_' + Date.now() + '.mp4',
    thumbnail: 'https://picsum.photos/200/300',
    platform: 'facebook',
    fileSize: 8710872,
    duration: 45
  };
}

function downloadPinterest(url) {
  return {
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'pinterest_' + Date.now() + '.mp4',
    thumbnail: 'https://picsum.photos/200/300',
    platform: 'pinterest',
    fileSize: 3500000,
    duration: 15
  };
}

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
