const { generateUuid } = require('../utils/generateUuid');

/**
 * Banana Provider (Google Gemini/Imagen Wrapper)
 * Implements a robust fallback chain to handle quotas and model availability.
 */

// Model Configuration
const MODELS = {
    PRIMARY: "imagen-4.0-generate-001", // Paid priority
    SECONDARY: "gemini-2.5-flash-image", // Fast/Quota fallback
    FALLBACK: "gemini-3-pro-image-preview" // Experimental fallback
};

/**
 * Generate image with fallback logic
 */
async function generateImage(promptText, resolution = '1024x1024', style = 'cinematic', quality = 'standard') {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY not found. Using simulation.");
    return simulateGeneration(promptText);
  }

  // Ensure prompt includes style advice
  let enhancedPrompt = `Generate a high quality image of: ${promptText}. Style: ${style}.`;
  
  if (quality === 'hd') {
      enhancedPrompt += " 8k resolution, highly detailed, photorealistic, sharp focus, HDR.";
  }
  
  // Calculate aspect ratio from resolution string
  const aspectRatio = getAspectRatio(resolution);

  console.log(`🍌 Generating [${resolution} -> ${aspectRatio}] Style: ${style} Quality: ${quality}`);

  // 1. Try Primary (Imagen 4.0 - Predict)
  try {
    console.log(`🍌 [1/3] Trying Primary: ${MODELS.PRIMARY}`);
    return await generateWithImagenPredict(MODELS.PRIMARY, enhancedPrompt, apiKey, aspectRatio);
  } catch (error) {
    console.warn(`⚠️ Primary model failed: ${error.message}`);
    
    // 2. Try Secondary (Gemini 2.5 - GenerateContent)
    try {
        console.log(`🍌 [2/3] Fallback to Secondary: ${MODELS.SECONDARY}`);
        return await generateWithGemini(MODELS.SECONDARY, enhancedPrompt, apiKey, aspectRatio);
    } catch (err2) {
        console.warn(`⚠️ Secondary model failed: ${err2.message}`);

        // 3. Try Fallback (Gemini 3 - GenerateContent)
        try {
             console.log(`🍌 [3/3] Fallback to Fallback: ${MODELS.FALLBACK}`);
             return await generateWithGemini(MODELS.FALLBACK, enhancedPrompt, apiKey, aspectRatio);
        } catch (err3) {
             console.error(`❌ All models failed. Last error: ${err3.message}`);
             console.log("🍌 Returning simulation due to complete failure.");
             return simulateGeneration(promptText);
        }
    }
  }
}

// Helper: Map resolution string to API aspect ratio
function getAspectRatio(resolution) {
    if (!resolution) return '1:1';
    
    // Handle standard formats
    switch(resolution) {
        case '1024x1024': return '1:1';
        case '1792x1024': return '16:9';
        case '1024x1792': return '9:16';
    }
    
    // Fallback parsing if it's a raw resolution string
    if (resolution.includes('x')) {
        const [w, h] = resolution.split('x').map(Number);
        if (w === h) return '1:1';
        if (w > h) return '16:9';
        if (h > w) return '9:16';
    }
    
    return '1:1';
}

// Helper for Gemini 'generateContent' API (v1beta)
async function generateWithGemini(modelName, prompt, apiKey, aspectRatio) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ parts: [{ text: `${prompt} --aspect_ratio ${aspectRatio}` }] }],
      generationConfig: { 
          response_modalities: ["IMAGE"]
      }
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts) {
            for (const part of data.candidates[0].content.parts) {
                if (part.inlineData) {
                     return {
                        id: await generateUuid(),
                        imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                        status: 'completed'
                     };
                }
            }
        }
        throw new Error("No inline image data in response");
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error(`Gemini request timeout after 45s`);
        throw error;
    }
}

// Helper for Imagen 'predict' API (v1beta)
async function generateWithImagenPredict(modelName, prompt, apiKey, aspectRatio) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;
    
    const payload = {
        instances: [{ prompt: prompt }],
        parameters: {
            sampleCount: 1,
            aspectRatio: aspectRatio
        }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Predict API ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
             return {
                id: await generateUuid(),
                imageUrl: `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`,
                status: 'completed'
            };
        }
        
        throw new Error("No predictions found in response");
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error(`Imagen request timeout after 45s`);
        throw error;
    }
}

async function simulateGeneration(prompt) {
  const UNSPLASH_FALLBACK = [
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1024&q=80',
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1024&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1024&q=80'
  ];
  return {
    id: await generateUuid(),
    imageUrl: UNSPLASH_FALLBACK[Math.floor(Math.random() * UNSPLASH_FALLBACK.length)],
    status: 'completed'
  };
}

module.exports = { generateImage };
