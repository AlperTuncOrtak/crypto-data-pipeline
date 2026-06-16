import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

export default function CryptoNews({ symbol }: { symbol?: string }) {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We use CryptoCompare News API for reliable crypto news
    const url = symbol 
      ? `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${symbol.toUpperCase()}`
      : 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.Data && data.Data.length > 0) {
          // Limit to top 5 news items
          const formattedNews = data.Data.slice(0, 5).map((item: any) => ({
            id: item.id || item.guid,
            url: item.url || item.guid,
            imageurl: item.imageurl || null,
            source: item.source_info?.name || item.source,
            published_on: item.published_on,
            title: item.title,
            body: item.body
          }));
          setNews(formattedNews);
        } else {
          setNews([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch news", err);
        setLoading(false);
      });
  }, [symbol]);

  if (loading) {
    return (
      <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 13, textAlign: "center", border: "1px solid var(--border)", borderRadius: 12, background: "var(--border-soft)" }}>
        Loading latest news...
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 13, textAlign: "center", border: "1px solid var(--border)", borderRadius: 12, background: "var(--border-soft)" }}>
        No recent news found{symbol ? ` for ${symbol.toUpperCase()}` : ''}.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {news.map((item, idx) => (
        <a 
          key={item.id || idx} 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            display: "flex", 
            gap: 16, 
            padding: 16, 
            background: "var(--bg-surface)", 
            border: "1px solid var(--border)",
            borderRadius: 16,
            textDecoration: "none",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--border)";
            e.currentTarget.style.borderColor = "var(--accent-soft)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "var(--bg-surface)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          {item.imageurl && (
            <img 
              src={item.imageurl} 
              alt="" 
              style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {item.source_info?.name || item.source}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {new Date(item.published_on * 1000).toLocaleDateString()}
              </div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.4 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>
              {item.body}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
