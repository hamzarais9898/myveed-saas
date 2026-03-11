import { useState, useEffect, useCallback } from 'react';

interface UseSpeechToTextProps {
    lang?: string;
}

export const useSpeechToText = ({ lang = 'fr-FR' }: UseSpeechToTextProps = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognitionInstance = new SpeechRecognition();
                recognitionInstance.continuous = true; // Keep listening
                recognitionInstance.interimResults = true; // Real-time results
                recognitionInstance.lang = lang;

                recognitionInstance.onstart = () => {
                    setIsListening(true);
                    setError(null);
                };

                recognitionInstance.onend = () => {
                    setIsListening(false);
                };

                recognitionInstance.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setError(event.error);
                    setIsListening(false);
                };

                recognitionInstance.onresult = (event: any) => {
                    let finalTranscript = '';
                    // Reconstruct the full transcript from all results in this session
                    for (let i = 0; i < event.results.length; i++) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                    setTranscript(finalTranscript);
                };

                setRecognition(recognitionInstance);
            } else {
                setError("Browser not supported");
            }
        }
    }, [lang]);

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            try {
                setTranscript(''); // Reset transcript on new session
                recognition.start();
            } catch (e) {
                console.error("Failed to start recognition", e);
            }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            recognition.stop();
        }
    }, [recognition, isListening]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isListening,
        transcript,
        toggleListening,
        startListening,
        stopListening,
        error,
        isSupported: !!recognition
    };
};
