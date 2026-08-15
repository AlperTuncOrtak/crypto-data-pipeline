---
name: Crypto Data Pipeline
description: Elit Kripto Veri ve Analiz Terminali
colors:
  primary: "#3b82f6"
  accent-glow: "#60a5fa"
  neutral-bg: "#19191c"
  surface: "#27272a"
  surface-hover: "#3f3f46"
  text-primary: "#ffffff"
  text-secondary: "#a1a1aa"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card-base:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
---

# Design System: Crypto Data Pipeline

## 1. Overview

**Creative North Star: "The Cinematic Terminal"**

Bu sistem, karmaşık finansal verileri ultra-modern, sinematik ve elit bir terminal havasında sunar. Göz yormayan koyu bir arka plan (`#19191c`) üzerine inşa edilmiştir. "Glassmorphism" (cam efekti) ve yumuşak parlamalar (glow) kullanılarak, verilerin ve uyarıların adeta ekrandan dışarı taşması sağlanır. Sistem, sıradan beyaz/gri SaaS şablonlarını ve sıkışık veri tablolarını tamamen reddeder.

**Key Characteristics:**
- Derinlik hissi veren koyu arka planlar.
- Kritik noktalarda kullanılan yumuşak ve dikkat çekici neon parlamalar.
- Sade, geniş boşluklu (breathing room) "Bento Box" düzenleri.

## 2. Colors

Karanlık bir zemin üzerinde, verinin kendisini parlatacak kadar sessiz bir palet.

### Primary
- **Blue Accent** (#3b82f6): Butonlar, aktif sekmeler ve veri vurguları için.
- **Cyan Glow** (#60a5fa): Hover efektlerinde ve kritik grafik noktalarında sinematik parlama yaratmak için.

### Neutral
- **Deep Void** (#19191c): Ana arka plan. Asla tam siyah (`#000`) kullanılmaz.
- **Glass Surface** (#27272a): Kart ve modalların arka planı (genellikle opacity ile kullanılır).
- **Starlight Text** (#ffffff): Birincil başlıklar ve kritik değerler.
- **Muted Dust** (#a1a1aa): Alt başlıklar, ikincil metinler ve eksen etiketleri.

### Named Rules
**The Background Glow Rule.** Renkli vurgular asla büyük bloklar halinde kullanılmaz; sadece ince çizgilerde, ikonlarda veya arka planda çok düşük opacity (örn: `%10-%20`) ile yumuşak bir parlama (glow) olarak yer alır.

## 3. Typography

**Display Font:** Inter (with system-ui)
**Body Font:** Inter (with system-ui)

**Character:** Keskin, teknolojik, okunaklı ve tamamen işlevsel. Sayılar ve finansal veriler için kusursuz bir tercih.

### Hierarchy
- **Display** (700, clamp(2rem, 5vw, 4rem), 1.1): Sadece ana sayfa karşılama mesajı veya devasa istatistikler için.
- **Headline** (600, 1.5rem, 1.2): Kart başlıkları ve modal başlıkları.
- **Body** (400, 1rem, 1.6): Standart açıklama metinleri.
- **Label** (500, 0.875rem, uppercase): Küçük veri etiketleri, tablo başlıkları.

## 4. Elevation

Sistem, geleneksel siyah gölgeler (drop-shadow) yerine tonal katmanlaşma ve renkli glow (parlama) ile derinlik yaratır.

### Shadow Vocabulary
- **Card Glow** (`box-shadow: 0 0 20px rgba(59, 130, 246, 0.1)`): Aktif kartların veya hover durumundaki panellerin altına uygulanan hafif mavi parlama.

### Named Rules
**The Glass Border Rule.** Derinlik yaratmak için kartların etrafına her zaman çok ince, yarı saydam bir beyaz sınır (örn: `border-white/10`) eklenir.

## 5. Components

### Cards (Bento Box)
- **Corner Style:** 16px (lg)
- **Background:** `surface` renginin saydam hali (örn: `bg-[#27272a]/80`) + `backdrop-blur-md`
- **Border:** `border border-white/5`
- **Internal Padding:** 24px (lg)

### Buttons
- **Shape:** 9999px (Tam yuvarlak / Pill shape)
- **Primary:** `primary` arka plan + `text-primary`.
- **Hover:** Daha açık bir maviye geçiş ve hafif yukarı kayma (transform translateY).

### Modal (Fear & Greed Modal)
- **Style:** Ekranın merkezinde, etrafı karartılmış (backdrop-blur-sm) ve `Glass Surface` arka planına sahip kutu. İnce kenarlıklar ve `Card Glow` gölgesi içerir.

## 6. Do's and Don'ts

### Do:
- **Do** veri panellerini birbirinden ayırmak için Bento Box (yuvarlatılmış cam kartlar) düzenini kullan.
- **Do** finansal verilerin rahat okunması için `Label` tipografisini hafif gri (Muted Dust) ve uppercase olarak kullan.
- **Do** Hover ve Focus durumlarında çok hafif, yumuşak animasyonlar (örneğin 0.2s ease-out) kullan.

### Don't:
- **Don't** asla düz, opak beyaz veya açık gri arka planlar kullanma. (Standart SaaS görünümünden kaçın).
- **Don't** içi içe geçmiş (kart içinde kart) tasarımlar yapma. Her kart ana zemin üzerinde durmalıdır.
- **Don't** geleneksel, sert siyah alt gölgeler kullanma. Derinliği `backdrop-blur` ve ince `border` ile sağla.
- **Don't** metin renklerini arka planla aynı doygunlukta tutma, okunabilirlik her zaman yüksek kontrastlı olmalıdır.
