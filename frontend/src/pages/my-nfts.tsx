import Head from 'next/head';
import Navbar from '@/components/Navbar';
import NFTCard from '@/components/NFTCard';
import { useWallet } from '@/hooks/useWallet';
import { Wallet } from 'lucide-react';

const MOCK_MY = Array.from({ length: 6 }, (_, i) => ({
  tokenId: i + 1,
  name:    `MakeSTX #${String(i + 1).padStart(4, '0')}`,
  image:   `https://api.dicebear.com/8.x/pixel-art/svg?seed=my${i + 1}&backgroundColor=030308&colorful=true`,
  isListed: i % 3 === 0,
  price:   i % 3 === 0 ? Math.floor(Math.random() * 50 * 1_000_000) : undefined,
}));

export default function MyNFTs() {
  const { isConnected, address, connect } = useWallet();

  return (
    <>
      <Head>
        <title>My NFTs — MakeSTX</title>
      </Head>
      <div className="min-h-screen bg-ms-bg">
        <Navbar />
        <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
          <div className="mb-8">
            <p className="font-mono text-xs text-ms-muted tracking-widest mb-1">// my_wallet.tsx</p>
            <h1 className="font-display font-black text-4xl text-ms-text tracking-tight">
              MY <span className="text-ms-cyan">NFTS</span>
            </h1>
            {address && (
              <p className="font-mono text-xs text-ms-muted mt-2">{address}</p>
            )}
          </div>

          {!isConnected ? (
            <div className="text-center py-32">
              <Wallet size={40} className="text-ms-muted mx-auto mb-4" />
              <p className="font-mono text-ms-muted text-sm tracking-widest mb-6">// WALLET NOT CONNECTED</p>
              <button onClick={connect} className="btn-primary px-10 py-4 text-sm">
                <span>CONNECT WALLET</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {MOCK_MY.map(nft => (
                <NFTCard key={nft.tokenId} {...nft} owner={address ?? undefined} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
