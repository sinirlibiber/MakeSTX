import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import NFTCard from '@/components/NFTCard';
import { useWallet } from '@/hooks/useWallet';
import { ArrowRight, Zap, Shield, TrendingUp, Terminal, Activity } from 'lucide-react';

const STATS = [
  { label: 'TOTAL MINTED',  value: '0',          unit: '/ 10,000' },
  { label: 'TOTAL VOLUME',  value: '0',          unit: 'STX' },
  { label: 'HOLDERS',       value: '0',          unit: 'wallets' },
  { label: 'TRANSACTIONS',  value: '0',          unit: 'tx' },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'FREE MINT',
    desc: 'Gas fee only. No whitelist, no presale. Just connect and mint.',
    color: 'text-ms-cyan',
    border: 'border-ms-cyan/30',
  },
  {
    icon: Shield,
    title: 'BITCOIN SECURED',
    desc: 'Every transaction settled on Bitcoin through the Stacks layer.',
    color: 'text-ms-magenta',
    border: 'border-ms-magenta/30',
  },
  {
    icon: TrendingUp,
    title: '5% ROYALTIES',
    desc: 'Creator royalties enforced on-chain via smart contract.',
    color: 'text-purple-400',
    border: 'border-purple-400/30',
  },
];

const FEATURED = Array.from({ length: 6 }, (_, i) => ({
  tokenId: i + 1,
  name:    `MakeSTX #${String(i + 1).padStart(4, '0')}`,
  image:   `https://api.dicebear.com/8.x/pixel-art/svg?seed=makestx${i + 100}&backgroundColor=030308&colorful=true`,
  price:   Math.floor((Math.random() * 80 + 5) * 1_000_000),
  isListed: Math.random() > 0.4,
}));

export default function Home() {
  const { isConnected, connect } = useWallet();

  return (
    <>
      <Head>
        <title>MakeSTX — Cyberpunk NFT Collection on Stacks</title>
        <meta name="description" content="10,000 cyberpunk NFTs. Free mint. Bitcoin-secured via Stacks blockchain." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-ms-bg grid-bg">
        <Navbar />

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section className="relative pt-36 pb-28 px-4 overflow-hidden">
          {/* Glowing orbs */}
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-ms-cyan/5 blur-3xl pointer-events-none" />
          <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full bg-ms-magenta/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-ms-cyan/30 to-transparent" />

          <div className="relative max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 tag tag-cyan mb-8">
              <Terminal size={10} />
              STACKS MAINNET · CYBERPUNK COLLECTION · 10,000 SUPPLY
            </div>

            {/* Headline */}
            <h1 className="font-display font-black leading-none mb-6">
              <span className="block text-6xl md:text-8xl text-ms-text tracking-tight">
                MAKE
              </span>
              <span className="block text-6xl md:text-8xl gradient-text tracking-tight flicker">
                STX
              </span>
              <span className="block text-xl md:text-2xl text-ms-muted tracking-[0.3em] mt-2 font-normal">
                CYBERPUNK NFT COLLECTION
              </span>
            </h1>

            <p className="text-ms-muted text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed font-light tracking-wide">
              10,000 unique cyberpunk NFTs living on the Stacks blockchain.
              Free mint. No gas wars. Secured by Bitcoin.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mint"
                className="btn-primary inline-flex items-center justify-center gap-2 px-10 py-4 text-sm neon-pulse"
              >
                <span>MINT FREE NFT</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/explore"
                className="btn-outline inline-flex items-center justify-center gap-2 px-10 py-4 text-sm font-mono tracking-widest text-ms-muted"
              >
                EXPLORE COLLECTION
              </Link>
            </div>

            {/* Supply bar */}
            <div className="mt-16 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-mono text-ms-muted mb-2">
                <span>MINTED</span>
                <span>0 / 10,000</span>
              </div>
              <div className="h-1 bg-ms-surface border border-ms-border overflow-hidden">
                <div className="h-full bg-ms-cyan w-0 transition-all duration-1000" style={{ boxShadow: '0 0 8px #00f5ff' }} />
              </div>
              <p className="text-xs font-mono text-ms-muted mt-2 text-center">10,000 REMAINING</p>
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────── */}
        <section className="py-12 border-y border-ms-border bg-ms-surface/30">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-display font-black gradient-text-cyan">{s.value}</p>
                  <p className="text-xs font-mono text-ms-muted mt-1 tracking-widest">{s.label}</p>
                  <p className="text-xs font-mono text-ms-muted/50">{s.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURED NFTs ─────────────────────────────────────── */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-display font-bold text-ms-text tracking-widest">
                  COLLECTION <span className="text-ms-cyan">PREVIEW</span>
                </h2>
                <p className="text-ms-muted text-sm font-mono mt-1">// cyberpunk_series_001</p>
              </div>
              <Link href="/explore" className="btn-outline px-4 py-2 text-xs font-mono flex items-center gap-2">
                VIEW ALL <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {FEATURED.map((nft) => (
                <NFTCard key={nft.tokenId} {...nft} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────── */}
        <section className="py-20 px-4 border-t border-ms-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl font-display font-bold text-ms-text tracking-widest">
                WHY <span className="gradient-text">MAKESTX</span>?
              </h2>
              <p className="text-ms-muted font-mono text-sm mt-2">// built_different.clar</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className={`card-cyber p-6 rounded-none hover:${f.border} transition-colors`}>
                  <div className={`w-10 h-10 border ${f.border} flex items-center justify-center mb-4 ${f.color}`}>
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-display font-bold text-ms-text text-sm tracking-widest mb-2">{f.title}</h3>
                  <p className="text-ms-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section className="py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card-cyber p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-ms-cyan/5 to-ms-magenta/5 pointer-events-none" />
              <Activity size={32} className="text-ms-cyan mx-auto mb-4 relative" />
              <h2 className="text-2xl font-display font-bold text-ms-text mb-3 relative tracking-widest">
                READY TO MINT?
              </h2>
              <p className="text-ms-muted mb-8 relative font-mono text-sm">
                Connect your Stacks wallet. Pay only gas. Own a piece of the cyberpunk universe.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
                {!isConnected ? (
                  <button onClick={connect} className="btn-primary px-10 py-4 text-sm neon-pulse">
                    <span>CONNECT &amp; MINT</span>
                  </button>
                ) : (
                  <Link href="/mint" className="btn-primary px-10 py-4 text-sm">
                    <span>MINT NOW — FREE</span>
                  </Link>
                )}
                <Link href="/multi-mint" className="btn-magenta px-10 py-4 text-xs">
                  ⚡ MULTI MINT
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <footer className="border-t border-ms-border py-8 px-4 bg-ms-surface/30">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm tracking-widest">
                MAKE<span className="text-ms-cyan">STX</span>
              </span>
              <span className="text-ms-muted font-mono text-xs">© 2025</span>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono text-ms-muted">
              {[
                { href: '/explore',   label: 'EXPLORE' },
                { href: '/mint',      label: 'MINT' },
                { href: '/multi-mint',label: 'MULTI MINT' },
                { href: 'https://stacks.co', label: 'STACKS', ext: true },
              ].map(({ href, label, ext }) => (
                <a key={label} href={href} target={ext ? '_blank' : undefined} rel={ext ? 'noopener noreferrer' : undefined}
                   className="hover:text-ms-cyan transition-colors tracking-widest">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
