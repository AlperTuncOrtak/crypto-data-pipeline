// ============================================================
// components/market/Sparkline.jsx
// ============================================================
// Mini SVG line chart - tablolarda satir basina kullanilir.
// Renk iki sekilde belirlenebilir:
//  - Eger trendOverride verilmisse ('up' / 'down'): o renk kullanilir.
//    Ornek: tablo dis dunyada 24h % degisimini biliyor, sparkline'in da
//    onunla tutarli olmasi icin disardan trend zorlanir.
//  - Verilmemisse: ilk vs son fiyat karsilastirilarak otomatik hesaplanir.
//
// Props:
//  - prices: [{price, time}] dizisi (backend'den geldigi sekilde)
//  - width: SVG genisligi (default 120)
//  - height: SVG yuksekligi (default 40)
//  - trendOverride: 'up' | 'down' | undefined - rengi disardan zorla
// ============================================================


export default function Sparkline({ prices, width = 120, height = 40, trendOverride }) {
  // Veri yoksa veya tek nokta varsa bos render et
  if (!prices || prices.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-slate-600 text-xs"
      >
        —
      </div>
    )
  }


  // Sadece fiyatlari al (zaman gerekmez, sirayla x ekseni cizilir)
  const values = prices.map((p) => p.price)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1   // bolme hatasini engelle (eger duz cizgi ise)


  // Trend yonu: disardan verilmisse onu kullan, yoksa hesapla
  let isUp
  if (trendOverride === 'up') {
    isUp = true
  } else if (trendOverride === 'down') {
    isUp = false
  } else {
    isUp = values[values.length - 1] >= values[0]
  }

  const stroke = isUp ? '#34d399' : '#f87171'   // emerald-400 / red-400
  const fill = isUp ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)'


  // Her noktayi SVG koordinatina cevir
  // x: indekse gore esit araliklarla yayilir (0 -> width)
  // y: fiyat min-max arasinda normalize edilir, sonra ters cevrilir
  //    (SVG'de y=0 yukarida, biz fiyat yukseldikce yukari gostermek istiyoruz)
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })


  // Line path (sadece cizgi)
  const linePath = `M ${points.join(' L ')}`

  // Area path (cizginin altinda hafif dolgu)
  const areaPath = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`


  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {/* Hafif arka plan dolgusu */}
      <path d={areaPath} fill={fill} />

      {/* Asil cizgi */}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}