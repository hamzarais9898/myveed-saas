'use strict';

import React, { useState, useEffect } from 'react';
import { Lightbulb, CheckCircle2, XCircle, Sparkles, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface PromptHelperProps {
  promptText: string;
  onPromptChange: (newPrompt: string) => void;
}

const FORBIDDEN_WORDS = ['ronaldo', 'messi', 'elon', 'musk', 'war', 'blood', 'kill', 'murder', 'weapon', 'gun', 'violent', 'violence'];
const CULTURAL_TERMS = [
  'jellaba', 'djellaba', 'caftan', 'kaftan', 'gandoura', 'takchita', 'abaya', 'khamis', 'qamis', 
  'burnous', 'fez', 'boubou', 'dashiki', 'kimono', 'sari', 'hijab', 'turban', 'melhafa', 'haik', 'tarbouche'
];
const SHORT_PROMPT_THRESHOLD = 4; // words

export default function PromptHelper({ promptText, onPromptChange }: PromptHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Analyze prompt
  useEffect(() => {
    if (!promptText.trim()) {
      setWarningMessage(null);
      return;
    }

    const words = promptText.toLowerCase().trim().split(/\s+/);
    
    // Check forbidden words
    const foundForbidden = words.some(word => 
      FORBIDDEN_WORDS.some(forbidden => word.includes(forbidden))
    );

    if (foundForbidden) {
      setWarningMessage("⚠️ This prompt may be rejected. Avoid real names or sensitive words. Try rephrasing.");
      return;
    }

    // Check for cultural terms (Identity Preservation Hint)
    const detectedTerm = CULTURAL_TERMS.find(term => words.some(word => word.includes(term.toLowerCase())));

    if (detectedTerm) {
      setWarningMessage(`🔒 Identity Lock: We've detected "${detectedTerm}". Your influencer's physical identity is strictly locked; only the outfit and scene will change.`);
      return;
    }

    // Check if too short
    if (words.length > 0 && words.length < SHORT_PROMPT_THRESHOLD) {
      setWarningMessage("ℹ️ Tip: Your prompt is very short. Add details for better results.");
      return;
    }

    setWarningMessage(null);
  }, [promptText]);

  // Mock function to improve prompt
  const handleImprovePrompt = () => {
    if (!promptText.trim()) return;
    
    // Very basic mock logic for demonstration
    let improved = promptText;
    if (!improved.toLowerCase().includes('cinematic')) {
      improved += ", cinematic lighting, 4k resolution, highly detailed";
    }
    onPromptChange(improved);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-indigo-100 shadow-sm overflow-hidden transition-all duration-300 mb-6">
      {/* Header Button (Toggle) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r hover:from-indigo-50 hover:to-white transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-black text-gray-900 text-lg">🎬 Master the prompt, master the identity</h3>
            <p className="text-sm text-gray-500 font-medium">Tips for high-end AI influencer generation</p>
          </div>
        </div>
        <div className="p-2 text-indigo-400 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Warning Alert (shows even if closed if there's a warning) */}
      {warningMessage && !isOpen && (
        <div className="px-5 pb-4">
          <div className={`py-2 px-4 rounded-xl text-sm font-bold flex items-center gap-2 ${warningMessage.includes('⚠️') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
            <AlertTriangle className="w-4 h-4" />
            {warningMessage}
          </div>
        </div>
      )}

      {/* Collapsible Content */}
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-6 pt-0 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What works best */}
            <div className="bg-green-50/50 border border-green-100 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-black text-green-800 uppercase tracking-widest text-sm">What works best</h4>
              </div>
              <ul className="space-y-2 text-sm text-green-700 font-medium">
                <li className="flex items-start gap-2"><span className="text-green-500">•</span> Describe the scene clearly (location, characters, action)</li>
                <li className="flex items-start gap-2"><span className="text-green-500">•</span> Use physical descriptions instead of real names</li>
                <li className="flex items-start gap-2"><span className="text-green-500">•</span> Add camera style (cinematic, drone shot, close-up)</li>
                <li className="flex items-start gap-2"><span className="text-green-500">•</span> Specify lighting (sunset, neon, soft light)</li>
                <li className="flex items-start gap-2"><span className="text-green-500">•</span> Mention mood (relaxed, dramatic, energetic)</li>
              </ul>
            </div>

            {/* Avoid these */}
            <div className="bg-red-50/50 border border-red-100 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <h4 className="font-black text-red-800 uppercase tracking-widest text-sm">Avoid these</h4>
              </div>
              <ul className="space-y-2 text-sm text-red-700 font-medium">
                <li className="flex items-start gap-2"><span className="text-red-500">•</span> Using real people names (e.g. Ronaldo, Messi, Elon Musk)</li>
                <li className="flex items-start gap-2"><span className="text-red-500">•</span> Violent or sensitive content (war, blood, weapons)</li>
                <li className="flex items-start gap-2"><span className="text-red-500">•</span> Very short prompts (e.g. "man walking")</li>
                <li className="flex items-start gap-2"><span className="text-red-500">•</span> Conflicting instructions</li>
                <li className="flex items-start gap-2"><span className="text-red-500">•</span> Trying to recreate real celebrities exactly</li>
              </ul>
            </div>
          </div>

          {/* Example Comparison */}
          <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl mt-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-indigo-500" />
              <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm">Example</h4>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-red-100/50 border-l-4 border-red-400 rounded-r-xl">
                <span className="text-[10px] font-black uppercase text-red-600 tracking-wider block mb-1">Bad Prompt</span>
                <p className="text-sm text-red-900 line-through opacity-70">"Ronaldo and Messi talking on a beach"</p>
              </div>
              
              <div className="p-3 bg-green-100/50 border-l-4 border-green-500 rounded-r-xl shadow-sm">
                <span className="text-[10px] font-black uppercase text-green-600 tracking-wider block mb-1">Good Prompt</span>
                <p className="text-sm text-green-900 font-medium">"Two famous football players, one tall and athletic with short dark hair, the other shorter with a beard, relaxing on beach chairs under a parasol, tropical beach, cocktails on table, sunset lighting, cinematic style"</p>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h4 className="font-black text-blue-800 uppercase tracking-widest text-sm">Pro tips</h4>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed font-medium">
                Keep prompts concise (1–2 sentences). Describe the scene, outfit, and mood. Avoid adding names or physical traits that might conflict with the influencer's locked identity.
              </p>
            </div>
            
            {/* Improve Prompt Button */}
            <button
              onClick={handleImprovePrompt}
              disabled={!promptText.trim()}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Improve my prompt</span>
            </button>
          </div>

          {/* Warning Message Inside when open */}
          {warningMessage && (
            <div className={`p-4 rounded-xl border font-bold text-sm ${warningMessage.includes('⚠️') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
              {warningMessage}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
