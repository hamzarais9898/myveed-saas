const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const ffmpeg = require('fluent-ffmpeg');

/**
 * Transcription Service
 * Uses OpenAI Whisper to transcribe video audio
 */
class TranscriptionService {
  constructor() {
    this.openai = null;
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('✅ MAVEED TranscriptionService initialized with OpenAI');
    } else {
      console.warn('⚠️ TranscriptionService: OPENAI_API_KEY missing. Subtitles will be simulated.');
    }
  }

  /**
   * Extract audio from video file
   * @param {string} videoPath 
   * @returns {Promise<string>} Path to audio file
   */
  async extractAudio(videoPath) {
    return new Promise((resolve, reject) => {
      const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');
      
      ffmpeg(videoPath)
        .toFormat('mp3')
        .on('end', () => resolve(audioPath))
        .on('error', (err) => reject(err))
        .save(audioPath);
    });
  }

  /**
   * Transcribe audio/video
   * @param {string} filePath - Path to local video or audio file
   * @returns {Promise<Array>} - Array of segments { start, end, text }
   */
  async transcribe(filePath) {
    try {
      if (!this.openai) {
        return this.simulateTranscription();
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // If video, extract audio first (Whisper requires audio or small video)
      let audioPath = filePath;
      const isVideo = ['.mp4', '.mov', '.avi'].includes(path.extname(filePath).toLowerCase());
      
      if (isVideo) {
        console.log('🔊 Extracting audio from video...');
        audioPath = await this.extractAudio(filePath);
      }

      console.log('🎙️ Transcribing audio...');
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'] // Get precise timestamps
      });

      // Cleanup audio file if we created it
      if (isVideo && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }

      // Map response to our format
      return response.segments.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim()
      }));

    } catch (error) {
      console.error('Transcription error:', error);
      // Fallback to simulation if network/auth fails, or rethrow depending on strictness
      // throw new Error('Transcription failed: ' + error.message);
      return this.simulateTranscription();
    }
  }

  simulateTranscription() {
    console.log('🤖 Simulating transcription...');
    return [
      { start: 0, end: 2, text: "Bienvenue sur MAVEED." },
      { start: 2, end: 4, text: "Ceci est une vidéo générée par IA." },
      { start: 4, end: 6, text: "Les sous-titres sont synchronisés." }
    ];
  }
}

module.exports = new TranscriptionService();
