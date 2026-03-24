import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface PromptCoachFields {
  personAction: string;
  productShowcase: string;
  cameraStyle: string;
  ambiance: string;
  marketingGoal: string;
}

export interface PromptResponse {
  success: boolean;
  prompt: string;
  message?: string;
}

/**
 * Service for prompt coach and improvement features
 */
export const promptService = {
  /**
   * Generates a marketing prompt from structured fields using AI
   */
  generateCoachPrompt: async (fields: PromptCoachFields, language: string = 'fr', userPrompt: string = ''): Promise<PromptResponse> => {
    try {
      const response = await axios.post(`${API_URL}/prompts/coach/generate`, {
        fields,
        language,
        userPrompt
      });
      return response.data;
    } catch (error: any) {
      console.error('Error generating coach prompt:', error);
      throw error.response?.data || { success: false, message: 'Génération échouée' };
    }
  },

  /**
   * Improves a raw prompt using AI
   */
  improvePrompt: async (prompt: string, language: string = 'fr'): Promise<PromptResponse> => {
    try {
      const response = await axios.post(`${API_URL}/prompts/coach/improve`, {
        prompt,
        language
      });
      return response.data;
    } catch (error: any) {
      console.error('Error improving prompt:', error);
      throw error.response?.data || { success: false, message: 'Amélioration échouée' };
    }
  }
};

export default promptService;
