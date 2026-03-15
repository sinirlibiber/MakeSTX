import { ExternalLink, Tag } from 'lucide-react';

interface Props {
  tokenId: number;
  name: string;
  image: string;
  owner?: string;
  price?: number;
  isListed?: boolean;
  onBuy?: () => void;
}

export default function NFTCard({ tokenId, name, image, owner, price, isListed, onBuy }: Props) {
  return (
    <div className="nft-card rounded-none overflow-hidden group cursor-pointer" style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-ms-cyan/10 to-ms-magenta/10">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ms-bg/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isListed && (
          <div className="absolute top-2 right-2">
            <span className="tag tag-magenta flex items-center gap-1">
              <Tag size={8} /> LISTED
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="tag tag-cyan">#{tokenId}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 border-t border-ms-border">
        <p className="text-xs font-display font-bold text-ms-text truncate tracking-wider">{name}</p>
        {owner && (
          <p className="text-xs font-mono text-ms-muted mt-0.5 truncate">
            {owner.slice(0, 8)}...{owner.slice(-4)}
          </p>
        )}
        {isListed && price ? (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-mono text-ms-cyan">
              {(price / 1_000_000).toFixed(2)} STX
            </span>
            {onBuy && (
              <button
                onClick={onBuy}
                className="text-xs font-mono text-ms-bg bg-ms-cyan px-2 py-0.5 hover:bg-white transition-colors"
              >
                BUY
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs font-mono text-ms-muted mt-1">NOT LISTED</p>
        )}
      </div>
    </div>
  );
}
