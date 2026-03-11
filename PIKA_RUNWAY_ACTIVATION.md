# Quick Start: Activating Future Providers

## Current State: LUMA Ready ✅

Your system is production-ready with LUMA Dream Machine. When you're ready to activate PIKA or RUNWAY APIs, follow these steps.

---

## Step 1: Test Manual Mode (Optional)

Before API integration, test the manual upload workflow:

```bash
# .env
ENABLE_PIKA=true
```

### Generate with PIKA
```javascript
const response = await generateVideo(
  'Your prompt',
  'youtube',
  1,
  'pika'
);
// Returns: { status: 'pending', mode: 'manual', ... }
```

### Complete the Upload
```javascript
const videoUrl = 'https://your-storage.com/video.mp4';
await completeManualUpload(videoId, videoUrl);
// Video status changes to 'generated'
```

---

## Step 2: Integrate PIKA API (When Ready)

### 2a. Get PIKA API Key
1. Visit https://pika.art
2. Create account and request API access
3. Get your API credentials

### 2b. Update Code

**File: `/backend/src/providers/pika.provider.js`**

Replace the current placeholder with real API integration:

```javascript
const BaseVideoProvider = require('./BaseVideoProvider');
const fetch = require('node-fetch');

class PikaProvider extends BaseVideoProvider {
  constructor() {
    const enabled = !!process.env.PIKA_API_KEY && 
                    process.env.PIKA_API_KEY !== 'your_pika_api_key_here';
    
    // Change mode to 'api' when API is ready
    super('pika', 'PIKA 1.0', 'api', enabled);
    
    this.description = 'Advanced video generation';
    this.features = ['text-to-video', 'video-editing'];
    this.status = enabled ? 'active' : 'coming-soon';
  }

  async generateVideo(payload) {
    const { promptText, format = 'youtube' } = payload;
    this.validatePayload(payload);

    const API_KEY = process.env.PIKA_API_KEY;
    const response = await fetch('https://api.pika.art/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: promptText,
        aspect_ratio: format === 'short' ? '9:16' : '16:9'
      })
    });

    const data = await response.json();
    return {
      id: data.id,
      status: 'processing',
      provider: 'pika',
      mode: 'api',  // Real API mode!
      format,
      promptText
    };
  }

  async checkStatus(generationId) {
    const response = await fetch(
      `https://api.pika.art/v1/generations/${generationId}`,
      { headers: { 'Authorization': `Bearer ${process.env.PIKA_API_KEY}` } }
    );
    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      videoUrl: data.video_url || null,
      provider: 'pika'
    };
  }
}

module.exports = new PikaProvider();
```

### 2c. Update .env
```env
ENABLE_PIKA=true
PIKA_API_KEY=pk_xxxx_your_real_key
PIKA_API_URL=https://api.pika.art/v1
```

### 2d. Restart Server
```bash
npm run dev  # or pm2 restart all
```

**That's it!** Your system now uses PIKA's real API.

---

## Step 3: No Frontend Changes Needed!

✅ Frontend automatically:
- Detects PIKA is enabled
- Shows it as "active" instead of "coming soon"
- Switches from manual mode UI to polling UI
- Displays real-time processing status
- Handles completion automatically

---

## Same Steps for RUNWAY

Repeat for RUNWAY when API available:

```javascript
// 1. Get API key from https://runwayml.com
// 2. Update /backend/src/providers/runway.provider.js
// 3. Update .env with RUNWAY_API_KEY
// 4. Restart server
// 5. Done!
```

---

## Switching Default Provider

If you want PIKA to be the default:

```env
DEFAULT_PROVIDER=pika
```

Now all requests without explicit provider use PIKA.

---

## Disabling a Provider

To temporarily disable LUMA:

```env
# .env
DEFAULT_PROVIDER=pika
ENABLE_PIKA=true
# Don't set LUMA_API_KEY, leave it as 'your_luma_api_key_here'
```

LUMA automatically becomes unavailable, all requests fallback to PIKA.

---

## Monitoring Integration

### Check Provider Status
```javascript
const providers = await getAvailableProviders();
const pika = providers.find(p => p.id === 'pika');

console.log({
  enabled: pika.enabled,     // true if API_KEY set
  mode: pika.mode,           // 'api' or 'manual'
  status: pika.status,       // 'active' or 'coming-soon'
  available: pika.available  // true if ready to use
});
```

### Debug Logs
When you generate video with PIKA API:

```
🎥 Provider Router - Using: PIKA
🎬 PIKA - Starting generation...
📝 Prompt: ...
✅ PIKA Generation Started - Job ID: pika_xyz123
```

---

## Troubleshooting

### "PIKA API not available"
- Check PIKA_API_KEY in .env
- Verify API key format (should start with `pk_`)
- Ensure ENABLE_PIKA=true
- Restart server

### "Mode mismatch error"
- Provider file still in manual mode?
- Check `mode` parameter in BaseVideoProvider constructor
- Should be 'api' not 'manual' for real APIs

### Videos stuck in "processing"
- Check provider API is responsive
- Verify API key still valid
- Check logs for HTTP errors
- Fallback: manually complete via upload endpoint

---

## Summary

| What | Before API | After API |
|------|-----------|-----------|
| Mode | `manual` | `api` |
| Job status | `pending` | `processing` |
| Completion | Manual upload | Automatic polling |
| Frontend change | No | No ✅ |
| Code change | No | Yes (provider file) |
| Restart needed | No | Yes |
| Users see | "Upload pending" | "Generating..." |

