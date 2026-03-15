'use client';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useState } from 'react';
import { Menu, X, Wallet, LogOut, Copy, Check, Zap } from 'lucide-react';

export default function Navbar() {
  const { isConnected, address, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied]     = useState(false);

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const copy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-ms-border bg-ms-bg/90 backdrop-blur-xl">
      {/* top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-ms-cyan to-transparent opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 border border-ms-cyan opacity-40 group-hover:opacity-100 transition-opacity"
                   style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }} />
              <span className="font-display font-black text-xs text-ms-cyan text-glow-cyan">MS</span>
            </div>
            <span className="font-display font-bold text-base tracking-widest text-ms-text group-hover:text-ms-cyan transition-colors">
              MAKE<span className="text-ms-cyan">STX</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { href: '/explore',    label: 'EXPLORE' },
              { href: '/mint',       label: 'MINT' },
              { href: '/auto-mint',  label: 'AUTO MINT' },
              { href: '/multi-mint', label: '⚡ MULTI MINT', hot: true },
            ].map(({ href, label, hot }) => (
              <Link
                key={href}
                href={href}
                className={
                  hot
                    ? 'font-mono text-xs tracking-wider text-ms-magenta hover:text-white border border-ms-magenta/40 hover:border-ms-magenta px-3 py-1.5 transition-all hover:bg-ms-magenta/10'
                    : 'font-mono text-xs tracking-widest text-ms-muted hover:text-ms-cyan transition-colors'
                }
              >
                {label}
              </Link>
            ))}
            {isConnected && (
              <Link href="/my-nfts" className="font-mono text-xs tracking-widest text-ms-muted hover:text-ms-cyan transition-colors">
                MY NFTS
              </Link>
            )}
          </div>

          {/* Wallet */}
          <div className="hidden md:flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={copy}
                  className="flex items-center gap-2 px-3 py-1.5 border border-ms-border hover:border-ms-cyan text-xs font-mono text-ms-muted hover:text-ms-cyan transition-all"
                >
                  <div className="w-1.5 h-1.5 bg-green-400 animate-pulse" />
                  {short}
                  {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                </button>
                <button
                  onClick={disconnect}
                  className="p-2 border border-ms-border hover:border-red-500 text-ms-muted hover:text-red-400 transition-all"
                  title="Disconnect"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                className="btn-primary flex items-center gap-2 px-5 py-2"
              >
                <Wallet size={13} />
                <span>CONNECT</span>
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-ms-muted hover:text-ms-cyan">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-ms-border bg-ms-surface px-4 py-4 space-y-3">
          {[
            { href: '/explore',    label: 'EXPLORE' },
            { href: '/mint',       label: 'MINT' },
            { href: '/auto-mint',  label: 'AUTO MINT' },
            { href: '/multi-mint', label: '⚡ MULTI MINT' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="block font-mono text-xs tracking-widest text-ms-muted hover:text-ms-cyan py-2">
              {label}
            </Link>
          ))}
          {isConnected && (
            <Link href="/my-nfts" className="block font-mono text-xs tracking-widest text-ms-muted hover:text-ms-cyan py-2">MY NFTS</Link>
          )}
          <div className="pt-2 border-t border-ms-border">
            {isConnected ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-ms-muted">{short}</span>
                <button onClick={disconnect} className="text-red-400 text-xs font-mono">DISCONNECT</button>
              </div>
            ) : (
              <button onClick={connect} className="btn-primary w-full py-2 text-xs">CONNECT WALLET</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
