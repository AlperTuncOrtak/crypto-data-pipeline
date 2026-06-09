import re

filepath = 'frontend/src/pages/Landing.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Hero Stats
old_hero_stats = '''        <div
          style={{
            marginTop: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeUp .55s ease .4s both",
          }}
        >'''
new_hero_stats = '''        <div
          className="flex-wrap"
          style={{
            marginTop: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            animation: "fadeUp .55s ease .4s both",
          }}
        >'''
content = content.replace(old_hero_stats, new_hero_stats)

# Remove the hardcoded borderRight from hero stats
old_hero_border = '''                borderRight: i < 3 ? "1px solid rgba(255,255,255,.07)" : "none",'''
new_hero_border = '''                /* border removed for wrap support */'''
content = content.replace(old_hero_border, new_hero_border)


# 2. Steps section
old_steps = '''        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 24,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",'''
new_steps = '''        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{
            gap: 24,
            position: "relative",
          }}
        >
          <div
            className="hidden md:block"
            style={{
              position: "absolute",'''
content = content.replace(old_steps, new_steps)

# 3. Feature Grid
old_features = '''        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 14,
          }}
        >'''
new_features = '''        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{
            gap: 14,
          }}
        >'''
content = content.replace(old_features, new_features)

# 4. Pricing
old_pricing = '''        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >'''
new_pricing = '''        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 14 }}
        >'''
content = content.replace(old_pricing, new_pricing)

with open(filepath, 'w') as f:
    f.write(content)
print("Replacements complete!")
