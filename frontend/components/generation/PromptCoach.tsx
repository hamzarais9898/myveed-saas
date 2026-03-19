'use client';

import React, { useState } from 'react';
import { Sparkles, Brain, ChevronDown, ChevronUp, Check, Wand2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import promptService, { PromptCoachFields } from '@/services/promptService';

interface PromptCoachProps {
  promptText: string;
  onPromptChange: (newPrompt: string) => void;
}

export default function PromptCoach({ promptText, onPromptChange }: PromptCoachProps) {
  const { t, language } = useLanguage();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [assistantData, setAssistantData] = useState<PromptCoachFields>({
    personAction: '',
    productShowcase: '',
    cameraStyle: '',
    ambiance: '',
    marketingGoal: ''
  });

  const isLoading = isImproving || isGenerating;

  const formulaItems = [
    { key: 'character', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { key: 'action', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { key: 'camera', color: 'bg-pink-50 text-pink-700 border-pink-100' },
    { key: 'mood', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { key: 'goal', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
  ];

  const examples = [
    { key: 'product', icon: '🎯' },
    { key: 'premium', icon: '✨' },
    { key: 'tiktok', icon: '📱' },
    { key: 'cinematic', icon: '🎬' },
    { key: 'demo', icon: '🧼' }
  ];

  const handleTemplateClick = (key: string) => {
    const templatePrompt = t(`generation.promptCoach.prompts.${key}`);
    onPromptChange(templatePrompt);
    setError(null);
  };

  const handleImprove = async () => {
    if (!promptText.trim() || isLoading) return;

    setIsImproving(true);
    setError(null);
    try {
      const response = await promptService.improvePrompt(promptText, language);
      if (response.success) {
        onPromptChange(response.prompt);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’amélioration du prompt');
    } finally {
      setIsImproving(false);
    }
  };

  const generateFromAssistant = async () => {
    const hasData = Object.values(assistantData).some(val => val.trim() !== '');
    if (!hasData || isLoading) return;

    setIsGenerating(true);
    setError(null);
    try {
      // Pass the current promptText as context to the AI
      const response = await promptService.generateCoachPrompt(assistantData, language, promptText);
      if (response.success) {
        onPromptChange(response.prompt);
        setIsAssistantOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 md:p-8 space-y-8 overflow-hidden relative group">
      {/* Background Glow Decoration */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100 shrink-0">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black text-gray-900 leading-tight">
            {t('generation.promptCoach.title')}
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            {t('generation.promptCoach.subtitle')}
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1 rounded-full animate-pulse shadow-sm border border-purple-100">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest leading-none mt-0.5">AI Generating...</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10"
          >
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simple Explanation */}
      <div className="relative z-10 bg-gray-50/50 rounded-3xl p-6 border border-gray-100/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-[#e2a9f1] rounded-full" />
          <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
            {t('generation.promptCoach.howTo.title')}
          </h4>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-4 font-medium">
          {t('generation.promptCoach.howTo.desc')}
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <Check className="w-3 h-3 text-emerald-500" />
              {t(`generation.promptCoach.howTo.item${i}`)}
            </li>
          ))}
        </ul>
      </div>

      {/* Formula */}
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          {formulaItems.map((item, idx) => (
            <React.Fragment key={item.key}>
              <div className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${item.color} shadow-sm`}>
                {t(`generation.promptCoach.formula.${item.key}`)}
              </div>
              {idx < formulaItems.length - 1 && (
                <span className="text-gray-300 font-bold">+</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Examples / Templates */}
      <div className="relative z-10 space-y-4">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
          {t('generation.promptCoach.examples.title')}
        </h4>
        <div className="flex flex-wrap gap-3">
          {examples.map((ex) => (
            <button
              key={ex.key}
              onClick={() => handleTemplateClick(ex.key)}
              className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 shadow-sm hover:shadow-md hover:border-[#e2a9f1]/50 hover:bg-purple-50/50 transition-all flex items-center gap-2 group/btn"
              disabled={isLoading}
            >
              <span className="group-hover/btn:scale-110 transition-transform">{ex.icon}</span>
              {t(`generation.promptCoach.examples.${ex.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-50">
        <button
          onClick={handleImprove}
          disabled={!promptText.trim() || isLoading}
          className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isImproving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          {t('generation.promptCoach.improve')}
        </button>

        <button
          onClick={() => setIsAssistantOpen(!isAssistantOpen)}
          className={`flex-1 py-4 border-2 font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${isAssistantOpen ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'}`}
          disabled={isLoading}
        >
          {isAssistantOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          {t('generation.promptCoach.assistant.title')}
        </button>
      </div>

      {/* Step-by-step Assistant */}
      <AnimatePresence>
        {isAssistantOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['personAction', 'productShowcase', 'cameraStyle', 'ambiance', 'marketingGoal'] as const).map((field, i) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      {t(`generation.promptCoach.assistant.q${i+1}`)}
                    </label>
                    <input
                      type="text"
                      value={assistantData[field]}
                      onChange={(e) => setAssistantData({ ...assistantData, [field]: e.target.value })}
                      placeholder="..."
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all disabled:opacity-50 cursor-text"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={generateFromAssistant}
                disabled={isLoading || !Object.values(assistantData).some(v => v.trim() !== '')}
                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {t('generation.promptCoach.assistant.generate')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
