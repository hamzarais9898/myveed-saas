/**
 * Text-to-Speech Service
 * Generates AI voice-overs with different voices and speaking styles
 */

// Available voices
const VOICES = {
  ash: {
    id: 'ash',
    name: 'Ash',
    description: 'Voix masculine énergique et dynamique',
    language: 'fr-FR',
    gender: 'male',
    style: 'energetic'
  },
  emma: {
    id: 'emma',
    name: 'Emma',
    description: 'Voix féminine douce et professionnelle',
    language: 'fr-FR',
    gender: 'female',
    style: 'professional'
  },
  lucas: {
    id: 'lucas',
    name: 'Lucas',
    description: 'Voix masculine calme et posée',
    language: 'fr-FR',
    gender: 'male',
    style: 'calm'
  },
  sophie: {
    id: 'sophie',
    name: 'Sophie',
    description: 'Voix féminine enthousiaste',
    language: 'fr-FR',
    gender: 'female',
    style: 'enthusiastic'
  },
  alex: {
    id: 'alex',
    name: 'Alex',
    description: 'Voix neutre et claire',
    language: 'fr-FR',
    gender: 'neutral',
    style: 'neutral'
  }
};

// Vibe presets for speaking styles
const VIBE_PRESETS = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Style naturel et clair',
    prompt: 'Speak naturally with clear pronunciation and moderate pace. Use a friendly and approachable tone.'
  },
  energetic: {
    id: 'energetic',
    name: 'Energetic',
    description: 'Énergique comme un commentateur sportif',
    prompt: 'Speak with enthusiasm and energy, like a sports commentator during an exciting game. Use short, punchy sentences and emphasize key words dramatically. Maintain high energy throughout.'
  },
  calm: {
    id: 'calm',
    name: 'Calm & Soothing',
    description: 'Calme et apaisant',
    prompt: 'Speak slowly and calmly with a relaxing, soothing tone. Use gentle inflections and pauses. Create a peaceful, meditative atmosphere.'
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Professionnel et autoritaire',
    prompt: 'Speak in a professional, authoritative manner. Use clear articulation, confident tone, and measured pace. Sound like a news anchor or corporate presenter.'
  },
  storyteller: {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Conteur captivant',
    prompt: 'Speak like a captivating storyteller. Use dramatic pauses, varied intonation, and emotional expression. Draw listeners in with engaging delivery.'
  },
  motivational: {
    id: 'motivational',
    name: 'Motivational',
    description: 'Motivant et inspirant',
    prompt: 'Speak with passion and conviction like a motivational speaker. Use powerful emphasis, inspiring tone, and uplifting energy. Make every word count.'
  },
  casual: {
    id: 'casual',
    name: 'Casual & Friendly',
    description: 'Décontracté et amical',
    prompt: 'Speak in a casual, conversational way like talking to a friend. Use relaxed tone, natural rhythm, and friendly warmth. Be approachable and relatable.'
  },
  mysterious: {
    id: 'mysterious',
    name: 'Mysterious',
    description: 'Mystérieux et intrigant',
    prompt: 'Speak with a mysterious, intriguing tone. Use lower pitch, slower pace, and dramatic pauses. Create suspense and curiosity.'
  }
};

/**
 * Get all available voices
 */
exports.getAvailableVoices = () => {
  return Object.values(VOICES);
};

/**
 * Get all vibe presets
 */
exports.getVibePresets = () => {
  return Object.values(VIBE_PRESETS);
};

/**
 * Generate speech from text
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - Voice ID to use
 * @param {string} vibeId - Vibe preset ID
 * @param {string} customVibe - Custom vibe prompt (optional)
 * @returns {Promise<string>} - URL to generated audio file
 */
exports.generateSpeech = async (text, voiceId = 'ash', vibeId = 'default', customVibe = null) => {
  try {
    console.log('Generating TTS:', { text: text.substring(0, 50), voiceId, vibeId });

    // Validate voice
    const voice = VOICES[voiceId];
    if (!voice) {
      throw new Error(`Invalid voice ID: ${voiceId}`);
    }

    // Get vibe prompt
    const vibe = VIBE_PRESETS[vibeId];
    const vibePrompt = customVibe || (vibe ? vibe.prompt : VIBE_PRESETS.default.prompt);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // TODO: Replace with real TTS API integration
    /*
    // Option 1: ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voice.elevenLabsId, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: vibePrompt
        }
      })
    });

    const audioBuffer = await response.arrayBuffer();
    const audioPath = `uploads/tts/${Date.now()}_${voiceId}.mp3`;
    await fs.promises.writeFile(audioPath, Buffer.from(audioBuffer));
    return `${process.env.BACKEND_URL}/${audioPath}`;
    */

    /*
    // Option 2: Azure Cognitive Services
    const sdk = require('microsoft-cognitiveservices-speech-sdk');
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );
    speechConfig.speechSynthesisVoiceName = voice.azureVoiceName;
    
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioPath);
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    
    await new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        result => {
          synthesizer.close();
          resolve(result);
        },
        error => {
          synthesizer.close();
          reject(error);
        }
      );
    });
    */

    // Simulated response - returns a mock audio URL
    const mockAudioUrl = `https://storage.maveed.io.example.com/tts/${Date.now()}_${voiceId}_${vibeId}.mp3`;

    console.log('TTS generated successfully:', mockAudioUrl);
    return mockAudioUrl;

  } catch (error) {
    console.error('TTS generation error:', error);
    throw new Error('Failed to generate speech');
  }
};

/**
 * Validate text length
 */
exports.validateTextLength = (text, maxLength = 1500) => {
  if (!text || text.trim().length === 0) {
    throw new Error('Text is required');
  }
  if (text.length > maxLength) {
    throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
  }
  return true;
};

/**
 * Calculate TTS credits cost
 * 1 credit per generation
 */
exports.calculateTtsCost = (text) => {
  return 1; // Flat rate: 1 TTS credit per generation
};
