import Head from 'next/head';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useWallet } from '@/hooks/useWallet';
import { useContractActions } from '@/hooks/useContract';
import { Zap, Info, CheckCircle2, Loader2, ExternalLink, Terminal } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '@/hooks/useWallet';

const EXPLORER = 'https://explorer.hiro.so';

export default function Mint() {
  const { isConnected, address, connect } = useWallet();
  const { mintNFT }  = useContractActions();
  const [loading, setLoading]   = useState(false);
  const [txId, setTxId]         = useState<string | null>(null);
  const [previewSeed] = useState(() => Math.floor(Math.random() * 10000));

  const handleMint = async () => {
    if (!address) return;
    setLoading(true);
    try {
      await mintNFT(address, () => setLoading(false));
    } catch { setLoading(false); }
  };

  return (
    <>
      <Head>
        <title>Mint — MakeSTX Cyberpunk</title>
        <meta name="description" content="Mint your MakeSTX Cyberpunk NFT on Stacks. Free — gas only." />
      </Head>

      <div className="min-h-screen bg-ms-bg grid-bg">
        <Navbar />

        <main className="pt-28 pb-16 px-4 max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <p className="font-mono text-xs text-ms-muted tracking-widest mb-2">// mint_interface_v1.clar</p>
            <h1 className="font-display font-black text-4xl md:text-5xl text-ms-text tracking-tight">
              MINT YOUR <span className="gradient-text">CYBERPUNK</span>
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">

            {/* NFT Preview */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-ms-cyan/10 to-ms-magenta/10 border border-ms-border"
                   style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}>
                <img
                  src={`https://api.dicebear.com/8.x/pixel-art/svg?seed=makestx${previewSeed}&backgroundColor=030308&colorful=true`}
                  alt="NFT Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ms-bg/50 to-transparent" />

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-px bg-ms-cyan" />
                <div className="absolute top-0 left-0 w-px h-8 bg-ms-cyan" />
                <div className="absolute bottom-0 right-0 w-8 h-px bg-ms-magenta" />
                <div className="absolute bottom-0 right-0 w-px h-8 bg-ms-magenta" />

                <div className="absolute bottom-4 left-4">
                  <span className="tag tag-cyan">PREVIEW · RANDOMIZED</span>
                </div>
              </div>

              {/* Collection info */}
              <div className="card-cyber p-5">
                <h3 className="font-display font-bold text-xs text-ms-text mb-4 tracking-widest">COLLECTION DATA</h3>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  {[
                    { k: 'CONTRACT', v: 'makestx-nft' },
                    { k: 'STANDARD', v: 'SIP-009' },
                    { k: 'MAX SUPPLY', v: '10,000' },
                    { k: 'ROYALTIES', v: '5%' },
                    { k: 'NETWORK', v: 'STACKS' },
                    { k: 'SECURED BY', v: 'BITCOIN' },
                  ].map(({ k, v }) => (
                    <div key={k} className="bg-ms-bg p-3 border border-ms-border">
                      <p className="text-ms-muted text-xs">{k}</p>
                      <p className="text-ms-cyan mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mint Panel */}
            <div className="space-y-5">
              <div>
                <p className="font-mono text-xs text-ms-muted mb-2">MAKESTX CYBERPUNK #????</p>
                <p className="text-ms-muted leading-relaxed text-sm">
                  Each MakeSTX Cyberpunk is a unique, algorithmically generated NFT.
                  10,000 total supply. Free mint — pay only the gas fee.
                  Stored on Stacks, secured by Bitcoin.
                </p>
              </div>

              {/* Price card */}
              <div className="card-cyber p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-xs text-ms-muted tracking-widest">MINT PRICE</span>
                  <span className="tag tag-green">FREE MINT</span>
                </div>
                {[
                  { k: 'PRICE', v: '0 STX', color: 'text-ms-cyan' },
                  { k: 'GAS FEE', v: '~0.002 STX', color: 'text-ms-muted' },
                  { k: 'NETWORK', v: 'Stacks Mainnet', color: 'text-ms-muted' },
                  { k: 'SETTLEMENT', v: 'Bitcoin', color: 'text-ms-muted' },
                ].map(({ k, v, color }) => (
                  <div key={k} className="flex items-center justify-between text-xs font-mono mb-2 last:mb-0">
                    <span className="text-ms-muted">{k}</span>
                    <span className={color}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="flex gap-3 p-4 bg-ms-cyan/5 border border-ms-cyan/20">
                <Info size={15} className="text-ms-cyan shrink-0 mt-0.5" />
                <p className="text-xs text-ms-muted leading-relaxed font-mono">
                  Requires Hiro Wallet or Xverse. NFT appears in your wallet within a few blocks (~10 min).
                </p>
              </div>

              {/* Success */}
              {txId && (
                <div className="flex gap-3 p-4 bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 size={15} className="text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-400 font-mono font-bold">TX SUBMITTED</p>
                    <a href={`${EXPLORER}/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-ms-muted hover:text-ms-cyan flex items-center gap-1 mt-1 font-mono">
                      VIEW ON EXPLORER <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              )}

              {/* Mint button */}
              {!isConnected ? (
                <button onClick={connect} className="btn-primary w-full py-5 text-sm neon-pulse flex items-center justify-center gap-2">
                  <Wallet size={16} />
                  <span>CONNECT WALLET</span>
                </button>
              ) : (
                <button
                  onClick={handleMint}
                  disabled={loading}
                  className="btn-primary w-full py-5 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /><span>MINTING...</span></>
                  ) : (
                    <><Zap size={16} /><span>MINT FREE NFT</span></>
                  )}
                </button>
              )}

              <p className="text-xs text-center text-ms-muted font-mono">
                BY MINTING YOU ACCEPT THE TERMS. GAS ONLY (~0.002 STX).
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function Wallet({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
      <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
      <circle cx="18" cy="13" r="1"/>
    </svg>
  );
}
