import Head from 'next/head';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import NFTCard from '@/components/NFTCard';
import { Search, SlidersHorizontal } from 'lucide-react';

const MOCK_NFTS = Array.from({ length: 24 }, (_, i) => ({
  tokenId: i + 1,
  name:    `MakeSTX #${String(i + 1).padStart(4, '0')}`,
  image:   `https://api.dicebear.com/8.x/pixel-art/svg?seed=mkstx${i + 1}&backgroundColor=030308&colorful=true`,
  owner:   `SP${Math.random().toString(36).slice(2, 10).toUpperCase()}ABCDEF`,
  price:   Math.random() > 0.4 ? Math.floor((Math.random() * 100 + 1) * 1_000_000) : undefined,
  isListed: Math.random() > 0.4,
}));

const SORT_OPTIONS = ['RECENTLY LISTED', 'PRICE: LOW → HIGH', 'PRICE: HIGH → LOW', 'TOKEN ID'];

export default function Explore() {
  const [search, setSearch]           = useState('');
  const [sort, setSort]               = useState('RECENTLY LISTED');
  const [filterListed, setFilterListed] = useState(false);

  const filtered = MOCK_NFTS
    .filter(n => {
      if (filterListed && !n.isListed) return false;
      if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'PRICE: LOW → HIGH')  return (a.price || 0) - (b.price || 0);
      if (sort === 'PRICE: HIGH → LOW')  return (b.price || 0) - (a.price || 0);
      if (sort === 'TOKEN ID')            return a.tokenId - b.tokenId;
      return b.tokenId - a.tokenId;
    });

  return (
    <>
      <Head>
        <title>Explore — MakeSTX</title>
        <meta name="description" content="Browse MakeSTX Cyberpunk NFTs." />
      </Head>

      <div className="min-h-screen bg-ms-bg">
        <Navbar />

        <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
          <div className="mb-8">
            <p className="font-mono text-xs text-ms-muted tracking-widest mb-1">// explore_collection.tsx</p>
            <h1 className="font-display font-black text-4xl text-ms-text tracking-tight">
              EXPLORE <span className="text-ms-cyan">COLLECTION</span>
            </h1>
            <p className="font-mono text-xs text-ms-muted mt-2">
              {filtered.length} NFTs · {MOCK_NFTS.filter(n => n.isListed).length} LISTED
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ms-muted" />
              <input
                type="text"
                placeholder="SEARCH BY NAME OR ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-ms-surface border border-ms-border pl-9 pr-4 py-2.5 text-xs font-mono text-ms-text placeholder-ms-muted focus:outline-none focus:border-ms-cyan transition-colors tracking-widest"
              />
            </div>

            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-ms-surface border border-ms-border px-4 py-2.5 text-xs font-mono text-ms-text focus:outline-none focus:border-ms-cyan tracking-widest"
            >
              {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>

            <button
              onClick={() => setFilterListed(!filterListed)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-widest border transition-all ${
                filterListed
                  ? 'border-ms-cyan text-ms-cyan bg-ms-cyan/10'
                  : 'border-ms-border text-ms-muted hover:border-ms-cyan hover:text-ms-cyan'
              }`}
            >
              <SlidersHorizontal size={13} />
              LISTED ONLY
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map(nft => (
              <NFTCard key={nft.tokenId} {...nft} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-24">
              <p className="font-mono text-ms-muted text-sm tracking-widest">// NO_RESULTS_FOUND</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
