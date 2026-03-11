# Advanced Usage & Patterns

## Use Cases

### 1. User Selects Provider at Generation Time

```typescript
// Frontend
const handleGenerateWithProvider = async (prompt, provider) => {
  // provider = 'luma' | 'pika' | 'runway' | 'auto'
  const result = await generateVideo(prompt, 'youtube', 1, provider);
  
  if (result.mode === 'api') {
    // Start polling for completion
    startPolling(result.generationId);
  } else if (result.mode === 'manual') {
    // Show upload widget
    showUploadWidget(result.id);
  }
};
```

### 2. Provider-Specific Feature Display

```typescript
// Show different features based on provider mode
const providers = await getAvailableProviders();

providers.forEach(provider => {
  if (provider.id === 'luma' && provider.enabled) {
    showFeature('image-to-video');  // LUMA supports this
    showFeature('aspect-ratio');
  }
  
  if (provider.id === 'pika' && provider.enabled && provider.mode === 'api') {
    showFeature('video-editing');   // Only when API ready
  }
});
```

### 3. Batch Generation with Provider Routing

```javascript
// Generate 3 youtube + 3 short = 6 videos
// Different providers for each format?

const results = await Promise.all([
  generateVideo(prompt, 'youtube', 3, 'luma'),    // Fast, use LUMA
  generateVideo(prompt, 'short', 3, 'pika')       // Experimental, use PIKA
]);

// Mixed providers in same batch
console.log({
  youtubeVideos: results[0],  // Via LUMA
  shortVideos: results[1]     // Via PIKA
});
```

### 4. Automatic Fallback Strategy

```javascript
// Always provide fallback
const providers = ['pika', 'luma', 'veo'];  // Priority order

for (const provider of providers) {
  try {
    return await generateVideo(prompt, format, 1, provider);
  } catch (error) {
    console.warn(`${provider} failed, trying next...`);
    continue;  // Try next provider
  }
}

// All failed
throw new Error('All providers failed');
```

### 5. Admin Manual Batch Upload

```javascript
// Admin uploads multiple videos at once
const pendingVideos = await Video.find({ status: 'pending', mode: 'manual' });

for (const video of pendingVideos) {
  if (adminHasFile(video.generationId)) {
    const fileUrl = await uploadFile(video.generationId);
    await completeManualUpload(video._id, fileUrl);
  }
}
```

---

## Performance Patterns

### Pattern 1: Parallel Generation

```javascript
// Generate with multiple providers in parallel
const results = await Promise.allSettled([
  generateVideo(prompt, 'youtube', 1, 'luma'),
  generateVideo(prompt, 'youtube', 1, 'pika'),
  generateVideo(prompt, 'youtube', 1, 'runway')
]);

// Keep all successful ones, show to user for comparison
const successful = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value.videos[0]);
```

### Pattern 2: Lazy Loading Providers

```javascript
// Only load provider when needed
exports.generateVideo = async (payload) => {
  const { provider } = payload;
  
  // Import provider dynamically
  const providerModule = require(`./providers/${provider}.provider`);
  
  // Use it
  return providerModule.generateVideo(payload);
};
```

### Pattern 3: Provider Health Check

```javascript
// Before accepting requests, verify providers are healthy
app.use('/api/videos', async (req, res, next) => {
  const providers = providerRouter.getAvailableProviders();
  const healthyProviders = providers.filter(p => p.available);
  
  if (healthyProviders.length === 0) {
    return res.status(503).json({
      message: 'No providers available',
      service: 'unavailable'
    });
  }
  
  next();
});
```

---

## Error Handling Patterns

### Pattern 1: Provider-Specific Error Recovery

```javascript
async function generateWithRecovery(payload) {
  try {
    return await providerRouter.generateVideo(payload);
  } catch (error) {
    if (error.message.includes('RATE_LIMITED')) {
      // LUMA rate limited? Try PIKA
      return generateWithRecovery({
        ...payload,
        provider: 'pika'
      });
    }
    
    if (error.message.includes('INVALID_API_KEY')) {
      // API key issue? Fallback to default
      return generateWithRecovery({
        ...payload,
        provider: process.env.DEFAULT_PROVIDER
      });
    }
    
    throw error;
  }
}
```

### Pattern 2: Graceful Degradation

```javascript
// User requests PIKA but API not configured
// System silently uses LUMA instead

const userProvider = req.body.provider || 'auto';
const selectedProvider = isProviderAvailable(userProvider)
  ? userProvider
  : (process.env.DEFAULT_PROVIDER || 'luma');

const result = await generateVideo({
  ...payload,
  provider: selectedProvider
});

// Notify user which provider was used
res.json({
  ...result,
  note: `Generated with ${selectedProvider} (requested: ${userProvider})`
});
```

### Pattern 3: Retry Logic

```javascript
async function generateWithRetry(payload, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await providerRouter.generateVideo(payload);
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) throw error;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

---

## Monitoring & Analytics

### Pattern 1: Provider Usage Tracking

```javascript
// Track which provider generates each video
exports.generateVideo = async (req, res) => {
  const { provider, format } = req.body;
  const selectedProvider = resolveProvider(provider);
  
  // Log for analytics
  analytics.track({
    event: 'video_generation_started',
    userId: req.user._id,
    provider: selectedProvider,
    format: format,
    timestamp: new Date()
  });
  
  const result = await providerRouter.generateVideo({...});
  return res.json(result);
};
```

### Pattern 2: Provider Performance Metrics

```javascript
// Track provider success rates
class ProviderMetrics {
  static async recordGeneration(provider, success, duration) {
    await Metric.create({
      provider,
      success,
      duration,
      timestamp: new Date()
    });
  }
  
  static async getSuccessRate(provider) {
    const metrics = await Metric.find({ provider });
    const successful = metrics.filter(m => m.success).length;
    return (successful / metrics.length) * 100;
  }
  
  static async getAverageDuration(provider) {
    const metrics = await Metric.find({ provider });
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }
}

// Use it
try {
  const start = Date.now();
  const result = await generateVideo(payload);
  ProviderMetrics.recordGeneration(result.provider, true, Date.now() - start);
} catch (error) {
  ProviderMetrics.recordGeneration(payload.provider, false, 0);
}
```

### Pattern 3: Provider Dashboard

```javascript
// Dashboard showing provider status
app.get('/api/admin/providers/metrics', async (req, res) => {
  const providers = providerRouter.getAvailableProviders();
  
  const metrics = await Promise.all(
    providers.map(async (p) => ({
      id: p.id,
      name: p.name,
      enabled: p.enabled,
      mode: p.mode,
      successRate: await ProviderMetrics.getSuccessRate(p.id),
      avgDuration: await ProviderMetrics.getAverageDuration(p.id),
      totalGenerations: await Video.countDocuments({ provider: p.id })
    }))
  );
  
  res.json(metrics);
});
```

---

## Testing Patterns

### Pattern 1: Mock Provider for Testing

```javascript
// tests/providers.test.js
class MockProvider extends BaseVideoProvider {
  constructor() {
    super('mock', 'Mock Provider', 'api', true);
  }
  
  async generateVideo(payload) {
    // Simulate API call
    return {
      id: 'mock_' + Date.now(),
      status: 'processing',
      provider: 'mock',
      mode: 'api'
    };
  }
  
  async checkStatus(generationId) {
    // Always return completed instantly for testing
    return {
      id: generationId,
      status: 'completed',
      videoUrl: 'https://example.com/video.mp4'
    };
  }
}

module.exports = new MockProvider();
```

### Pattern 2: Test Different Modes

```javascript
describe('Video Generation Modes', () => {
  it('should handle API mode (LUMA)', async () => {
    const result = await generateVideo({
      promptText: 'test',
      format: 'youtube',
      provider: 'luma'
    });
    
    expect(result.mode).toBe('api');
    expect(result.status).toBe('processing');
  });
  
  it('should handle manual mode (PIKA)', async () => {
    process.env.ENABLE_PIKA = 'true';
    
    const result = await generateVideo({
      promptText: 'test',
      format: 'youtube',
      provider: 'pika'
    });
    
    expect(result.mode).toBe('manual');
    expect(result.status).toBe('pending');
  });
});
```

---

## Migration Patterns

### Pattern 1: Gradual Rollout

```javascript
// 1. Enable new provider for 5% of traffic
if (Math.random() < 0.05) {
  selectedProvider = 'pika';
} else {
  selectedProvider = 'luma';  // Default for now
}

// 2. Monitor metrics
const pikaSuccessRate = await ProviderMetrics.getSuccessRate('pika');
if (pikaSuccessRate > 95) {
  // 3. Increase to 25%
  if (Math.random() < 0.25) {
    selectedProvider = 'pika';
  }
  
  // 4. Eventually make default
  // DEFAULT_PROVIDER=pika in .env
}
```

### Pattern 2: Provider Sunset

```javascript
// Phase out old provider
const sunsetProvider = 'veo';
const sunsetDate = new Date('2024-12-31');

if (req.body.provider === sunsetProvider) {
  if (new Date() > sunsetDate) {
    // Force switch to new provider
    return res.status(410).json({
      error: 'VEO provider is deprecated',
      suggestion: 'Use PIKA instead'
    });
  } else {
    // Show warning but allow
    console.warn(`VEO sunset warning: ${Math.ceil((sunsetDate - new Date()) / 86400000)} days remaining`);
  }
}
```

---

## Best Practices

### ✅ Do

- Use `provider: 'auto'` to let system choose
- Implement fallback logic
- Monitor provider metrics
- Handle both `api` and `manual` modes
- Test with mock provider
- Document provider-specific features
- Log provider selection for debugging

### ❌ Don't

- Hardcode provider IDs in frontend
- Assume all providers are available
- Skip error handling
- Ignore provider-specific limitations
- Test only with real API keys
- Store API keys in code
- Mix provider modes without checking

---

## Debugging Commands

```bash
# Check provider configuration
curl http://localhost:5000/api/videos/providers/available \
  -H "Authorization: Bearer $TOKEN"

# Generate with specific provider
curl -X POST http://localhost:5000/api/videos/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promptText": "test",
    "format": "youtube",
    "provider": "pika"
  }'

# Check video status
curl http://localhost:5000/api/videos/generationId123 \
  -H "Authorization: Bearer $TOKEN"

# Complete manual upload
curl -X POST http://localhost:5000/api/videos/admin/upload-complete/videoId123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "videoUrl": "https://storage.example.com/video.mp4" }'
```

