import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Image as ImageIcon,
  Loader2,
  X,
  Save,
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  Sparkles,
  Link as LinkIcon,
  Layers,
  Play,
  Pause,
  Square,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { parseProductFromText, extractProductUrls } from '../services/geminiService';
import { OptimizedImage } from '../components/OptimizedImage';

import ImageUpload from '../components/ImageUpload';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [aiInputType, setAiInputType] = useState<'text' | 'url' | 'bulk'>('url');
  
  // Bulk Crawler State
  const [bulkQueue, setBulkQueue] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'extracting' | 'processing' | 'paused' | 'stopped'>('idle');
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const bulkAbortController = useRef<AbortController | null>(null);

  const categories: Category[] = ['Rifles', 'Pistols', 'Optics', 'Accessories', 'Ammunition'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const productsToImport = results.data.map((row: any) => {
            // Basic validation and transformation
            return {
              name: row.name || 'Unnamed Product',
              description: row.description || '',
              price: parseFloat(row.price) || 0,
              category: (categories.includes(row.category as Category) ? row.category : 'Accessories') as Category,
              image_url: row.image_url || 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80&w=800',
              stock_quantity: parseInt(row.stock_quantity) || 0,
              shipping_price: parseFloat(row.shipping_price) || null,
              is_best_seller: row.is_best_seller === 'true' || row.is_best_seller === '1',
              specs: row.specs ? JSON.parse(row.specs) : {}
            };
          });

          if (productsToImport.length === 0) {
            throw new Error('No valid products found in CSV');
          }

          const { error } = await supabase
            .from('products')
            .insert(productsToImport);

          if (error) throw error;

          toast.success(`Successfully imported ${productsToImport.length} products`);
          fetchProducts();
        } catch (error: any) {
          console.error('Import error:', error);
          toast.error(`Import failed: ${error.message}. Ensure your CSV matches the template.`);
        } finally {
          setImporting(false);
          // Reset file input
          e.target.value = '';
        }
      },
      error: (error) => {
        toast.error(`CSV Parsing error: ${error.message}`);
        setImporting(false);
      }
    });
  };

  const downloadTemplate = () => {
    const headers = ['name', 'description', 'price', 'category', 'image_url', 'stock_quantity', 'shipping_price', 'is_best_seller', 'specs'];
    const sampleData = [
      ['Glock 19 Gen 5', 'Compact 9mm pistol', '599.99', 'Pistols', 'https://example.com/g19.jpg', '10', '15.00', 'true', '{"Caliber": "9mm", "Capacity": "15+1"}'],
      ['Sig Sauer P320', 'Modular striker-fired pistol', '649.99', 'Pistols', 'https://example.com/p320.jpg', '5', '15.00', 'false', '{"Caliber": "9mm", "Action": "Striker"}']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAIImport = async () => {
    if (!aiInput.trim()) return;
    
    if (aiInputType === 'bulk') {
      await startBulkCrawl();
      return;
    }

    setIsParsing(true);
    try {
      let textToParse = aiInput;

      if (aiInputType === 'url') {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: aiInput })
        });
        if (!response.ok) throw new Error('Failed to fetch the webpage. Try pasting the text instead.');
        const data = await response.json();
        textToParse = data.text;
      }

      const parsedProduct = await parseProductFromText(textToParse);
      setEditingProduct({
        ...parsedProduct,
        is_best_seller: false,
        stock_quantity: parsedProduct.stock_quantity || 10,
        specs: parsedProduct.specs || {}
      });
      setIsAIModalOpen(false);
      setIsModalOpen(true);
      setAiInput('');
      toast.success('AI successfully extracted product data!');
    } catch (error: any) {
      console.error('AI Import error:', error);
      toast.error(error.message || 'Failed to parse product data.');
    } finally {
      setIsParsing(false);
    }
  };

  const startBulkCrawl = async () => {
    if (!aiInput.trim()) return;
    
    setBulkStatus('extracting');
    setBulkProgress({ current: 0, total: 0, success: 0, failed: 0 });
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: aiInput })
      });
      if (!response.ok) throw new Error('Failed to fetch listing page.');
      const data = await response.json();
      
      const baseUrl = new URL(aiInput).origin;
      const urls = await extractProductUrls(data.text, baseUrl);
      
      if (urls.length === 0) {
        throw new Error('No product URLs found on this page.');
      }
      
      setBulkQueue(urls);
      setBulkProgress(prev => ({ ...prev, total: urls.length }));
      setBulkStatus('processing');
      processBulkQueue(urls);
    } catch (error: any) {
      toast.error(error.message);
      setBulkStatus('idle');
    }
  };

  const processBulkQueue = async (queue: string[]) => {
    bulkAbortController.current = new AbortController();
    
    for (let i = 0; i < queue.length; i++) {
      if (bulkStatus === 'stopped' || bulkStatus === 'paused') break;
      
      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
      const url = queue[i];
      
      try {
        // 1. Scrape
        const scrapeRes = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (!scrapeRes.ok) throw new Error('Scrape failed');
        const scrapeData = await scrapeRes.json();
        
        // 2. Parse
        const parsed = await parseProductFromText(scrapeData.text);
        
        // 3. Save
        const { error } = await supabase.from('products').insert({
          ...parsed,
          stock_quantity: 10,
          specs: parsed.specs || {}
        });
        if (error) throw error;
        
        setBulkProgress(prev => ({ ...prev, success: prev.success + 1 }));
      } catch (error) {
        console.error(`Failed to process ${url}:`, error);
        setBulkProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
      }
      
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
    
    setBulkStatus('idle');
    fetchProducts();
    toast.success('Bulk import complete!');
  };

  const stopBulkCrawl = () => {
    setBulkStatus('stopped');
    bulkAbortController.current?.abort();
  };

  const addImageField = () => {
    setEditingProduct(prev => ({
      ...prev!,
      images: [...(prev?.images || []), '']
    }));
  };

  const updateImage = (index: number, url: string) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const images = [...(prev.images || [])];
      images[index] = url;
      return { ...prev, images };
    });
  };

  const removeImage = (index: number) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const images = [...(prev.images || [])];
      images.splice(index, 1);
      return { ...prev, images };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Ensure specs is an object
      const productToSave = {
        ...editingProduct,
        specs: editingProduct?.specs || {}
      };

      if (editingProduct?.id) {
        const { error } = await supabase
          .from('products')
          .update(productToSave)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productToSave]);
        if (error) throw error;
        toast.success('Product created');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSpec = (key: string, value: string) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      return {
        ...prev,
        specs: {
          ...(prev.specs || {}),
          [key]: value
        }
      };
    });
  };

  const updateSpecPrice = (key: string, value: string, price: number) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const spec_prices = { ...(prev.spec_prices || {}) };
      if (!spec_prices[key]) spec_prices[key] = {};
      spec_prices[key][value] = price;
      return { ...prev, spec_prices };
    });
  };

  const addSpecRule = () => {
    setEditingProduct(prev => ({
      ...prev!,
      spec_rules: [
        ...(prev?.spec_rules || []),
        { if_spec: '', if_value: '', then_not_spec: '', then_not_value: '' }
      ]
    }));
  };

  const updateSpecRule = (index: number, field: string, value: string) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const spec_rules = [...(prev.spec_rules || [])];
      spec_rules[index] = { ...spec_rules[index], [field]: value };
      return { ...prev, spec_rules };
    });
  };

  const removeSpecRule = (index: number) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const spec_rules = [...(prev.spec_rules || [])];
      spec_rules.splice(index, 1);
      return { ...prev, spec_rules };
    });
  };

  const updateSpecValue = (key: string, index: number, newValue: string) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const specs = { ...(prev.specs || {}) };
      const values = Array.isArray(specs[key]) ? [...specs[key]] : [specs[key]];
      values[index] = newValue;
      specs[key] = values;
      return { ...prev, specs };
    });
  };

  const addSpecValue = (key: string) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const specs = { ...(prev.specs || {}) };
      const values = Array.isArray(specs[key]) ? [...specs[key]] : [specs[key]];
      specs[key] = [...values, ''];
      return { ...prev, specs };
    });
  };

  const removeSpecValue = (key: string, index: number) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const specs = { ...(prev.specs || {}) };
      const values = Array.isArray(specs[key]) ? [...specs[key]] : [specs[key]];
      if (values.length <= 1) {
        delete specs[key];
      } else {
        values.splice(index, 1);
        specs[key] = values;
      }
      return { ...prev, specs };
    });
  };

  const updateSpecKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    setEditingProduct(prev => {
      if (!prev) return null;
      const specs = { ...(prev.specs || {}) };
      const value = specs[oldKey];
      delete specs[oldKey];
      specs[newKey] = value;
      return { ...prev, specs };
    });
  };

  const removeSpec = (key: string) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const newSpecs = { ...(prev.specs || {}) };
      delete newSpecs[key];
      return {
        ...prev,
        specs: newSpecs
      };
    });
  };

  const addSpecField = () => {
    const newKey = `New Spec ${Object.keys(editingProduct?.specs || {}).length + 1}`;
    setEditingProduct(prev => ({
      ...prev!,
      specs: { ...(prev?.specs || {}), [newKey]: [''] }
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Product deleted');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-muted p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <Link to="/admin" className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-4 transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Manage Products</h1>
            <p className="text-gray-500 text-sm">Add, edit, or remove items from your inventory.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsAIModalOpen(true)}
                className="p-3 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent hover:bg-brand-accent hover:text-white transition-all rounded-sm flex items-center space-x-2 text-xs font-bold uppercase tracking-widest"
                title="AI Import from URL or Text"
              >
                <Sparkles size={16} />
                <span className="hidden md:inline">AI Importer</span>
              </button>
              <button 
                onClick={downloadTemplate}
                className="p-3 bg-white border border-gray-200 text-gray-600 hover:text-brand-accent hover:border-brand-accent transition-all rounded-sm flex items-center space-x-2 text-xs font-bold uppercase tracking-widest"
                title="Download CSV Template"
              >
                <Download size={16} />
                <span className="hidden md:inline">Template</span>
              </button>
              <label className="cursor-pointer p-3 bg-white border border-gray-200 text-gray-600 hover:text-brand-accent hover:border-brand-accent transition-all rounded-sm flex items-center space-x-2 text-xs font-bold uppercase tracking-widest">
                {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                <span className="hidden md:inline">{importing ? 'Importing...' : 'Bulk Import'}</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleBulkImport}
                  disabled={importing}
                />
              </label>
            </div>
            <button 
              onClick={() => { setEditingProduct({ category: 'Rifles', specs: {}, is_best_seller: false }); setIsModalOpen(true); }}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Product</span>
            </button>
          </div>
        </header>

        {/* Product Table */}
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Shipping</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-brand-accent" size={32} />
                  </td>
                </tr>
              ) : products.length > 0 ? products.map((product) => (
                <tr key={product.id} className="hover:bg-brand-muted transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <OptimizedImage src={product.image_url} alt="" containerClassName="w-12 h-12" />
                      <span className="font-bold uppercase tracking-tight text-sm">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 font-medium">{formatPrice(product.price)}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">
                    {product.shipping_price ? formatPrice(product.shipping_price) : 'Default'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-xs font-bold",
                      product.stock_quantity < 5 ? "text-red-500" : "text-gray-900"
                    )}>
                      {product.stock_quantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.is_best_seller && (
                      <span className="text-[8px] font-black uppercase tracking-widest bg-brand-accent text-white px-2 py-1 rounded-sm">Best Seller</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                      className="p-2 text-gray-400 hover:text-brand-accent transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* AI Import Modal */}
        <AnimatePresence>
          {isAIModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-brand-accent/5">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-accent text-white rounded-sm">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-black">AI Product Importer</h2>
                      <p className="text-[10px] text-brand-accent font-bold uppercase tracking-widest">Powered by Gemini AI</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAIModalOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <button 
                      onClick={() => setAiInputType('url')}
                      className={cn(
                        "flex-1 p-4 border rounded-sm flex flex-col items-center space-y-2 transition-all",
                        aiInputType === 'url' ? "border-brand-accent bg-brand-accent/5 text-brand-accent" : "border-gray-200 text-gray-400 hover:border-gray-300"
                      )}
                    >
                      <LinkIcon size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Paste URL</span>
                    </button>
                    <button 
                      onClick={() => setAiInputType('text')}
                      className={cn(
                        "flex-1 p-4 border rounded-sm flex flex-col items-center space-y-2 transition-all",
                        aiInputType === 'text' ? "border-brand-accent bg-brand-accent/5 text-brand-accent" : "border-gray-200 text-gray-400 hover:border-gray-300"
                      )}
                    >
                      <FileSpreadsheet size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Paste Text</span>
                    </button>
                    <button 
                      onClick={() => setAiInputType('bulk')}
                      className={cn(
                        "flex-1 p-4 border rounded-sm flex flex-col items-center space-y-2 transition-all",
                        aiInputType === 'bulk' ? "border-brand-accent bg-brand-accent/5 text-brand-accent" : "border-gray-200 text-gray-400 hover:border-gray-300"
                      )}
                    >
                      <Layers size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Bulk Crawler</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {aiInputType === 'url' ? (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Product Page URL</label>
                        <input 
                          type="url"
                          placeholder="https://example.com/products/glock-19"
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-brand-accent transition-colors text-black"
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                        />
                        <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest">
                          We'll fetch the page and use AI to extract all details automatically.
                        </p>
                      </div>
                    ) : aiInputType === 'bulk' ? (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Category / Listing URL</label>
                        <input 
                          type="url"
                          placeholder="https://example.com/shop/rifles"
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-brand-accent transition-colors text-black"
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          disabled={bulkStatus !== 'idle'}
                        />
                        <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest">
                          Paste a category link. We'll find all products on that page and import them automatically.
                        </p>

                        {bulkStatus !== 'idle' && (
                          <div className="mt-6 p-6 bg-gray-50 border border-gray-100 rounded-sm">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                {bulkStatus === 'extracting' ? 'Finding Products...' : `Importing ${bulkProgress.current} of ${bulkProgress.total}`}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="flex items-center text-green-600 text-[10px] font-bold uppercase"><CheckCircle2 size={12} className="mr-1" /> {bulkProgress.success}</span>
                                <span className="flex items-center text-red-600 text-[10px] font-bold uppercase"><AlertCircle size={12} className="mr-1" /> {bulkProgress.failed}</span>
                              </div>
                            </div>
                            
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
                              <motion.div 
                                className="h-full bg-brand-accent"
                                initial={{ width: 0 }}
                                animate={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                              />
                            </div>

                            <div className="flex justify-center">
                              <button 
                                onClick={stopBulkCrawl}
                                className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-600"
                              >
                                <Square size={14} />
                                <span>Stop Crawler</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Product Page Content</label>
                        <textarea 
                          placeholder="Paste the text from the product page here (Ctrl+A, Ctrl+C from the other site)..."
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-brand-accent transition-colors h-48 resize-none text-black"
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                        />
                        <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest">
                          Copy all text from the product page and paste it here.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                    {aiInputType !== 'bulk' || bulkStatus === 'idle' ? (
                      <button 
                        onClick={handleAIImport}
                        disabled={isParsing || !aiInput.trim()}
                        className="w-full btn-primary py-4 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isParsing ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>AI is analyzing...</span>
                          </>
                        ) : (
                          <>
                            {aiInputType === 'bulk' ? <Play size={20} /> : <Sparkles size={20} />}
                            <span>{aiInputType === 'bulk' ? 'Start Bulk Crawl' : 'Extract Product Data'}</span>
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-12 shadow-2xl relative"
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              {editingProduct?.id ? 'Edit Product' : 'New Product'}
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                  <select
                    required
                    value={editingProduct?.category || 'Rifles'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as Category })}
                    className="input-field"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct?.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={editingProduct?.stock_quantity || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shipping Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct?.shipping_price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shipping_price: parseFloat(e.target.value) })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <ImageUpload 
                label="Product Image"
                value={editingProduct?.image_url || ''}
                onChange={(url) => setEditingProduct({ ...editingProduct, image_url: url })}
              />

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Gallery</label>
                  <button 
                    type="button"
                    onClick={addImageField}
                    className="text-[10px] font-black uppercase tracking-widest text-brand-accent hover:underline flex items-center space-x-1"
                  >
                    <Plus size={12} />
                    <span>Add Image</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {(editingProduct?.images || []).map((url, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <ImageUpload 
                          label={`Gallery Image ${index + 1}`}
                          value={url}
                          onChange={(newUrl) => updateImage(index, newUrl)}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors mt-6"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {(editingProduct?.images || []).length === 0 && (
                    <p className="text-[10px] text-gray-400 italic">No gallery images added. The main image will be used by default.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-brand-muted border border-gray-100">
                <input
                  type="checkbox"
                  id="is_best_seller"
                  checked={editingProduct?.is_best_seller || false}
                  onChange={(e) => setEditingProduct({ ...editingProduct, is_best_seller: e.target.checked })}
                  className="w-4 h-4 text-brand-accent border-gray-300 rounded focus:ring-brand-accent"
                />
                <label htmlFor="is_best_seller" className="text-xs font-bold uppercase tracking-widest text-gray-600 cursor-pointer">
                  Mark as Best Seller (Featured on Home Page)
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                <textarea
                  required
                  rows={4}
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="input-field resize-none"
                />
              </div>

              {/* Specifications Section */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Technical Specifications</label>
                    <p className="text-[9px] text-gray-400 uppercase tracking-tight">Add custom specs like Caliber, Barrel Length, or Capacity.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={addSpecField}
                    className="p-2 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white transition-all rounded-sm flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    <Plus size={14} />
                    <span>Add Specification</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(editingProduct?.specs || {}).map(([key, value], index) => {
                    const values = Array.isArray(value) ? value : [value];
                    return (
                      <div key={index} className="bg-brand-muted p-4 border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 max-w-xs">
                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Spec Name</label>
                            <input
                              type="text"
                              value={key}
                              onChange={(e) => updateSpecKey(key, e.target.value)}
                              className="w-full bg-white border border-gray-200 px-3 py-2 text-xs font-bold uppercase tracking-tight focus:border-brand-accent outline-none"
                              placeholder="e.g. Color"
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeSpec(key)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            title="Remove Entire Specification"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Values</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {values.map((val, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <div className="flex-1 flex flex-col space-y-1">
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={(e) => updateSpecValue(key, idx, e.target.value)}
                                    className="w-full bg-white border border-gray-200 px-3 py-2 text-xs focus:border-brand-accent outline-none"
                                    placeholder="Enter value..."
                                  />
                                  <div className="flex items-center space-x-2">
                                    <label className="text-[7px] font-black uppercase tracking-widest text-gray-400">Price +$</label>
                                    <input
                                      type="number"
                                      value={editingProduct?.spec_prices?.[key]?.[val] || 0}
                                      onChange={(e) => updateSpecPrice(key, val, parseFloat(e.target.value))}
                                      className="w-20 bg-white border border-gray-200 px-2 py-1 text-[10px] focus:border-brand-accent outline-none"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => removeSpecValue(key, idx)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors self-start mt-1"
                                  title="Remove Value"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button 
                              type="button"
                              onClick={() => addSpecValue(key)}
                              className="flex items-center justify-center space-x-2 p-2 border border-dashed border-gray-300 text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:border-brand-accent hover:text-brand-accent transition-all"
                            >
                              <Plus size={12} />
                              <span>Add Value</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(editingProduct?.specs || {}).length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">No specifications added yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Incompatibility Rules Section */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Incompatibility Rules</label>
                    <p className="text-[9px] text-gray-400 uppercase tracking-tight">Prevent certain combinations of specs.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={addSpecRule}
                    className="p-2 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white transition-all rounded-sm flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    <Plus size={14} />
                    <span>Add Rule</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(editingProduct?.spec_rules || []).map((rule, index) => (
                    <div key={index} className="bg-brand-muted p-4 border border-gray-100 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">If Spec</label>
                          <select 
                            value={rule.if_spec}
                            onChange={(e) => updateSpecRule(index, 'if_spec', e.target.value)}
                            className="w-full bg-white border border-gray-200 px-3 py-2 text-xs outline-none"
                          >
                            <option value="">Select Spec</option>
                            {Object.keys(editingProduct?.specs || {}).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                          <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Is Value</label>
                          <select 
                            value={rule.if_value}
                            onChange={(e) => updateSpecRule(index, 'if_value', e.target.value)}
                            className="w-full bg-white border border-gray-200 px-3 py-2 text-xs outline-none"
                          >
                            <option value="">Select Value</option>
                            {rule.if_spec && (editingProduct?.specs?.[rule.if_spec] as string[] || []).map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Then Not Spec</label>
                          <select 
                            value={rule.then_not_spec}
                            onChange={(e) => updateSpecRule(index, 'then_not_spec', e.target.value)}
                            className="w-full bg-white border border-gray-200 px-3 py-2 text-xs outline-none"
                          >
                            <option value="">Select Spec</option>
                            {Object.keys(editingProduct?.specs || {}).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                          <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Is Value</label>
                          <select 
                            value={rule.then_not_value}
                            onChange={(e) => updateSpecRule(index, 'then_not_value', e.target.value)}
                            className="w-full bg-white border border-gray-200 px-3 py-2 text-xs outline-none"
                          >
                            <option value="">Select Value</option>
                            {rule.then_not_spec && (editingProduct?.specs?.[rule.then_not_spec] as string[] || []).map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button 
                          type="button"
                          onClick={() => removeSpecRule(index)}
                          className="text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center space-x-1"
                        >
                          <Trash2 size={12} />
                          <span>Remove Rule</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>{editingProduct?.id ? 'Update Product' : 'Create Product'}</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
