import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const STORAGE_KEY = "cryptoneko_disclaimer_accepted_v2"; 

function detectRegion() {
  const lang = navigator.language || "";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  if (lang.startsWith("en-GB") || tz.includes("London") || tz.includes("Europe/London")) {
    return "UK";
  }
  if (tz.startsWith("Europe/") || ["de", "fr", "it", "es", "nl", "pl", "pt", "sv", "da", "fi"].some((l) => lang.startsWith(l))) {
    return "EU";
  }
  return "OTHER";
}

const REGION_WARNINGS: Record<string, { title: string; text: string; }> = {
  UK: {
    title: "UK Users — Important Notice",
    text: "CryptoNeko is not authorised by the Financial Conduct Authority (FCA). This platform provides technical analysis tools only and does not constitute a financial promotion or investment advice under the Financial Services and Markets Act 2000. Cryptoassets are high risk and largely unregulated in the UK. You are unlikely to be protected if something goes wrong.",
  },
  EU: {
    title: "EU Users — Important Notice",
    text: "CryptoNeko is not licensed as a Crypto-Asset Service Provider (CASP) under MiCA (Markets in Crypto-Assets Regulation). This platform provides automated technical analysis only and does not constitute investment advice or portfolio management services. EU residents should be aware that crypto-asset investments carry significant risks and are subject to MiCA oversight.",
  },
};

export default function DisclaimerModal({ onAccept }: { onAccept?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [region, setRegion] = useState("OTHER");

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setVisible(true);
      setRegion(detectRegion());
    } else {
      onAccept?.();
    }
  }, []);

  function handleAccept() {
    if (!checked) return;
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setVisible(false);
    onAccept?.();
  }

  function handleDecline() {
    window.location.href = "https://google.com"; // Veya projeden çıkış
  }

  const regionWarning = REGION_WARNINGS[region];

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-xl shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white tracking-tight">Terms of Service & Risk Disclosure</h2>
              <p className="text-sm text-gray-400 mt-1">Please read and acknowledge the following terms before proceeding.</p>
            </div>

            <div className="p-6">
              <div className="bg-[#1a1a1a] border border-white/5 rounded-md p-4 h-64 overflow-y-auto custom-scrollbar">
                
                {regionWarning && (
                  <div className="mb-6 pb-6 border-b border-white/5">
                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">{regionWarning.title}</h3>
                    <p className="text-[13px] text-gray-400 leading-relaxed">{regionWarning.text}</p>
                  </div>
                )}

                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">1. Not Financial Advice</h3>
                    <p className="text-[13px] text-gray-400 leading-relaxed">
                      CryptoNeko provides automated technical analysis tools only. All signals, scores, indicators, and AI-generated commentary are provided for informational and educational purposes only and do not constitute investment advice, financial advice, trading advice, or any other sort of advice. You should not treat any of the Website's content as such.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">2. Assumption of Risk</h3>
                    <p className="text-[13px] text-gray-400 leading-relaxed">
                      Trading and investing in cryptocurrencies involves a high degree of risk. Prices are highly volatile and can fluctuate significantly in a short period of time. You may lose some or all of your initial investment. You acknowledge that you are using CryptoNeko at your own risk and that you are solely responsible for any decisions you make based on the information provided.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">3. No Guarantees</h3>
                    <p className="text-[13px] text-gray-400 leading-relaxed">
                      CryptoNeko makes no guarantees or warranties regarding the accuracy, completeness, or timeliness of the information provided. The automated technical analysis and AI models may be inaccurate, and past performance does not guarantee future results.
                    </p>
                  </section>
                  
                  <section>
                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">4. Limitation of Liability</h3>
                    <p className="text-[13px] text-gray-400 leading-relaxed">
                      Under no circumstances will CryptoNeko, its affiliates, or its employees be held liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the platform, including but not limited to financial losses.
                    </p>
                  </section>
                </div>
              </div>

              <label 
                className="flex items-start gap-3 cursor-pointer group mt-6"
                onClick={(e) => {
                  e.preventDefault();
                  setChecked(!checked);
                }}
              >
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all duration-150 ${checked ? 'bg-white border-white' : 'bg-[#1a1a1a] border-gray-600 group-hover:border-gray-400'}`}>
                  <Check size={14} className={`text-black transition-opacity duration-150 ${checked ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                </div>
                <span className="text-sm text-gray-300 select-none group-hover:text-white transition-colors">
                  I have read and agree to the Terms of Service and Risk Disclosure.
                </span>
              </label>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#0a0a0a] rounded-b-xl flex justify-end gap-3">
              <button
                onClick={handleDecline}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={!checked}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  checked 
                    ? "bg-white text-black hover:bg-gray-200" 
                    : "bg-white/10 text-gray-500 cursor-not-allowed"
                }`}
              >
                Accept & Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
