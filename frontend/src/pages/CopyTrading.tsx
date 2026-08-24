import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Loader2,
  AlertTriangle,
  Check,
  ExternalLink,
  Wallet,
  Info,
} from "lucide-react";
import { apiClient } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

type Holding = { symbol: string; chain: string; usd_value: number };

type Stats = {
  concentration: number | null;
  stable_pct: number | null;
  chain_count: number;
};

type Leader = {
  id: number;
  address: string;
  label: string;
  note: string | null;
  style: string | null;
  stats: Stats | null;
  available: boolean;
  reason: string | null;
  total_usd: number | null;
  top_holdings: Holding[];
  synced_at: string | null;
  is_following: boolean;
  allocation_usd: number | null;
};

const usd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toFixed(0)}`;

const shortAddress = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

/**
 * Kullanici bir KISI degil bir TARZ secsin diye. Etiketler elle veriliyor;
 * otomatik siniflandirma islem gecmisi olmadan tahmin olurdu.
 */
const STYLES: Record<
  string,
  { icon: string; label: string; blurb: string; className: string }
> = {
  calm: {
    icon: "🐢",
    label: "Calm",
    blurb: "Mostly holds major coins, trades rarely",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  active: {
    icon: "⚡",
    label: "Active",
    blurb: "Trades often, moderate risk",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  aggressive: {
    icon: "🎲",
    label: "Aggressive",
    blurb: "Buys small altcoins, high risk",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

const WELCOME_KEY = "cryptoneko_copy_welcome_seen";

/**
 * Rozetler yalnizca elimizdeki bakiye verisinden turetiliyor. Performans
 * ya da kar iddiasi YOK — o rakam olculmeden yazilirsa uydurma olur.
 */
function riskBadges(stats: Stats | null) {
  if (!stats) return [];
  const out: { text: string; tone: "warn" | "calm" | "plain" }[] = [];

  if (stats.concentration !== null) {
    const pct = Math.round(stats.concentration * 100);
    out.push({
      text: `${pct}% in one coin`,
      tone: pct >= 80 ? "warn" : "plain",
    });
  }
  if (stats.stable_pct !== null && stats.stable_pct >= 0.2) {
    out.push({
      text: `${Math.round(stats.stable_pct * 100)}% stablecoins`,
      tone: "calm",
    });
  }
  if (stats.chain_count > 0) {
    out.push({
      text: `${stats.chain_count} chain${stats.chain_count > 1 ? "s" : ""}`,
      tone: "plain",
    });
  }
  return out;
}

const BADGE_TONE = {
  warn: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  calm: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  plain:
    "bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border-subtle)]",
};

export default function CopyTrading() {
  const { isLoggedIn } = useAuth();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ address: "", label: "" });
  const [adding, setAdding] = useState(false);
  const [styleFilter, setStyleFilter] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem(WELCOME_KEY),
  );

  const dismissWelcome = () => {
    localStorage.setItem(WELCOME_KEY, "1");
    setShowWelcome(false);
  };

  const shown = styleFilter
    ? leaders.filter((l) => l.style === styleFilter)
    : leaders;

  const load = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/copy/leaders");
      setLeaders(data.leaders || []);
      setRefreshing(data.refreshing || 0);
      setError(null);
    } catch (e: any) {
      // Sahte listeye dusmuyoruz — ne oldugunu soyluyoruz.
      setError(
        e?.response?.data?.detail ||
          "Could not load the whale list. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, isLoggedIn]);

  const toggleFollow = async (leader: Leader) => {
    if (!isLoggedIn) {
      window.dispatchEvent(new Event("open-login"));
      return;
    }
    setBusyId(leader.id);
    try {
      if (leader.is_following) {
        await apiClient.post("/copy/unfollow", { leader_id: leader.id });
        toast.success(`Stopped following ${leader.label}`);
      } else {
        await apiClient.post("/copy/follow", { leader_id: leader.id });
        toast.success(`Following ${leader.label}`);
      }
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const addLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      window.dispatchEvent(new Event("open-login"));
      return;
    }
    setAdding(true);
    try {
      await apiClient.post("/copy/leaders", {
        address: form.address.trim(),
        label: form.label.trim() || shortAddress(form.address.trim()),
      });
      setForm({ address: "", label: "" });
      setAddOpen(false);
      toast.success("Whale added to your list");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Could not add this address");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] pt-24 pb-20 px-6 lg:px-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -right-1/4 w-[700px] h-[700px] bg-[var(--accent)]/10 rounded-full blur-[120px] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[var(--bg-base)]/60 backdrop-blur-[50px]" />
      </div>

      <div className="relative z-10 max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-16 h-16 rounded-[32px] bg-white/5 border border-[var(--border-base)] flex items-center justify-center mb-6"
          >
            <Users className="text-[var(--text-main)]" size={30} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight mb-4"
          >
            Copy{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)]">
              Trading
            </span>
          </motion.h1>
          <p className="text-[var(--text-muted)] max-w-xl">
            Follow the wallets we track. Every number below is read live from
            the blockchain — nothing here is estimated.
          </p>
        </div>

        {/* Acemi karsilamasi. Bir kez gosterilir; uzun rehber degil, uc cumle:
            kimseyi aramana gerek yok, tarz sec, risk gercek. */}
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-[var(--border-base)] bg-[var(--bg-elevated)]/70 backdrop-blur-xl p-6"
          >
            <h3 className="text-lg font-bold mb-4">New here? 30 seconds.</h3>
            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              {[
                {
                  n: "1",
                  t: "You don't have to find anyone",
                  d: "We track these wallets and vet the list. Hunting for whale addresses yourself is the risky part — skip it.",
                },
                {
                  n: "2",
                  t: "Pick a style, not a person",
                  d: "Calm, Active or Aggressive. The badges on each card describe how that wallet actually holds its money right now.",
                },
                {
                  n: "3",
                  t: "Nothing happens yet",
                  d: "Following just saves your choice. No trade is placed and your wallet is never touched.",
                },
              ].map((s) => (
                <div key={s.n}>
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-[11px] font-bold flex items-center justify-center mb-2">
                    {s.n}
                  </div>
                  <div className="font-semibold text-[13px] mb-1">{s.t}</div>
                  <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-4">
              Copying someone can lose money. Past holdings say nothing about
              future results. Never commit more than you can afford to lose.
            </p>
            <button
              onClick={dismissWelcome}
              className="h-9 px-5 rounded-lg text-[13px] font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-all"
            >
              Got it
            </button>
          </motion.div>
        )}

        {/* Faz 1 durustluk banner'i — burada islem YOK, kullanici bunu bilmeli */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-[var(--border-base)] bg-[var(--bg-elevated)]/60 backdrop-blur-xl p-4">
          <Info size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
          <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
            <span className="text-[var(--text-main)] font-semibold">
              Preview stage.
            </span>{" "}
            Following a whale only saves your choice — no trade is placed and
            your wallet is never touched. Automatic copying arrives in a later
            release. Not financial advice.
          </p>
        </div>

        {/* Add own whale */}
        {/* Tarz filtresi. Liste zaten tam geliyor, filtre istemci tarafinda —
            birkac lider icin ayri endpoint acmaya deger degil. */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setStyleFilter(null)}
            className={`h-8 px-3 rounded-lg text-[12px] font-medium border transition-all ${
              styleFilter === null
                ? "bg-[var(--bg-elevated)] text-[var(--text-main)] border-[var(--border-base)]"
                : "text-[var(--text-muted)] border-transparent hover:bg-[var(--bg-elevated)]/50"
            }`}
          >
            All
          </button>
          {Object.entries(STYLES).map(([key, s]) => (
            <button
              key={key}
              onClick={() => setStyleFilter(styleFilter === key ? null : key)}
              title={s.blurb}
              className={`h-8 px-3 rounded-lg text-[12px] font-medium border transition-all ${
                styleFilter === key
                  ? s.className
                  : "text-[var(--text-muted)] border-transparent hover:bg-[var(--bg-elevated)]/50"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
        {styleFilter && STYLES[styleFilter] && (
          <p className="text-[12px] text-[var(--text-muted)] mb-4 -mt-2">
            {STYLES[styleFilter].blurb}.
          </p>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            Whales{" "}
            <span className="text-[var(--text-muted)] font-normal text-sm">
              ({shown.length})
            </span>
          </h2>
          <button
            onClick={() => setAddOpen((v) => !v)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-all"
          >
            <Plus size={15} /> Add your own
          </button>
        </div>

        {addOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={addLeader}
            className="mb-6 rounded-xl border border-[var(--border-base)] bg-[var(--bg-elevated)]/60 backdrop-blur-xl p-4"
          >
            {/* Rehber sadece BURADA — ana sayfada dursa acemiyi balina
                avina yollardi, oysa liste tam da bunu gereksiz kilmak icin var. */}
            <div className="mb-4 text-[12px] leading-relaxed text-[var(--text-muted)]">
              <p className="text-[var(--text-main)] font-semibold mb-2">
                Before you paste an address
              </p>
              <ul className="space-y-1 mb-3 list-disc list-inside">
                <li>Check it has a real history, not a wallet made last week.</li>
                <li>
                  Look at what it holds. Mostly unknown microcaps means you will
                  be copying into tokens you cannot sell.
                </li>
                <li>
                  A big balance is not a good track record — a wallet can be
                  large and still lose money.
                </li>
                <li>Wallets that only receive and never sell are not traders.</li>
              </ul>
              <p className="mb-1.5">Where people look these up:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["Arkham", "https://intel.arkm.com"],
                  ["DeBank", "https://debank.com"],
                  ["Etherscan", "https://etherscan.io"],
                  ["Nansen", "https://app.nansen.ai"],
                ].map(([name, href]) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:text-[var(--accent)] transition-colors"
                  >
                    {name} <ExternalLink size={10} />
                  </a>
                ))}
              </div>
              <p className="mt-3 text-[11px]">
                Not sure what any of this means? Then this form is not for you —
                pick from the list above instead, that is what it is for.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="0x wallet address"
                className="flex-1 h-10 px-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-[13px] outline-none focus:border-[var(--accent)]"
              />
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Name (optional)"
                className="sm:w-48 h-10 px-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-[13px] outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={adding || !form.address.trim()}
                className="h-10 px-5 rounded-lg text-[13px] font-semibold bg-[var(--accent)] text-white disabled:opacity-40 transition-all"
              >
                {adding ? <Loader2 size={15} className="animate-spin" /> : "Add"}
              </button>
            </div>
          </motion.form>
        )}

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-[var(--text-muted)] gap-2">
            <Loader2 size={18} className="animate-spin" /> Reading the chain...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--negative)]/30 bg-[var(--negative)]/5 p-4 text-[13px]">
            <AlertTriangle size={18} className="text-[var(--negative)]" />
            {error}
          </div>
        )}

        {!loading && !error && shown.length === 0 && (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <Wallet size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {styleFilter
                ? "No whales with this style yet. Try another one."
                : "No whales on the list yet."}
            </p>
          </div>
        )}

        {/* Leader cards */}
        <div className="grid gap-3">
          {shown.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-elevated)]/60 backdrop-blur-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Identity */}
              <div className="flex items-center gap-3 min-w-0 sm:w-56">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {l.label.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{l.label}</span>
                    {l.style && STYLES[l.style] && (
                      <span
                        title={STYLES[l.style].blurb}
                        className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${STYLES[l.style].className}`}
                      >
                        {STYLES[l.style].icon} {STYLES[l.style].label}
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://etherscan.io/address/${l.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-1"
                  >
                    {shortAddress(l.address)} <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Stats — veri yoksa sebebini yaz, rakam uydurma */}
              <div className="flex-1 min-w-0">
                {l.available ? (
                  <>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1">
                      Portfolio value
                    </div>
                    <div className="text-xl font-bold tabular-nums mb-2">
                      {usd(l.total_usd || 0)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {l.top_holdings.map((h) => (
                        <span
                          key={`${h.symbol}-${h.chain}`}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
                        >
                          {h.symbol}{" "}
                          <span className="opacity-60">{usd(h.usd_value)}</span>
                        </span>
                      ))}
                    </div>
                    {/* Risk rozetleri: sadece bakiyeden turetilmis, kar
                        iddiasi yok. Performans Faz 2 olcumu ile gelecek. */}
                    {riskBadges(l.stats).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {riskBadges(l.stats).map((b) => (
                          <span
                            key={b.text}
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${BADGE_TONE[b.tone]}`}
                          >
                            {b.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    {l.reason || "On-chain data not available yet."}
                  </div>
                )}
                {l.note && (
                  <div className="text-[11px] text-[var(--text-muted)] mt-2 italic">
                    {l.note}
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => toggleFollow(l)}
                disabled={busyId === l.id}
                className={`h-9 px-4 rounded-lg text-[13px] font-semibold shrink-0 transition-all flex items-center gap-2 disabled:opacity-50 ${
                  l.is_following
                    ? "bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    : "bg-[var(--accent)] text-white hover:opacity-90"
                }`}
              >
                {busyId === l.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : l.is_following ? (
                  <>
                    <Check size={14} /> Following
                  </>
                ) : (
                  "Follow"
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {refreshing > 0 && (
          <p className="text-[11px] text-[var(--text-muted)] text-center mt-6">
            {refreshing} more wallet{refreshing > 1 ? "s" : ""} still syncing —
            reload in a moment to see their balances.
          </p>
        )}
      </div>
    </div>
  );
}
