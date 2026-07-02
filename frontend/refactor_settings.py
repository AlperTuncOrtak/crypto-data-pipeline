import re

with open('src/pages/Settings.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update the Main Wrapper & Inject Cinematic Glow
# We'll inject Framer Motion
if "import { motion }" not in c:
    c = c.replace('import { useNavigate } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";\nimport { motion } from "framer-motion";')

old_main_return = '''  return (
    <div style={{ maxWidth: 680, color: "var(--text-primary)" }}>
      <style>{@keyframes spin { to { transform: rotate(360deg) } }}</style>'''

new_main_return = '''  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <div className="relative min-h-screen bg-[#0d0d0f] text-white pt-24 pb-32 px-6 lg:px-12 overflow-x-hidden">
      {/* ── CINEMATIC GLOW BACKGROUND ── */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-[100%] blur-[150px] opacity-[0.2] mix-blend-screen transition-colors duration-1000"
          style={{ background: adial-gradient(ellipse at top, var(--accent), transparent 70%) }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d0f]/90 to-[#0d0d0f] z-10" />
      </div>

      <div className="max-w-[720px] mx-auto relative z-20">
        <style>{@keyframes spin { to { transform: rotate(360deg) } }}</style>'''

c = c.replace(old_main_return, new_main_return)

# Wait, Settings.tsx doesn't end with exactly </div>);} it ends with:
#     </div>
#   );
# }
c = re.sub(r'    </div>\s*\);\s*\}\s*$', '      </div>\n    </div>\n  );\n}', c)

# 2. Refactor Components
# Section component
old_section = '''function Section({ title, icon: Icon, children }) {
  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: 16, overflow: "hidden", marginBottom: 16,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)"
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "16px 20px", borderBottom: "1px solid var(--border)",
        background: "var(--border-soft)",
      }}>'''
new_section = '''function Section({ title, icon: Icon, children }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} className="bg-[#19191c]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[1.5rem] overflow-hidden mb-6">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/5 bg-white/[0.02]">'''
c = c.replace(old_section, new_section)

# Section title styling
c = c.replace(
    '''<span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>''',
    '''<span className="text-[13px] font-bold text-white/70 uppercase tracking-[0.06em]">'''
)

# Section inner padding
c = c.replace('''<div style={{ padding: "20px" }}>{children}</div>''', '''<div className="p-6">{children}</div>''')
c = c.replace('''</div >''', '''</div>''')

# Wrap the main body sections with motion
old_motion_wrap = '''      {/* ── PROFILE ── */}
      <Section title={t("settings.profile")} icon={User}>'''
new_motion_wrap = '''      {/* ── PROFILE ── */}
      <motion.div variants={containerVariants} initial="hidden" animate="show">
      <Section title={t("settings.profile")} icon={User}>'''
c = c.replace(old_motion_wrap, new_motion_wrap)

# Wrap end
old_danger_end = '''      </Section>
    </div>'''
new_danger_end = '''      </Section>
      </motion.div>
    </div>'''
c = c.replace(old_danger_end, new_danger_end)

# Field component
old_field = '''function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, letterSpacing: "0.04em" }}>'''
new_field = '''function Field({ label, children, hint }) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-bold text-white/50 mb-2 tracking-wider">'''
c = c.replace(old_field, new_field)
c = c.replace('''{hint && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, opacity: 0.7 }}>{hint}</div>}''', '''{hint && <div className="text-[11px] text-white/40 mt-1.5">{hint}</div>}''')

with open('src/pages/Settings.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
