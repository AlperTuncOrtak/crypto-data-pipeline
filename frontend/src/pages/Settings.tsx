// ============================================================
// pages/Settings.jsx
// ============================================================
import { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  User, Mail, Phone, Lock, Bell, Shield,
  CheckCircle, AlertTriangle, Loader, Camera,
  Eye, EyeOff, ChevronRight, Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ── Helpers ───────────────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null;
  const color = type === "success" ? "#2ecc71" : "#e74c3c";
  const bg    = type === "success" ? "rgba(46,204,113,0.1)" : "rgba(231,76,60,0.1)";
  const Icon  = type === "success" ? CheckCircle : AlertTriangle;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 16px", borderRadius: 10,
      background: bg, border: `1px solid ${color}30`,
      fontSize: 13, color, marginBottom: 16,
    }}>
      <Icon size={14} style={{ flexShrink: 0 }} />
      {message}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: 16, overflow: "hidden", marginBottom: 16,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "16px 20px", borderBottom: "1px solid var(--border)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <Icon size={15} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, letterSpacing: "0.04em" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, opacity: 0.7 }}>{hint}</div>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", disabled, readOnly, suffix }) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input
        type={isPassword && showPass ? "text" : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        style={{
          width: "100%", padding: "10px 14px",
          paddingRight: isPassword || suffix ? 44 : 14,
          background: readOnly || disabled ? "rgba(255,255,255,0.02)" : "var(--bg-elevated)",
          border: "1px solid var(--border)", borderRadius: 10,
          color: readOnly || disabled ? "var(--text-muted)" : "var(--text-primary)",
          fontSize: 13, outline: "none",
          caretColor: "var(--accent)",
          cursor: readOnly || disabled ? "not-allowed" : "text",
          boxSizing: "border-box",
        }}
        onFocus={e => { if (!readOnly && !disabled) e.target.style.borderColor = "rgba(245,166,35,0.4)"; }}
        onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
      />
      {isPassword && (
        <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
      {suffix && !isPassword && (
        <span style={{ position: "absolute", right: 12, fontSize: 11, color: "var(--text-muted)" }}>{suffix}</span>
      )}
    </div>
  );
}

function SaveButton({ loading, onClick, label = "Save Changes" }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "9px 20px", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
      background: loading ? "var(--bg-elevated)" : "linear-gradient(135deg, #00F0FF, #8B5CF6)",
      color: loading ? "var(--text-muted)" : "#111",
      fontWeight: 700, fontSize: 13, border: "none",
      boxShadow: loading ? "none" : "0 4px 16px rgba(245,166,35,0.3)",
      transition: "all 0.2s",
    }}>
      {loading ? <Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Settings() {
  const { user, displayName, email, avatar, plan, isPro, isEnterprise } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [fullName, setFullName] = useState(displayName || "");
  const [phone, setPhone]       = useState(user?.phone || "");
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [passMsg, setPassMsg]   = useState({ text: "", type: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passSent, setPassSent] = useState(false);

  // Phone state
  const [phoneMsg, setPhoneMsg] = useState({ text: "", type: "" });
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [otpSent, setOtpSent]   = useState(false);
  const [otp, setOtp]           = useState("");

  // Subscription state
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState({ text: "", type: "" });

  // Notification state (localStorage based)
  const [notif, setNotif] = useState(() => {
    try { return JSON.parse(localStorage.getItem("notification_settings") || "{}"); }
    catch { return {}; }
  });

  // Avatar upload
  const fileRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  if (!user) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center", color: "var(--text-muted)" }}>
        <Lock size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Sign in required</div>
        <button onClick={() => navigate("/")} style={{ padding: "8px 20px", borderRadius: 10, background: "var(--accent)", color: "#111", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  // ── Handlers ────────────────────────────────────────────────

  async function handleProfileSave() {
    setProfileLoading(true);
    setProfileMsg({ text: "", type: "" });
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });
      if (error) throw error;
      setProfileMsg({ text: "Profile updated successfully.", type: "success" });
    } catch (e) {
      setProfileMsg({ text: e.message || "Update failed.", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordReset() {
    setPassLoading(true);
    setPassMsg({ text: "", type: "" });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) throw error;
      setPassSent(true);
      setPassMsg({ text: `Password reset link sent to ${email}. Check your inbox.`, type: "success" });
    } catch (e) {
      setPassMsg({ text: e.message || "Failed to send reset email.", type: "error" });
    } finally {
      setPassLoading(false);
    }
  }

  async function handlePhoneSend() {
    if (!phone.trim()) { setPhoneMsg({ text: "Please enter a phone number.", type: "error" }); return; }
    setPhoneLoading(true);
    setPhoneMsg({ text: "", type: "" });
    try {
      const { error } = await supabase.auth.updateUser({ phone: phone.trim() });
      if (error) throw error;
      setOtpSent(true);
      setPhoneMsg({ text: "Verification code sent to your phone.", type: "success" });
    } catch (e) {
      setPhoneMsg({ text: e.message || "Failed to send OTP.", type: "error" });
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleOtpVerify() {
    if (!otp.trim()) return;
    setPhoneLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "phone_change" });
      if (error) throw error;
      setPhoneMsg({ text: "Phone number verified and saved!", type: "success" });
      setOtpSent(false);
      setOtp("");
    } catch (e) {
      setPhoneMsg({ text: e.message || "Invalid code.", type: "error" });
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handlePhoneRemove() {
    setPhoneLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ phone: "" });
      if (error) throw error;
      setPhone("");
      setPhoneMsg({ text: "Phone number removed.", type: "success" });
    } catch (e) {
      setPhoneMsg({ text: e.message || "Failed to remove phone.", type: "error" });
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleAvatarUpload(file) {
    if (!file) return;
    setAvatarLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (updateError) throw updateError;
      setProfileMsg({ text: "Avatar updated! Refresh to see changes.", type: "success" });
    } catch (e) {
      setProfileMsg({ text: e.message || "Avatar upload failed.", type: "error" });
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!window.confirm("Are you sure you want to cancel your subscription? You will retain access to Pro features until the end of your current billing period.")) return;
    setCancelLoading(true);
    setCancelMsg({ text: "", type: "" });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${BASE_URL}/cancel-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to cancel subscription");
      
      setCancelMsg({ text: "Subscription will be cancelled at the end of your billing cycle. You can continue using Pro features until then.", type: "success" });
      setTimeout(() => window.location.reload(), 3000);
    } catch (e) {
      setCancelMsg({ text: e.message || "An error occurred", type: "error" });
    } finally {
      setCancelLoading(false);
    }
  }

  function toggleNotif(key) {
    const updated = { ...notif, [key]: !notif[key] };
    setNotif(updated);
    localStorage.setItem("notification_settings", JSON.stringify(updated));
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 680, color: "var(--text-primary)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Account Settings
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Manage your profile, security, and notification preferences.
        </p>
      </div>

      {/* ── PROFILE ── */}
      <Section title="Profile" icon={User}>
        <Toast message={profileMsg.text} type={profileMsg.type} />

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            {avatar
              ? <img src={avatar} style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid rgba(245,166,35,0.3)" }} />
              : <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #00F0FF, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#111" }}>
                  {displayName?.slice(0,1).toUpperCase()}
                </div>
            }
            <button
              onClick={() => fileRef.current?.click()}
              style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {avatarLoading ? <Loader size={10} style={{ animation: "spin 0.8s linear infinite", color: "var(--accent)" }} /> : <Camera size={10} style={{ color: "var(--accent)" }} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleAvatarUpload(e.target.files[0])} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{displayName}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{email}</div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 6, background: isPro || isEnterprise ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${isPro || isEnterprise ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.06)"}`, width: "fit-content" }}>
              <Crown size={10} style={{ color: isPro || isEnterprise ? "var(--accent)" : "var(--text-muted)" }} />
              <span style={{ fontSize: 11, color: isPro || isEnterprise ? "var(--accent)" : "var(--text-muted)", fontWeight: 600 }}>
                {isEnterprise ? "Enterprise" : isPro ? "Pro" : "Free"} Plan
              </span>
            </div>
          </div>
        </div>

        <Field label="Display Name">
          <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
        </Field>

        <Field label="Email Address" hint="Email cannot be changed here. Contact support.">
          <Input value={email || ""} readOnly />
        </Field>

        <SaveButton loading={profileLoading} onClick={handleProfileSave} />
      </Section>

      {/* ── SUBSCRIPTION ── */}
      {(isPro || isEnterprise) && (
        <Section title="Subscription" icon={Crown}>
          <Toast message={cancelMsg.text} type={cancelMsg.type} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: 10, background: "rgba(0,240,255,0.05)", border: "1px solid rgba(0,240,255,0.15)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", display: "flex", alignItems: "center", gap: 6 }}>
                <Crown size={14} />
                {isEnterprise ? "Enterprise Plan" : "Pro Plan"} Active
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                You currently have access to all premium features.
              </div>
            </div>
            <button
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              style={{
                padding: "8px 16px", borderRadius: 8, background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.25)",
                color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: cancelLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 6
              }}
            >
              {cancelLoading && <Loader size={12} style={{ animation: "spin 0.8s linear infinite" }} />}
              Cancel Subscription
            </button>
          </div>
        </Section>
      )}

      {/* ── SECURITY ── */}
      <Section title="Security" icon={Lock}>
        <Toast message={passMsg.text} type={passMsg.type} />

        <Field label="Password" hint="A reset link will be sent to your email address.">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Input value="••••••••••••" readOnly type="password" />
            <button
              onClick={handlePasswordReset}
              disabled={passLoading || passSent}
              style={{
                padding: "10px 16px", borderRadius: 10, whiteSpace: "nowrap",
                background: passSent ? "rgba(46,204,113,0.1)" : "var(--bg-elevated)",
                border: `1px solid ${passSent ? "rgba(46,204,113,0.3)" : "var(--border)"}`,
                color: passSent ? "#2ecc71" : "var(--text-secondary)",
                fontSize: 12, fontWeight: 600, cursor: passSent ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              }}
            >
              {passLoading
                ? <Loader size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                : passSent ? <CheckCircle size={12} /> : null
              }
              {passSent ? "Link Sent" : "Send Reset Link"}
            </button>
          </div>
        </Field>

        {/* 2FA info */}
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Two-Factor Authentication</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Add an extra layer of security to your account</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(0,240,255,0.1)", color: "var(--accent)" }}>SOON</span>
        </div>
      </Section>

      {/* ── PHONE ── */}
      <Section title="Phone Number" icon={Phone}>
        <Toast message={phoneMsg.text} type={phoneMsg.type} />

        <Field label="Phone" hint="Used for SMS alerts and two-factor authentication.">
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              disabled={otpSent}
            />
            {!otpSent ? (
              <button
                onClick={handlePhoneSend}
                disabled={phoneLoading}
                style={{ padding: "10px 16px", borderRadius: 10, whiteSpace: "nowrap", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}
              >
                {phoneLoading ? <Loader size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
                {user?.phone ? "Update" : "Add Phone"}
              </button>
            ) : (
              <button onClick={() => setOtpSent(false)} style={{ padding: "10px 14px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                Cancel
              </button>
            )}
          </div>
        </Field>

        {otpSent && (
          <Field label="Verification Code" hint="Enter the 6-digit code sent to your phone.">
            <div style={{ display: "flex", gap: 8 }}>
              <Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" />
              <button
                onClick={handleOtpVerify}
                disabled={phoneLoading || otp.length < 4}
                style={{ padding: "10px 16px", borderRadius: 10, whiteSpace: "nowrap", background: "linear-gradient(135deg, #00F0FF, #8B5CF6)", color: "#111", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", flexShrink: 0 }}
              >
                Verify
              </button>
            </div>
          </Field>
        )}

        {user?.phone && !otpSent && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(46,204,113,0.06)", border: "1px solid rgba(46,204,113,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={13} style={{ color: "#2ecc71" }} />
              <span style={{ fontSize: 12, color: "#2ecc71", fontWeight: 600 }}>Phone verified: {user.phone}</span>
            </div>
            <button onClick={handlePhoneRemove} disabled={phoneLoading} style={{ fontSize: 11, color: "#e74c3c", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              Remove
            </button>
          </div>
        )}
      </Section>

      {/* ── NOTIFICATIONS ── */}
      <Section title="Notifications" icon={Bell}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { key: "price_alerts",   label: "Price Alerts",           desc: "Get notified when your price targets are hit" },
            { key: "volume_spikes",  label: "Volume Spikes",          desc: "Alerts for unusual volume activity" },
            { key: "sound",          label: "Sound Effects",          desc: "Play sounds for important alerts" },
            { key: "browser_notif",  label: "Browser Notifications",  desc: "System-level push notifications" },
          ].map(({ key, label, desc }, i, arr) => (
            <div
              key={key}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: i < arr.length - 1 ? "1px solid var(--border-soft)" : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
              </div>
              <button
                onClick={() => toggleNotif(key)}
                style={{
                  width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                  background: notif[key] !== false ? "var(--accent)" : "var(--bg-elevated)",
                  position: "relative", transition: "background 0.2s", flexShrink: 0,
                  outline: "none",
                }}
              >
                <div style={{
                  position: "absolute", top: 3,
                  left: notif[key] !== false ? 21 : 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: notif[key] !== false ? "#111" : "var(--text-muted)",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* ── DANGER ZONE ── */}
      <Section title="Danger Zone" icon={Shield}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: "rgba(231,76,60,0.05)", border: "1px solid rgba(231,76,60,0.15)" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Delete Account</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Permanently delete your account and all data. This cannot be undone.</div>
          </div>
          <button
            onClick={() => { if (window.confirm("Are you sure? This cannot be undone.")) { /* supabase.auth.admin.deleteUser(user.id) — requires backend */ alert("Please contact support to delete your account."); } }}
            style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.25)", color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
          >
            Delete Account
          </button>
        </div>
      </Section>
    </div>
  );
}
