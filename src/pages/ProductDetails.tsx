import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Shield, Check, Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { OptimizedImage } from '../components/OptimizedImage';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      setActiveImage(product.image_url);
      // Initialize selected specs with first available values
      const initial: Record<string, string> = {};
      Object.entries(product.specs || {}).forEach(([key, value]) => {
        const values = Array.isArray(value) ? value : [value];
        if (values.length > 0) initial[key] = values[0];
      });
      setSelectedSpecs(initial);
    }
  }, [product]);

  const calculateTotalPrice = () => {
    if (!product) return 0;
    let total = product.price;
    Object.entries(selectedSpecs).forEach(([key, value]) => {
      const adjustment = product.spec_prices?.[key]?.[value] || 0;
      total += adjustment;
    });
    return total;
  };

  const isOptionDisabled = (specKey: string, specValue: string) => {
    if (!product?.spec_rules) return false;
    return product.spec_rules.some(rule => {
      // Check if any CURRENTLY selected spec triggers a rule that forbids THIS specValue
      const triggerValue = selectedSpecs[rule.if_spec];
      return triggerValue === rule.if_value && 
             rule.then_not_spec === specKey && 
             rule.then_not_value === specValue;
    });
  };

  const handleSpecChange = (key: string, value: string) => {
    setSelectedSpecs(prev => ({ ...prev, [key]: value }));
  };

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
      const finalPrice = calculateTotalPrice();
      addToCart(product, quantity, selectedSpecs, finalPrice);
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
              <OptimizedImage 
                src={activeImage || product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover"
                containerClassName="w-full h-full"
                fallbackColor="bg-brand-muted"
              />
            </div>
            
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <button 
                  onClick={() => setActiveImage(product.image_url)}
                  className={cn(
                    "aspect-square bg-brand-muted overflow-hidden border-2 transition-all",
                    activeImage === product.image_url ? "border-brand-accent" : "border-transparent hover:border-gray-200"
                  )}
                >
                  <OptimizedImage src={product.image_url} alt="" className="w-full h-full object-cover" containerClassName="w-full h-full" />
                </button>
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "aspect-square bg-brand-muted overflow-hidden border-2 transition-all",
                      activeImage === img ? "border-brand-accent" : "border-transparent hover:border-gray-200"
                    )}
                  >
                    <OptimizedImage src={img} alt="" className="w-full h-full object-cover" containerClassName="w-full h-full" />
                  </button>
                ))}
              </div>
            )}
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
                {formatPrice(calculateTotalPrice())}
              </p>
            </div>

            <div className="prose prose-sm text-gray-600 mb-10 max-w-none">
              <p className="text-lg leading-relaxed">{product.description}</p>
            </div>

            {/* Configurator Section */}
            <div className="space-y-8 mb-10">
              {Object.entries(product.specs || {}).map(([key, value]) => {
                const values = Array.isArray(value) ? value : [value];
                if (values.length <= 1 && !product.spec_prices?.[key]) return null; // Skip if only one option and no price impact

                return (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{key}</label>
                      {selectedSpecs[key] && product.spec_prices?.[key]?.[selectedSpecs[key]] ? (
                        <span className="text-[10px] font-bold text-brand-accent">
                          +{formatPrice(product.spec_prices[key][selectedSpecs[key]])}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {values.map(val => {
                        const disabled = isOptionDisabled(key, val);
                        const selected = selectedSpecs[key] === val;
                        const priceDelta = product.spec_prices?.[key]?.[val];

                        return (
                          <button
                            key={val}
                            disabled={disabled}
                            onClick={() => handleSpecChange(key, val)}
                            className={cn(
                              "px-4 py-2 text-xs font-bold uppercase tracking-widest border-2 transition-all",
                              selected 
                                ? "border-brand-accent bg-brand-accent text-white" 
                                : disabled
                                  ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50"
                                  : "border-gray-200 hover:border-brand-primary text-brand-primary"
                            )}
                          >
                            <div className="flex flex-col items-center">
                              <span>{val}</span>
                              {priceDelta ? (
                                <span className={cn(
                                  "text-[8px] mt-0.5",
                                  selected ? "text-white/80" : "text-gray-400"
                                )}>
                                  +{formatPrice(priceDelta)}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Static Specs (for those that don't have multiple options) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 border border-gray-100 mb-10">
              {Object.entries(product.specs || {}).map(([key, value]) => {
                const values = Array.isArray(value) ? value : [value];
                if (values.length > 1 || product.spec_prices?.[key]) return null;
                return (
                  <div key={key} className="p-5 bg-white flex flex-col justify-center">
                    <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">{key}</span>
                    <span className="block text-sm font-bold uppercase tracking-tight text-brand-primary">
                      {values[0]}
                    </span>
                  </div>
                );
              })}
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
