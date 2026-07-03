import { useState, useCallback, useEffect, useRef } from "react";

// Extend window for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoice(onResult: (text: string) => void) {
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, []);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.interimResults = false;
        reco.lang = "tr-TR"; // Default to Turkish as per the app's language context

        reco.onstart = () => setIsListening(true);
        reco.onend = () => setIsListening(false);
        
        reco.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          onResultRef.current(text);
        };
        
        reco.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        setRecognition(reco);
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        // Stop any ongoing speech before listening
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        recognition.start();
      } catch (e) {
        console.error("Already listening");
      }
    } else {
      alert("Microphone is not supported in this browser.");
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "tr-TR";
      
      // Try to find a good voice (like Google Türkçe or a premium one if available)
      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices.find(v => v.lang.includes("tr"));
      if (trVoice) {
        utterance.voice = trVoice;
      }
      
      utterance.pitch = 1.1; // Slightly techy
      utterance.rate = 1.05; // Slightly fast

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Pre-load voices to avoid delay on first speak
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported: !!recognition,
  };
}
