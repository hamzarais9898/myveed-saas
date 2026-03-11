# Provider Configuration Guide

## Quick Reference

### ✅ LUMA (Production Ready)

**Setup:**
```env
LUMA_API_KEY=lm_xxxx_your_key
LUMA_API_URL=https://api.lumalabs.ai/dream-machine/v1
DEFAULT_PROVIDER=luma
```

**Test:**
```bash
curl -X POST http://localhost:5000/api/videos/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "promptText": "A beautiful sunset",
    "format": "youtube",
    "provider": "luma"
  }'
```

**Expected Response:**
```json
{
  "status": "processing",
  "provider": "luma",
  "mode": "api",
  "generationId": "lum_...",
  "status": "processing"
}
```

---

### ⏳ PIKA (Manual Mode)

**Setup:**
```env
ENABLE_PIKA=true
```

**Test:**
```bash
curl -X POST http://localhost:5000/api/videos/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "promptText": "A beautiful sunset",
    "format": "youtube",
    "provider": "pika"
  }'
```

**Expected Response:**
```json
{
  "status": "pending",
  "provider": "pika",
  "mode": "manual",
  "generationId": "pika_...",
  "message": "PIKA is in queue. Please upload the video manually."
}
```

**Complete Upload:**
```bash
curl -X POST http://localhost:5000/api/videos/admin/upload-complete/videoId \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"videoUrl": "https://storage.com/video.mp4"}'
```

---

### ⏳ RUNWAY (Manual Mode)

Same as PIKA:

**Setup:**
```env
ENABLE_RUNWAY=true
```

**Usage:** Same endpoints as PIKA above

---

## Environment Variables

### Required

```env
# Core
PORT=5000
NODE_ENV=development|production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
FRONTEND_URL=http://localhost:3000

# Provider Configuration
DEFAULT_PROVIDER=luma
```

### Optional (By Provider)

```env
# LUMA (Recommended)
LUMA_API_KEY=lm_...
LUMA_API_URL=https://api.lumalabs.ai/dream-machine/v1

# PIKA (When ready)
ENABLE_PIKA=true|false

# RUNWAY (When ready)
ENABLE_RUNWAY=true|false

# SORA (Future)
SORA_API_KEY=sk_...
SORA_API_URL=https://api.openai.com/v1

# VEO (Future)
VEO_API_KEY=...
VEO_API_URL=https://generativelanguage.googleapis.com/v1beta
```

---

## Testing Flow

### 1. Verify All Providers Available

```bash
curl http://localhost:5000/api/videos/providers/available \
  -H "Authorization: Bearer $TOKEN" | jq
```

Output:
```json
{
  "providers": [
    {
      "id": "luma",
      "name": "LUMA Dream Machine",
      "status": "active",
      "mode": "api",
      "enabled": true,
      "available": true
    },
    {
      "id": "pika",
      "name": "PIKA 1.0",
      "status": "coming-soon",
      "mode": "manual",
      "enabled": false,
      "available": true
    }
  ]
}
```

### 2. Test API Mode (LUMA)

```bash
# Generate video
VIDEO_ID=$(curl -X POST http://localhost:5000/api/videos/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"promptText":"test","format":"youtube","provider":"luma"}' \
  | jq -r '.videos[0].id')

# Check status
curl http://localhost:5000/api/videos/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.status'
```

### 3. Test Manual Mode (PIKA)

```bash
# Generate (returns pending)
VIDEO_ID=$(curl -X POST http://localhost:5000/api/videos/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"promptText":"test","format":"youtube","provider":"pika"}' \
  | jq -r '.videos[0].id')

# Verify status is pending
curl http://localhost:5000/api/videos/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.status'
# Should return: "pending"

# Upload video
curl -X POST http://localhost:5000/api/videos/admin/upload-complete/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"videoUrl":"https://example.com/video.mp4"}'

# Verify status changed to generated
curl http://localhost:5000/api/videos/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.status'
# Should return: "generated"
```

### 4. Test Fallback Logic

```bash
# Request non-existent provider (falls back to DEFAULT)
curl -X POST http://localhost:5000/api/videos/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"promptText":"test","format":"youtube","provider":"nonexistent"}'

# Will fallback to luma (DEFAULT_PROVIDER)
```

---

## Troubleshooting

### Provider Not Available

**Problem**: "Provider X is not available"

**Solution**:
```bash
# Check .env variables
grep -E "ENABLE_|_API_KEY|DEFAULT_PROVIDER" backend/.env

# Verify API key format
echo $LUMA_API_KEY  # Should start with 'lm_'

# Restart server
npm run dev
```

### Video Stuck in "pending"

**Problem**: Manual mode video doesn't complete

**Solution**:
```bash
# Check video status
curl http://localhost:5000/api/videos/videoId \
  -H "Authorization: Bearer $TOKEN" | jq

# If mode is "manual", complete it:
curl -X POST http://localhost:5000/api/videos/admin/upload-complete/videoId \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"videoUrl":"https://storage/video.mp4"}'
```

### Wrong Provider Selected

**Problem**: Requested LUMA but got PIKA

**Solution**:
```bash
# Check DEFAULT_PROVIDER
cat backend/.env | grep DEFAULT_PROVIDER

# Verify provider in response
curl http://localhost:5000/api/videos/generate ... | jq '.provider'

# If fallback occurred, check if requested provider was enabled
curl http://localhost:5000/api/videos/providers/available \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.id=="luma")'
```

### API Key Not Recognized

**Problem**: "LUMA API Error: Invalid API key"

**Solution**:
1. Get new API key from https://luna.ai
2. Update .env: `LUMA_API_KEY=lm_xxxx`
3. Restart server
4. Test: `npm run dev`

---

## Performance Tuning

### Optimize for Speed

```env
# Use fastest provider
DEFAULT_PROVIDER=luma  # LUMA is typically fastest

# Parallel generation
# (Users can generate with all 3 providers simultaneously)
```

### Optimize for Cost

```env
# Compare providers
# Use whichever is cheapest for your volume
DEFAULT_PROVIDER=pika  # if PIKA API is cheaper

# Monitor metrics
curl http://localhost:5000/api/admin/providers/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Optimize for Availability

```env
# Fallback order: LUMA → PIKA → Default
DEFAULT_PROVIDER=luma  # Primary
ENABLE_PIKA=true       # Secondary fallback
```

---

## Production Deployment

### 1. Set Environment Variables

```bash
# Production .env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@prod-cluster...
JWT_SECRET=very_long_random_string_min_32_chars
FRONTEND_URL=https://yourdomain.com

# Provider config
DEFAULT_PROVIDER=luma
LUMA_API_KEY=lm_prod_key_here
ENABLE_PIKA=false      # Only enable when ready
ENABLE_RUNWAY=false    # Only enable when ready
```

### 2. Verify Configuration

```bash
# Check all required vars are set
node -e "
const vars = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'LUMA_API_KEY'];
vars.forEach(v => {
  console.log(v + ': ' + (process.env[v] ? '✓' : '✗'));
});
"
```

### 3. Test Endpoints

```bash
# Health check
curl https://yourdomain.com/api/health

# Provider availability
curl https://yourdomain.com/api/videos/providers/available \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Test generation
curl -X POST https://yourdomain.com/api/videos/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"promptText":"test","format":"youtube"}'
```

### 4. Monitor

```bash
# Watch logs
tail -f /var/log/app.log | grep -E "generation|provider|error"

# Monitor provider metrics
curl https://yourdomain.com/api/admin/providers/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Advanced: Custom Provider

To add your own provider:

### 1. Create Provider File

```javascript
// backend/src/providers/custom.provider.js
const BaseVideoProvider = require('./BaseVideoProvider');

class CustomProvider extends BaseVideoProvider {
  constructor() {
    super('custom', 'My Provider', 'api', true);
    this.description = 'Custom video generation';
    this.features = ['text-to-video'];
  }

  async generateVideo(payload) {
    const { promptText, format } = payload;
    
    // Your API call here
    const response = await fetch('https://api.custom.com/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: promptText })
    });
    
    const data = await response.json();
    return {
      id: data.id,
      status: 'processing',
      provider: 'custom',
      mode: 'api'
    };
  }

  async checkStatus(generationId) {
    // Your status check
  }
}

module.exports = new CustomProvider();
```

### 2. Register Provider

```javascript
// backend/src/providers/index.js
const customProvider = require('./custom.provider');

const AVAILABLE_PROVIDERS = {
  // ... existing
  custom: customProvider
};
```

### 3. Enable in .env

```env
ENABLE_CUSTOM=true
CUSTOM_API_KEY=your_api_key
```

### 4. Use It

```bash
curl -X POST http://localhost:5000/api/videos/generate \
  -d '{"promptText":"test","provider":"custom"}'
```

---

## Support

- Documentation: See `VIDEO_PROVIDERS_ARCHITECTURE.md`
- Activation guide: See `PIKA_RUNWAY_ACTIVATION.md`
- Patterns & examples: See `ADVANCED_PROVIDER_PATTERNS.md`
- Provider code: Check JSDoc in provider files

