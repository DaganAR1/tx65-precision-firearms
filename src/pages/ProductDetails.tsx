import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Shield, Check, Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      toast.error('Product not found');
      navigate('/shop');
    } else {
      setProduct(data);
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast.success(`${product.name} added to cart`);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
    </div>
  );

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white py-12">
      <Helmet>
        <title>{`${product.name} | 65GUNS`}</title>
        <meta name="description" content={product.description.substring(0, 160)} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description.substring(0, 160)} />
        <meta property="og:image" content={product.image_url} />
        <meta property="og:type" content="product" />
        <link rel="canonical" href={`${window.location.origin}/product/${product.id}`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-12 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Collection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="aspect-[4/5] bg-brand-muted overflow-hidden">
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-8">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-accent mb-2 block">
                {product.category}
              </span>
              <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 leading-none">
                {product.name}
              </h1>
              <p className="text-3xl font-medium text-gray-900">
                {formatPrice(product.price)}
              </p>
            </div>

            <div className="prose prose-sm text-gray-600 mb-10 max-w-none">
              <p className="text-lg leading-relaxed">{product.description}</p>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              {Object.entries(product.specs || {}).map(([key, value]) => (
                <div key={key} className="p-4 bg-brand-muted border border-gray-100">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{key}</span>
                  <span className="block text-sm font-bold uppercase tracking-tight">{value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-6 mt-auto">
              <div className="flex items-center space-x-4">
                <div className="flex items-center border-2 border-brand-primary">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-brand-muted transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-bold min-w-[40px] text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-brand-muted transition-colors"
                  >
                    +
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                  className="btn-primary flex-1 flex items-center justify-center space-x-3"
                >
                  <ShoppingCart size={20} />
                  <span>{product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-8 border-t border-gray-100 grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center">
                  <Shield size={20} className="text-brand-accent mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Secure Handling</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Check size={20} className="text-brand-accent mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Quality Inspected</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Info size={20} className="text-brand-accent mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">FFL Required</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
