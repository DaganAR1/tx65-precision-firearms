import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const FILTER_CATEGORIES = {
  'Rifles': ['Manufacturer', 'Caliber', 'Action', 'Barrel Length'],
  'Pistols': ['Manufacturer', 'Caliber', 'Action', 'Capacity'],
  'Optics': ['Manufacturer', 'Magnification', 'Reticle'],
  'Accessories': ['Manufacturer', 'Type'],
  'Ammunition': ['Manufacturer', 'Caliber', 'Grain Weight']
};

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Advanced Filters
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  const [expandedFilters, setExpandedFilters] = useState<string[]>(['Price']);

  const categories: Category[] = ['Rifles', 'Pistols', 'Optics', 'Accessories', 'Ammunition'];
  const activeCategory = searchParams.get('category');

  useEffect(() => {
    fetchProducts();
    // Clear advanced filters when category changes
    setSelectedSpecs({});
    setPriceRange({ min: '', max: '' });
  }, [activeCategory, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*');

    if (activeCategory) {
      query = query.eq('category', activeCategory);
    }

    if (sortBy === 'price-low') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price-high') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = (!priceRange.min || p.price >= parseFloat(priceRange.min)) &&
                        (!priceRange.max || p.price <= parseFloat(priceRange.max));
    
    const matchesSpecs = Object.entries(selectedSpecs).every(([key, values]) => {
      if (values.length === 0) return true;
      const productValue = p.specs?.[key];
      return productValue && values.includes(productValue);
    });

    return matchesSearch && matchesPrice && matchesSpecs;
  });

  const toggleSpec = (key: string, value: string) => {
    setSelectedSpecs(prev => {
      const current = prev[key] || [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const toggleFilterExpansion = (filter: string) => {
    setExpandedFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const getAvailableSpecs = () => {
    const specs: Record<string, Set<string>> = {};
    const relevantKeys = activeCategory ? (FILTER_CATEGORIES[activeCategory as keyof typeof FILTER_CATEGORIES] || []) : [];
    
    products.forEach(p => {
      if (p.specs) {
        Object.entries(p.specs).forEach(([key, value]) => {
          if (relevantKeys.includes(key)) {
            if (!specs[key]) specs[key] = new Set();
            specs[key].add(value);
          }
        });
      }
    });
    
    return Object.entries(specs).map(([key, values]) => ({
      key,
      values: Array.from(values).sort()
    }));
  };

  const availableSpecs = getAvailableSpecs();

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setSelectedSpecs({});
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{activeCategory ? `${activeCategory} | 65GUNS Shop` : 'Shop All Products | 65GUNS'}</title>
        <meta name="description" content={activeCategory ? `Browse our selection of premium ${activeCategory.toLowerCase()}. High-performance gear for marksmen.` : 'Explore our full collection of elite firearms, optics, and tactical accessories.'} />
        <link rel="canonical" href={`${window.location.origin}/shop${activeCategory ? `?category=${activeCategory}` : ''}`} />
      </Helmet>
      {/* Header */}
      <div className="bg-brand-primary py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">
            {activeCategory || 'All Products'}
          </h1>
          <p className="text-gray-400 max-w-xl">
            Explore our curated selection of high-performance firearms and equipment.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Pill Bar */}
        <div className="flex justify-center mb-16 overflow-x-auto pb-4 sm:pb-0 scrollbar-hide">
          <div className="inline-flex p-1.5 bg-brand-muted rounded-full border border-gray-200 shadow-sm">
            <button
              onClick={() => setSearchParams({})}
              className={cn(
                "px-10 py-2.5 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap",
                !activeCategory 
                  ? "bg-brand-accent text-white shadow-lg ring-2 ring-brand-primary ring-offset-0" 
                  : "text-gray-500 hover:text-brand-primary"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchParams({ category: cat })}
                className={cn(
                  "px-10 py-2.5 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap",
                  activeCategory === cat 
                    ? "bg-brand-accent text-white shadow-lg ring-2 ring-brand-primary ring-offset-0" 
                    : "text-gray-500 hover:text-brand-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-32 space-y-8">
              {/* Search */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-gray-400">Search</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field !pl-12 !py-3 text-sm"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-gray-400">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field text-sm font-bold uppercase tracking-widest !py-3"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {/* Advanced Filters */}
              <div className="space-y-4 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Filters</h3>
                  {(searchQuery || priceRange.min || priceRange.max || Object.values(selectedSpecs).some(v => v.length > 0)) && (
                    <button 
                      onClick={clearFilters}
                      className="text-[9px] font-black uppercase tracking-widest text-brand-accent hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Price Filter */}
                <div className="border-b border-gray-100 pb-4">
                  <button 
                    onClick={() => toggleFilterExpansion('Price')}
                    className="flex items-center justify-between w-full py-2 text-left group"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-600 group-hover:text-black transition-colors">Price Range</span>
                    {expandedFilters.includes('Price') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {expandedFilters.includes('Price') && (
                    <div className="pt-4 flex items-center space-x-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">$</span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                          className="input-field !pl-6 !py-2 text-xs"
                        />
                      </div>
                      <span className="text-gray-300">—</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">$</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                          className="input-field !pl-6 !py-2 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Spec Filters */}
                {availableSpecs.map(({ key, values }) => (
                  <div key={key} className="border-b border-gray-100 pb-4">
                    <button 
                      onClick={() => toggleFilterExpansion(key)}
                      className="flex items-center justify-between w-full py-2 text-left group"
                    >
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-600 group-hover:text-black transition-colors">{key}</span>
                      {expandedFilters.includes(key) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {expandedFilters.includes(key) && (
                      <div className="pt-4 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {values.map(val => (
                          <label key={val} className="flex items-center space-x-3 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedSpecs[key]?.includes(val) || false}
                                onChange={() => toggleSpec(key, val)}
                                className="peer appearance-none w-4 h-4 border-2 border-gray-200 rounded-sm checked:bg-brand-accent checked:border-brand-accent transition-all"
                              />
                              <X className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity" size={10} strokeWidth={4} />
                            </div>
                            <span className={cn(
                              "text-xs font-medium transition-colors",
                              selectedSpecs[key]?.includes(val) ? "text-brand-accent font-bold" : "text-gray-500 group-hover:text-gray-900"
                            )}>
                              {val}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[4/5] mb-4"></div>
                    <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <motion.div
                      layout
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="group"
                    >
                      <Link to={`/product/${product.id}`} className="block">
                        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 mb-4">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          {product.stock_quantity === 0 && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                              <span className="text-xs font-black uppercase tracking-[0.3em] bg-brand-primary text-white px-4 py-2">Out of Stock</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">
                            {product.category}
                          </span>
                          <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-brand-accent transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-lg font-medium text-gray-900">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-24 border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-medium">No products found matching your criteria.</p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 text-brand-accent font-bold uppercase text-xs tracking-widest hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
