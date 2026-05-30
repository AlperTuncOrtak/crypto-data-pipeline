import { useWeb3 } from "../../hooks/useWeb3";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletConnectButton() {
  const { account, balance, isConnecting, connectWallet, disconnectWallet } = useWeb3();
  const [showDropdown, setShowDropdown] = useState(false);

  if (account) {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "rgba(46, 204, 113, 0.1)",
            border: "1px solid rgba(46, 204, 113, 0.2)",
            borderRadius: 20,
            cursor: "pointer",
            transition: "all 0.2s ease",
            color: "#fff",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(46, 204, 113, 0.15)";
            e.currentTarget.style.borderColor = "rgba(46, 204, 113, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(46, 204, 113, 0.1)";
            e.currentTarget.style.borderColor = "rgba(46, 204, 113, 0.2)";
          }}
        >
          {balance !== null && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--positive)", paddingRight: 8, borderRight: "1px solid rgba(46, 204, 113, 0.2)" }}>
              {balance} ETH
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>
            {shortenAddress(account)}
          </span>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(45deg, #2ecc71, #3498db)" }} />
        </button>

        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 8,
              width: 180,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "8px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              zIndex: 50,
            }}
          >
            <button
              onClick={() => {
                disconnectWallet();
                setShowDropdown(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                background: "transparent",
                border: "none",
                color: "var(--negative)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(231, 76, 60, 0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 20,
        color: "var(--text-primary)",
        fontSize: 13,
        fontWeight: 600,
        cursor: isConnecting ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!isConnecting) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.transform = "scale(1.02)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isConnecting) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.transform = "scale(1)";
        }
      }}
    >
      {isConnecting ? (
        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <Wallet size={16} />
      )}
      {isConnecting ? "Connecting..." : "Connect Wallet"}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
