import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VoiceAssistantWidget() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const navigate = useNavigate();

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US"; // Change to tr-TR if desired

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[event.results.length - 1].isFinal) {
          processIntent(currentTranscript.trim().toLowerCase());
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setAiResponse("");
      recognitionRef.current?.start();
      setIsListening(true);
      speak("I am listening.");
    }
  };

  const speak = (text: string) => {
    if (!synthesisRef.current) return;
    synthesisRef.current.cancel();
    setAiResponse(text);
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Use an english voice if available, preferably a female/AI sounding one
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes("en") && v.name.includes("Google")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.1;
    utterance.pitch = 1.2;
    
    utterance.onend = () => {
      setTimeout(() => setAiResponse(""), 3000); // Clear after 3 seconds
    };
    
    synthesisRef.current.speak(utterance);
  };

  const processIntent = (text: string) => {
    if (text.includes("open swap") || text.includes("trade") || text.includes("exchange")) {
      speak("Opening swap interface.");
      window.dispatchEvent(new Event("open-swap"));
    } 
    else if (text.includes("dashboard") || text.includes("home")) {
      speak("Navigating to dashboard.");
      navigate("/dashboard");
    }
    else if (text.includes("market") || text.includes("prices")) {
      speak("Showing live markets.");
      navigate("/market");
    }
    else if (text.includes("hello") || text.includes("hi ai")) {
      speak("Hello Commander. I am your AI assistant. How can I help your portfolio today?");
    }
    else if (text.includes("portfolio")) {
      speak("Opening your portfolio overview.");
      navigate("/portfolio");
    }
    else {
      speak(`I heard: ${text}. But I don't have a command for that yet.`);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-4 pointer-events-none">
      
      {/* Tooltip / Chat Bubble for Transcript */}
      <AnimatePresence>
        {(transcript || aiResponse) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto bg-[#0a0b0d]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl max-w-[280px]"
          >
            {aiResponse ? (
              <div className="flex items-start gap-3 text-cyan-400">
                <Volume2 size={16} className="shrink-0 mt-1 animate-pulse" />
                <p className="text-sm font-medium leading-relaxed">{aiResponse}</p>
              </div>
            ) : (
              <div className="flex items-start gap-3 text-slate-300">
                <Mic size={16} className="shrink-0 mt-1 text-purple-400" />
                <p className="text-sm italic">"{transcript}"...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assistant Orb Button */}
      <button
        onClick={toggleListening}
        className="pointer-events-auto relative group flex items-center justify-center"
      >
        {/* Outer Glow */}
        <motion.div
          animate={{
            scale: isListening ? [1, 1.5, 1] : 1,
            opacity: isListening ? [0.3, 0.6, 0.3] : 0,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-cyan-500 rounded-full blur-xl"
        />
        
        {/* Main Button */}
        <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
          isListening 
            ? "bg-gradient-to-tr from-cyan-600 to-purple-600 shadow-[0_0_30px_rgba(34,211,238,0.5)]" 
            : "bg-[#13151a] border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
        }`}>
          {isListening ? (
            <div className="flex items-center gap-1">
              <motion.div animate={{ height: [8, 20, 8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
              <motion.div animate={{ height: [8, 30, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.1 }} className="w-1 bg-white rounded-full" />
              <motion.div animate={{ height: [8, 15, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-white rounded-full" />
            </div>
          ) : (
            <Mic className="text-cyan-400 group-hover:scale-110 transition-transform" size={24} />
          )}
        </div>
      </button>
    </div>
  );
}
