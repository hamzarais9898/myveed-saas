# Video Providers Architecture - Extensible Multi-Provider System

## Overview

This document explains the comprehensive video generation provider architecture that supports multiple providers with different integration modes (API-based and manual upload), enabling a flexible, extensible system that can adapt to future provider changes without requiring frontend modifications.

## Architecture Principles

### 1. **Abstraction Layer** (BaseVideoProvider)

All providers inherit from `BaseVideoProvider`, which defines the contract that each provider must implement:

```javascript
class BaseVideoProvider {
  async generateVideo(payload)        // Initiate video generation
  async checkStatus(generationId)     // Check generation progress
  async completeVideo(id, videoUrl)   // Complete manual uploads
  isAvailable()                       // Check if provider is enabled
  getInfo()                           // Return provider metadata
}
```

**Benefits:**
- Consistent interface across all providers
- Easy to add new providers (just extend the class)
- Provider-specific logic isolated in each implementation
- Backend agnostic - can swap providers without touching frontend

### 2. **Provider Router** (index.js)

The provider router intelligently routes requests to the correct provider:

```javascript
// Single entry point for video generation
await providerRouter.generateVideo({
  promptText: "...",
  format: "youtube",
  provider: "auto" // or "luma", "pika", etc.
})

// Automatic fallback if provider disabled
// If ENABLE_PIKA=false but user requests pika → falls back to DEFAULT_PROVIDER
```

**Smart Features:**
- **Auto-routing**: Resolve provider based on configuration
- **Fallback logic**: If disabled, automatically use DEFAULT_PROVIDER
- **Feature flags**: ENABLE_PIKA, ENABLE_RUNWAY control availability
- **Unified interface**: Same method calls regardless of provider

### 3. **Dual-Mode Support**

Providers operate in two modes:

#### Mode: "api" (Asynchronous Generation)
- Provider handles video generation asynchronously
- Returns job ID for polling
- Example: LUMA Dream Machine

```
User → Request → Provider API → Job ID (immediate)
                               ↓
                        Processing (async)
                               ↓
                        Video URL (polling)
```

#### Mode: "manual" (User Upload)
- Provider returns pending job
- User/admin uploads video later via endpoint
- Example: PIKA, RUNWAY (until API available)

```
User → Request → Pending Job
                      ↓
            (admin portal)
                      ↓
          POST /videos/admin/upload-complete
                      ↓
                 Mark as Complete
```

## Current Provider Configuration

### LUMA Dream Machine ✅ (Active)
- **Mode**: `api` (asynchronous)
- **Status**: Production-ready
- **Environment**: `LUMA_API_KEY`, `LUMA_API_URL`
- **When**: Immediately available if API key configured
- **Features**: text-to-video, image-to-video, aspect ratio control

### PIKA 1.0 ⏳ (Placeholder)
- **Mode**: `manual` (upload)
- **Status**: Coming Soon
- **Enable**: `ENABLE_PIKA=true` in .env
- **When**: Ready to integrate when API available
- **Features**: text-to-video, video editing, motion control
- **Current**: Returns pending job, accepts manual upload

### RUNWAY Gen-2 ⏳ (Placeholder)
- **Mode**: `manual` (upload)
- **Status**: Coming Soon
- **Enable**: `ENABLE_RUNWAY=true` in .env
- **When**: Ready to integrate when API available
- **Features**: text-to-video, image-to-video, video extension
- **Current**: Returns pending job, accepts manual upload

### SORA (OpenAI) 🔜 (Future)
- **Mode**: `api` (asynchronous)
- **Status**: Coming Soon
- **Environment**: `SORA_API_KEY`, `SORA_API_URL`
- **Placeholder**: Throws "not available yet" error

### VEO (Google) 🔜 (Future)
- **Mode**: `api` (asynchronous)
- **Status**: Coming Soon
- **Environment**: `VEO_API_KEY`, `VEO_API_URL`
- **Placeholder**: Throws "not available yet" error

## Database Schema

### Video Model Fields

```javascript
{
  provider: 'luma' | 'pika' | 'runway' | 'sora' | 'veo',
  mode: 'api' | 'manual',
  generationId: String,        // Job ID from provider
  videoUrl: String,             // Final video URL
  status: 'pending' | 'processing' | 'generated' | 'scheduled' | 'published' | 'failed'
}
```

**Status Flow by Mode:**

**API Mode:**
```
Request → (provider processing) → 'processing' → 'generated'
```

**Manual Mode:**
```
Request → 'pending' → (admin uploads) → 'generated'
```

## API Endpoints

### 1. Generate Video
```
POST /api/videos/generate
Body: {
  promptText: string,
  format: 'youtube' | 'short' | 'both',
  provider: 'auto' | 'luma' | 'pika' | 'runway',
  variants: number (1-20)
}

Response: {
  provider: 'luma',
  mode: 'api',
  status: 'processing',
  generationId: 'xyz123'
}
```

### 2. Get Available Providers
```
GET /api/videos/providers/available

Response: {
  providers: [
    {
      id: 'luma',
      name: 'LUMA Dream Machine',
      mode: 'api',
      enabled: true,
      status: 'active',
      features: ['text-to-video', ...],
      available: true
    },
    {
      id: 'pika',
      name: 'PIKA 1.0',
      mode: 'manual',
      enabled: false,
      status: 'coming-soon',
      waitlist: true,
      available: true  // Always true in manual mode
    }
  ]
}
```

### 3. Complete Manual Upload
```
POST /api/videos/admin/upload-complete/:id
Body: { videoUrl: 'https://...' }

Response: {
  id: 'videoId',
  status: 'generated',
  videoUrl: 'https://...',
  provider: 'pika',
  mode: 'manual'
}
```

## Frontend Integration

### Provider Selector UI

```typescript
const { providers } = await getAvailableProviders();

// Display all providers
providers.forEach(provider => {
  if (provider.mode === 'api') {
    // Show with real-time status indicator
    <ProviderButton status={provider.status} />
  } else if (provider.mode === 'manual') {
    // Show with upload button
    <ProviderButton mode="manual" />
  }
})
```

### Status Display

**API Mode:**
- "⏳ Generating..." (status: processing)
- "✅ Ready to publish" (status: generated)

**Manual Mode:**
- "📝 Pending Upload" (status: pending)
- "⬆️ Upload required" (link to upload)
- "✅ Ready to publish" (status: generated after upload)

### Video Upload Component

```typescript
const handleManualUpload = async (videoId, videoFile) => {
  // 1. Upload to storage (Cloudinary/S3)
  const videoUrl = await uploadToStorage(videoFile);
  
  // 2. Complete the video via API
  await completeManualUpload(videoId, videoUrl);
  
  // 3. Video now in 'generated' status
}
```

## Activation Flow: Adding a New Provider

### Scenario: Activating PIKA API Integration

**Phase 1: Foundation (Already done)** ✅
```javascript
// 1. BaseVideoProvider abstract class exists
// 2. PikaProvider extends BaseVideoProvider
// 3. ENABLE_PIKA flag in .env
// 4. Manual mode works with uploads
```

**Phase 2: API Integration (When API available)**
```javascript
// 1. Update PIKA_API_KEY in .env
class PikaProvider extends BaseVideoProvider {
  constructor() {
    super('pika', 'PIKA 1.0', 'api', true); // Change to 'api' mode
  }

  async generateVideo(payload) {
    // Call real PIKA API
    const response = await fetch(PIKA_API_URL, {
      headers: { Authorization: Bearer ${PIKA_API_KEY} }
    });
    // ... return real job ID
  }

  async checkStatus(generationId) {
    // Poll real PIKA API
  }
}

// 2. NO frontend changes needed! System automatically detects API mode
```

**Phase 3: Rollout**
```bash
# .env update
ENABLE_PIKA=true
PIKA_API_KEY=pk_xxx_real_key

# Restart server
# Frontend automatically shows PIKA as available
# Users can select PIKA from provider dropdown
# Jobs now process via real API instead of manual mode
```

**Zero frontend changes required!**

## Implementation Details

### Provider Router Logic

```javascript
// generateVideo() smart resolution
const selectedProvider = provider === 'auto'
  ? (process.env.DEFAULT_PROVIDER || 'luma')
  : provider;

// Check if enabled, fallback if not
if (!providerInstance.enabled && selectedProvider !== 'auto') {
  return await exports.generateVideo({
    ...payload,
    provider: process.env.DEFAULT_PROVIDER
  });
}

// Call provider
return providerInstance.generateVideo(payload);
```

### Feature Flags

```javascript
// .env controls everything
DEFAULT_PROVIDER=luma
ENABLE_PIKA=false       // Disable PIKA
ENABLE_RUNWAY=false     // Disable RUNWAY

// Dynamic provider availability
// No code changes needed to enable/disable
```

### Video Model Status Management

```javascript
// Automatic status based on mode
if (mode === 'api') {
  status = 'processing'      // Waiting for provider API
} else if (mode === 'manual') {
  status = 'pending'         // Waiting for manual upload
}

// Polling logic
const statusInfo = await providerRouter.checkStatus(generationId, provider);
if (statusInfo.status === 'completed') {
  video.videoUrl = statusInfo.videoUrl;
  video.status = 'generated';
}
```

## Security Considerations

1. **API Keys**: Store all provider API keys in .env, never in code
2. **Manual Upload**: Only users who created the video can upload
3. **Feature Flags**: Disable providers that aren't ready
4. **Error Handling**: Provider errors don't crash system, fallback to DEFAULT_PROVIDER
5. **Validation**: All payloads validated before reaching provider

## Monitoring & Debugging

### Provider Status
```javascript
// Check any provider's health
const available = providerRouter.isProviderAvailable('luma');
```

### Job Tracking
```javascript
// Track generation from request to completion
const video = await Video.findById(videoId);
console.log({
  provider: video.provider,
  mode: video.mode,
  status: video.status,
  generationId: video.generationId,
  videoUrl: video.videoUrl
});
```

### Logs by Provider
```
🎬 LUMA Dream Machine - Starting generation...
📝 Prompt: ...
✅ LUMA Generation Started - Job ID: xyz123

🎬 PIKA - Job queued (manual mode)
📝 Prompt: ...
ℹ️ PIKA API not yet integrated. Video will be uploaded manually.
```

## Production Checklist

- [ ] LUMA_API_KEY configured in production .env
- [ ] DEFAULT_PROVIDER set to 'luma' or preferred provider
- [ ] ENABLE_PIKA and ENABLE_RUNWAY set to false (unless APIs ready)
- [ ] /api/videos/admin/upload-complete endpoint protected
- [ ] Provider router error handling tested
- [ ] Fallback logic verified (disable provider → uses default)
- [ ] Manual upload workflow tested (PIKA/RUNWAY)
- [ ] Frontend displays all provider statuses correctly
- [ ] Database migration: add `mode` field to Video collection
- [ ] API documentation updated for team

## Migration Guide: Phase 2 → Phase 3

### What Changed

| Component | Phase 2 (LUMA-only) | Phase 3 (Multi-provider) |
|-----------|-------------------|--------------------------|
| Provider handling | `providerRouter.generateVideo(prompt, format, provider)` | `providerRouter.generateVideo({promptText, format, provider})` |
| Video model | Only `provider` field | `provider` + `mode` fields |
| API modes | API-driven only | API + manual modes |
| Manual upload | Not supported | Full workflow |
| Feature flags | Only DEFAULT_PROVIDER | Plus ENABLE_PIKA, ENABLE_RUNWAY |
| Provider selection | 3 options (LUMA/SORA/VEO) | 5 options + extensible |

### Backend Changes Required

1. ✅ Update provider router imports (PIKA, RUNWAY)
2. ✅ Update videoController to use new generateVideo() signature
3. ✅ Update Video model with `mode` field
4. ✅ Add completeManualUpload endpoint
5. ✅ Update .env with new feature flags

### Frontend Changes Required

1. ✅ Update videoService.ts type hints
2. ✅ Add completeManualUpload service call
3. ✅ Display `mode` in provider info
4. ✅ Add manual upload UI for pending videos
5. ⚠️ **Optional**: Update status messages per mode

## FAQ

**Q: What if I enable PIKA but don't have an API key?**
A: PIKA remains in manual mode. Jobs return as "pending" and users upload videos. When API is ready, update the provider and restart — everything else works automatically.

**Q: Can I use multiple providers simultaneously?**
A: Yes! Users select provider per request. Each request can use different provider.

**Q: What happens if LUMA API fails?**
A: If LUMA_API_KEY missing and in development, fallback simulation returns demo video. In production, error is thrown.

**Q: Do I need to update my frontend when activating new API?**
A: No! Backend changes only. Frontend automatically detects `mode` and displays appropriate UI.

**Q: How do I test manual mode locally?**
A: Set `ENABLE_PIKA=true` in .env. Generate video with provider='pika'. It returns pending. Call upload endpoint with video URL. Status changes to generated.

