import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  key?: string | number;
  product: any;
  onAddToCart?: () => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 relative">
        <img 
          src={product.image_urls[0] || `https://picsum.photos/seed/${product.id}/800/1000`} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
            <Tag size={10} /> {product.category}
          </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
          className="absolute bottom-4 right-4 bg-black text-white p-4 rounded-full opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all"
        >
          <ShoppingCart size={20} />
        </button>
      </div>
      <div className="mt-4 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg uppercase italic tracking-tight">{product.name}</h3>
          <p className="text-gray-500 text-sm line-clamp-1">{product.description}</p>
        </div>
        <span className="font-black text-xl">{product.price.toLocaleString()} DA</span>
      </div>
    </motion.div>
  );
}
