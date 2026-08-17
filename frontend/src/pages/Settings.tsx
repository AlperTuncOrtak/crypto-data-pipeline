import { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { supabase } from "../lib/supabase";
import {
  User, Mail, Phone, Lock, Bell, Shield,
  CheckCircle, AlertTriangle, Loader, Camera,
  Eye, EyeOff, Crown, Sun, Moon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

// ── Helpers ───────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: string }) {
  if (!message) return null;
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle : AlertTriangle;
  return (
    <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-[14px] mb-6 font-medium ${
      isSuccess ? "bg-[var(--positive)]/10 border-[var(--positive)]/20 text-[var(--positive)]" : "bg-[var(--negative)]/10 border-[var(--negative)]/20 text-[var(--negative)]"
    }`}>
      <Icon size={16} className="shrink-0" />
      {message}
    </div>
  );
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} 
      className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden mb-8"
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border-subtle)] bg-white/[0.01]">
        <Icon size={16} className="text-[var(--accent)]" />
        <span className="text-[14px] font-bold text-[var(--text-main)] tracking-[0.02em]">
          {title}
        </span>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

function Field({ label, children, hint }: any) {
  return (
    <div className="mb-6">
      <label className="block text-[13px] font-bold text-[var(--text-muted)] mb-2 tracking-wide uppercase">
        {label}
      </label>
      {children}
      {hint && <div className="text-[12px] text-[var(--text-muted)] mt-2">{hint}</div>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", disabled, readOnly, suffix }: any) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="relative flex items-center w-full">
      <input
        type={isPassword && showPass ? "text" : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`w-full px-5 py-3.5 rounded-2xl border text-[14px] outline-none transition-all ${
          readOnly || disabled 
            ? "bg-white/5 border-transparent text-[var(--text-muted)] cursor-not-allowed" 
            : "bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-main)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
        }`}
        style={{ paddingRight: isPassword || suffix ? 44 : 20 }}
      />
      {isPassword && (
        <button onClick={() => setShowPass(s => !s)} className="absolute right-4 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors bg-transparent border-none cursor-pointer flex">
          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
      {suffix && !isPassword && (
        <span className="absolute right-4 text-[12px] text-[var(--text-muted)] font-medium">{suffix}</span>
      )}
    </div>
  );
}

function SaveButton({ loading, onClick, label = "Save Changes" }: any) {
  return (
    <button 
      onClick={onClick} 
      disabled={loading} 
      className={`flex items-center justify-center gap-2 px-6 py-3.5 w-full md:w-auto rounded-full text-[14px] font-bold transition-all duration-200 ${
        loading 
          ? "bg-white/5 text-[var(--text-muted)] cursor-not-allowed shadow-none" 
          : "bg-[var(--accent)] text-[var(--text-main)] hover:bg-[var(--accent-hover)] shadow-[0_0_20px_var(--accent)]"
      }`}
    >
      {loading && <Loader size={16} className="animate-spin" />}
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function Settings() {
  const { user, displayName, email, avatar, plan, isPro, isEnterprise } = useAuth();
  const { theme, setTheme, accent, setAccent } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  // Notification state
  const [notif, setNotif] = useState(() => {
    try { return JSON.parse(localStorage.getItem("notification_settings") || "{}"); }
    catch { return {}; }
  });

  // Avatar upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  if (!user) {
    return (
      <div className="max-w-[600px] mx-auto mt-20 text-center text-white/50">
        <Lock size={32} className="mx-auto mb-3 opacity-30" />
        <div className="text-base font-bold mb-2 text-[var(--text-main)]">{t("settings.signin_required")}</div>
        <button onClick={() => navigate("/")} className="px-5 py-2 rounded-3xl bg-[var(--accent)] text-white font-bold text-[13px]">
          {t("settings.go_to_dashboard")}
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
      setProfileMsg({ text: t("settings.profile_updated"), type: "success" });
    } catch (e: any) {
      setProfileMsg({ text: e.message || t("settings.update_failed"), type: "error" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordReset() {
    setPassLoading(true);
    setPassMsg({ text: "", type: "" });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email!, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) throw error;
      setPassSent(true);
      setPassMsg({ text: t("settings.pass_reset_sent", { email }), type: "success" });
    } catch (e: any) {
      setPassMsg({ text: e.message || t("settings.pass_reset_failed"), type: "error" });
    } finally {
      setPassLoading(false);
    }
  }

  async function handlePhoneSend() {
    if (!phone.trim()) { setPhoneMsg({ text: t("settings.phone_enter"), type: "error" }); return; }
    setPhoneLoading(true);
    setPhoneMsg({ text: "", type: "" });
    try {
      const { error } = await supabase.auth.updateUser({ phone: phone.trim() });
      if (error) throw error;
      setOtpSent(true);
      setPhoneMsg({ text: t("settings.otp_sent"), type: "success" });
    } catch (e: any) {
      setPhoneMsg({ text: e.message || t("settings.otp_failed"), type: "error" });
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
      setPhoneMsg({ text: t("settings.phone_verified_success"), type: "success" });
      setOtpSent(false);
      setOtp("");
    } catch (e: any) {
      setPhoneMsg({ text: e.message || t("settings.invalid_code"), type: "error" });
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
      setPhoneMsg({ text: t("settings.phone_removed"), type: "success" });
    } catch (e: any) {
      setPhoneMsg({ text: e.message || t("settings.phone_remove_failed"), type: "error" });
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!file) return;
    setAvatarLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user!.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (updateError) throw updateError;
      setProfileMsg({ text: t("settings.avatar_updated"), type: "success" });
    } catch (e: any) {
      setProfileMsg({ text: e.message || t("settings.avatar_failed"), type: "error" });
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!window.confirm(t("settings.cancel_confirm"))) return;
    setCancelLoading(true);
    setCancelMsg({ text: "", type: "" });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const BASE_URL = import.meta.env.VITE_API_URL || "https://api.cryptoneko.online";
      const res = await fetch(`${BASE_URL}/cancel-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("settings.cancel_failed"));
      
      setCancelMsg({ text: t("settings.cancel_success"), type: "success" });
      setTimeout(() => window.location.reload(), 3000);
    } catch (e: any) {
      setCancelMsg({ text: e.message || t("settings.error_occurred"), type: "error" });
    } finally {
      setCancelLoading(false);
    }
  }

  function toggleNotif(key: string) {
    const currentValue = notif[key] !== false; // Default is true
    const updated = { ...notif, [key]: !currentValue };
    setNotif(updated);
    localStorage.setItem("notification_settings", JSON.stringify(updated));
  }

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] pt-24 pb-32 px-6 lg:px-12 overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40"><div className="w-[800px] h-[300px] bg-[var(--accent)] blur-[150px] rounded-[100%] opacity-30 absolute -top-[100px] left-[10%]"></div><div className="w-[600px] h-[250px] bg-[var(--accent-hover)] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div></div>

      <div className="max-w-[720px] mx-auto relative z-20">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight m-0 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
            {t("settings.title")}
          </h1>
          <p className="text-sm font-medium text-white/50">
            {t("settings.subtitle")}
          </p>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="show">
          
          {/* ── PROFILE ── */}
          <Section title={t("settings.profile")} icon={User}>
            <Toast message={profileMsg.text} type={profileMsg.type} />

            {/* Avatar */}
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                {avatar
                  ? <img src={avatar} className="w-[80px] h-[80px] rounded-full object-cover border-4 border-[var(--bg-base)] shadow-xl" />
                  : <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-3xl font-black text-[var(--text-main)] shadow-xl">
                      {displayName?.slice(0,1).toUpperCase()}
                    </div>
                }
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-base)] flex items-center justify-center cursor-pointer hover:bg-[var(--border-base)] transition-colors shadow-lg"
                >
                  {avatarLoading ? <Loader size={14} className="animate-spin text-[var(--accent)]" /> : <Camera size={14} className="text-[var(--accent)]" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleAvatarUpload(e.target.files?.[0] as File)} />
              </div>
              <div>
                <div className="text-[20px] font-bold text-[var(--text-main)] mb-1">{displayName}</div>
                <div className="text-[14px] font-medium text-[var(--text-muted)] mb-3">{email}</div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-fit border text-[12px] font-bold tracking-wide uppercase ${
                  isPro || isEnterprise 
                    ? "bg-purple-600/10 border-purple-500/20 text-purple-400" 
                    : "bg-white/5 border-[var(--border-base)] text-[var(--text-muted)]"
                }`}>
                  <Crown size={14} />
                  {t("settings.plan_active", { plan: isEnterprise ? "Enterprise" : isPro ? "Pro" : "Free" })}
                </div>
              </div>
            </div>

            <Field label={t("settings.display_name")}>
              <Input value={fullName} onChange={(e: any) => setFullName(e.target.value)} placeholder={t("settings.full_name_placeholder")} />
            </Field>

            <Field label={t("settings.email_address")} hint={t("settings.email_hint")}>
              <Input value={email || ""} readOnly />
            </Field>

            <div className="mt-6">
              <SaveButton loading={profileLoading} onClick={handleProfileSave} label={t("settings.save_changes")} />
            </div>
          </Section>

          {/* ── SUBSCRIPTION ── */}
          {(isPro || isEnterprise) && (
            <Section title={t("settings.subscription")} icon={Crown}>
              <Toast message={cancelMsg.text} type={cancelMsg.type} />
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-purple-600/5 border border-purple-500/20 shadow-inner">
                <div className="mb-4 md:mb-0">
                  <div className="text-[16px] font-bold text-purple-400 flex items-center gap-2 mb-1.5">
                    <Crown size={18} />
                    {t("settings.plan_active", { plan: isEnterprise ? "Enterprise" : "Pro" })}
                  </div>
                  <div className="text-[13px] font-medium text-purple-300/70">
                    {t("settings.premium_access")}
                  </div>
                </div>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-3xl bg-[var(--negative)]/10 border border-[var(--negative)]/20 text-red-500 text-[13px] font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelLoading && <Loader size={14} className="animate-spin" />}
                  {t("settings.cancel_subscription")}
                </button>
              </div>
            </Section>
          )}

          {/* ── SECURITY ── */}
          <Section title={t("settings.security")} icon={Lock}>
            <Toast message={passMsg.text} type={passMsg.type} />

            <Field label={t("settings.password")} hint={t("settings.pass_hint")}>
              <div className="flex items-center gap-3">
                <Input value="••••••••••••" readOnly type="password" />
                <button
                  onClick={handlePasswordReset}
                  disabled={passLoading || passSent}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-3xl whitespace-nowrap text-xs font-bold transition-colors border shrink-0 ${
                    passSent 
                      ? "bg-green-500/10 border-green-500/30 text-green-500 cursor-default" 
                      : "bg-white/5 border-[var(--border-base)] text-white/70 hover:bg-[var(--border-base)] hover:text-[var(--text-main)] cursor-pointer"
                  }`}
                >
                  {passLoading ? <Loader size={12} className="animate-spin" /> : passSent ? <CheckCircle size={12} /> : null}
                  {passSent ? t("settings.link_sent") : t("settings.send_reset")}
                </button>
              </div>
            </Field>

            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between mt-4">
              <div>
                <div className="text-[14px] font-bold text-[var(--text-main)] mb-1.5">{t("settings.2fa")}</div>
                <div className="text-[12px] font-medium text-[var(--text-muted)]">{t("settings.2fa_desc")}</div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] tracking-wider uppercase border border-[var(--accent)]/20">
                SOON
              </span>
            </div>
          </Section>

          {/* ── PHONE ── */}
          <Section title={t("settings.phone_number")} icon={Phone}>
            <Toast message={phoneMsg.text} type={phoneMsg.type} />

            <Field label={t("settings.phone_label")} hint={t("settings.phone_hint")}>
              <div className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(e: any) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  disabled={otpSent}
                />
                {!otpSent ? (
                  <button
                    onClick={handlePhoneSend}
                    disabled={phoneLoading}
                    className="flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-2xl whitespace-nowrap bg-white/5 border border-[var(--border-base)] text-[var(--text-main)] hover:bg-[var(--border-base)] hover:border-white/20 text-[13px] font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {phoneLoading && <Loader size={14} className="animate-spin" />}
                    {user?.phone ? t("settings.update") : t("settings.add_phone")}
                  </button>
                ) : (
                  <button onClick={() => setOtpSent(false)} className="px-4 py-2.5 rounded-3xl bg-transparent border border-[var(--border-base)] text-white/50 hover:text-[var(--text-main)] text-xs font-bold transition-colors cursor-pointer shrink-0">
                    {t("settings.cancel")}
                  </button>
                )}
              </div>
            </Field>

            {otpSent && (
              <Field label={t("settings.otp_label")} hint={t("settings.otp_hint")}>
                <div className="flex gap-2 mt-4">
                  <Input value={otp} onChange={(e: any) => setOtp(e.target.value)} placeholder="123456" />
                  <button
                    onClick={handleOtpVerify}
                    disabled={phoneLoading || otp.length < 4}
                    className="px-6 py-3.5 rounded-2xl whitespace-nowrap bg-[var(--accent)] text-[var(--text-main)] hover:bg-[var(--accent-hover)] font-bold text-[13px] shrink-0 disabled:opacity-50 shadow-[0_0_20px_var(--accent)] transition-all"
                  >
                    {t("settings.verify")}
                  </button>
                </div>
              </Field>
            )}

            {user?.phone && !otpSent && (
              <div className="flex items-center justify-between p-3.5 rounded-3xl bg-green-500/5 border border-green-500/20 mt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-xs font-bold text-green-500">{t("settings.phone_verified")} {user.phone}</span>
                </div>
                <button onClick={handlePhoneRemove} disabled={phoneLoading} className="text-[11px] font-bold text-red-500 hover:text-[var(--negative)] bg-transparent border-none cursor-pointer">
                  {t("settings.remove")}
                </button>
              </div>
            )}
          </Section>

          {/* ── NOTIFICATIONS ── */}
          <Section title={t("settings.notifications")} icon={Bell}>
            <div className="flex flex-col">
              {[
                { key: "price_alerts",   label: t("settings.price_alerts"),           desc: t("settings.price_alerts_desc") },
                { key: "volume_spikes",  label: t("settings.volume_spikes"),          desc: t("settings.volume_spikes_desc") },
                { key: "sound",          label: t("settings.sound"),                  desc: t("settings.sound_desc") },
                { key: "browser_notif",  label: t("settings.browser_notif"),          desc: t("settings.browser_notif_desc") },
              ].map(({ key, label, desc }, i, arr) => (
                <div
                  key={key}
                  className={`flex items-center justify-between py-5 ${i < arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""}`}
                >
                  <div>
                    <div className="text-[14px] font-bold text-[var(--text-main)] mb-1.5">{label}</div>
                    <div className="text-[12px] font-medium text-[var(--text-muted)]">{desc}</div>
                  </div>
                  <button
                    onClick={() => toggleNotif(key)}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 outline-none border ${
                      notif[key] !== false ? "bg-[var(--accent)] border-[var(--accent)]" : "bg-[var(--bg-elevated)] border-[var(--border-base)]"
                    }`}
                  >
                    <div className={`absolute top-[2px] w-[18px] h-[18px] rounded-full transition-all duration-300 shadow-md ${
                      notif[key] !== false ? "left-[26px] bg-white" : "left-[3px] bg-gray-400"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* ── APPEARANCE ── */}
          <Section title={t("settings.appearance")} icon={theme === 'light' ? Sun : Moon}>
            <div className="flex flex-col gap-8">
              
              {/* Accent Color Picker */}
              <div>
                <div className="text-xs font-bold text-white/50 mb-3 tracking-wider uppercase">
                  {t("settings.accent_color") || "Accent Color"}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { id: "zinc", color: "#71717a" },
                    { id: "purple", color: "#7c3aed" },
                    { id: "blue", color: "#2563eb" },
                    { id: "emerald", color: "#10b981" },
                    { id: "rose", color: "#e11d48" },
                    { id: "amber", color: "#d97706" },
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setAccent(c.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 outline-none"
                      style={{
                        background: c.color,
                        boxShadow: accent === c.id ? `0 0 0 2px #19191c, 0 0 0 4px ${c.color}` : "none",
                      }}
                    >
                      {accent === c.id && <CheckCircle size={16} className="text-[var(--text-main)] drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Mode Picker */}
              <div>
                <div className="text-xs font-bold text-white/50 mb-3 tracking-wider uppercase">
                  {t("settings.theme_mode") || "Theme Mode"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  
                  <button
                    onClick={() => setTheme('midnight')}
                    className={`p-5 rounded-3xl text-left transition-all duration-300 border-2 ${
                      theme === 'midnight' ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_0_20px_var(--accent)]" : "border-[var(--border-subtle)] bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Moon size={18} className={theme === 'midnight' ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
                        <span className={`text-[14px] font-bold ${theme === 'midnight' ? "text-[var(--accent)]" : "text-gray-300"}`}>Midnight</span>
                      </div>
                      {theme === 'midnight' && <CheckCircle size={16} className="text-[var(--accent)]" />}
                    </div>
                    <div className="rounded-3xl overflow-hidden border border-[var(--border-subtle)] shadow-inner">
                      <div className="bg-[var(--bg-base)] h-3 border-b border-[var(--border-subtle)]" />
                      <div className="bg-[var(--bg-base)] h-10 flex items-center gap-2 px-3">
                        <div className="h-2 rounded-full bg-[var(--accent)] w-4" />
                        <div className="h-2 rounded-full bg-white/10 w-6" />
                      </div>
                    </div>
                  </button>

                  {/* Dark Mode Card */}
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-5 rounded-3xl text-left transition-all duration-300 border-2 ${
                      theme === 'dark' ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_0_20px_var(--accent)]" : "border-[var(--border-subtle)] bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Moon size={18} className={theme === 'dark' ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
                        <span className={`text-[14px] font-bold ${theme === 'dark' ? "text-[var(--accent)]" : "text-gray-300"}`}>Dark</span>
                      </div>
                      {theme === 'dark' && <CheckCircle size={16} className="text-[var(--accent)]" />}
                    </div>
                    <div className="rounded-3xl overflow-hidden border border-[var(--border-subtle)] shadow-inner">
                      <div className="bg-[var(--bg-subtle)] h-3 border-b border-[var(--border-subtle)]" />
                      <div className="bg-[var(--bg-subtle)] h-10 flex items-center gap-2 px-3">
                        <div className="h-2 rounded-full bg-[var(--accent)] w-4" />
                        <div className="h-2 rounded-full bg-white/10 w-6" />
                      </div>
                    </div>
                  </button>

                  {/* Light Mode Card */}
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-5 rounded-3xl text-left transition-all duration-300 border-2 ${
                      theme === 'light' ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_0_20px_var(--accent)]" : "border-[var(--border-subtle)] bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sun size={18} className={theme === 'light' ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
                        <span className={`text-[14px] font-bold ${theme === 'light' ? "text-[var(--accent)]" : "text-gray-300"}`}>Light</span>
                      </div>
                      {theme === 'light' && <CheckCircle size={16} className="text-[var(--accent)]" />}
                    </div>
                    <div className="rounded-3xl overflow-hidden border border-black/10 shadow-inner">
                      <div className="bg-[var(--bg-subtle)] h-3 border-b border-black/5" />
                      <div className="bg-[var(--bg-base)] h-10 flex items-center gap-2 px-3">
                        <div className="h-2 rounded-full bg-[var(--accent)] w-4" />
                        <div className="h-2 rounded-full bg-black/10 w-6" />
                      </div>
                    </div>
                  </button>

                </div>
              </div>
            </div>
          </Section>

          {/* ── DANGER ZONE ── */}
          <Section title={t("settings.danger_zone")} icon={Shield}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl bg-[var(--negative)]/5 border border-[var(--negative)]/20 mt-2">
              <div className="mb-4 sm:mb-0">
                <div className="text-[15px] font-bold text-[var(--text-main)] mb-1.5">{t("settings.delete_account")}</div>
                <div className="text-[13px] font-medium text-[var(--text-muted)]">{t("settings.delete_account_desc")}</div>
              </div>
              <button
                onClick={() => { if (window.confirm(t("settings.delete_confirm"))) { alert(t("settings.delete_support")); } }}
                className="px-6 py-3 rounded-3xl bg-[var(--negative)]/10 border border-[var(--negative)]/20 text-[var(--negative)] hover:bg-[var(--negative)]/20 text-[13px] font-bold transition-all whitespace-nowrap shrink-0"
              >
                {t("settings.delete_account")}
              </button>
            </div>
          </Section>

        </motion.div>
      </div>
    </div>
  );
}


