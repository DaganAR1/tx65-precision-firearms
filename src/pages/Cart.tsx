import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, Loader2, MapPin, CreditCard, CheckCircle2, ChevronLeft, Search, Info, Target } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { formatPrice, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const TAX_RATES: Record<string, number> = {
  'AL': 0.04, 'AK': 0.00, 'AZ': 0.056, 'AR': 0.065, 'CA': 0.0725, 'CO': 0.029, 'CT': 0.0635, 'DE': 0.00, 'FL': 0.06, 'GA': 0.04,
  'HI': 0.04, 'ID': 0.06, 'IL': 0.0625, 'IN': 0.07, 'IA': 0.06, 'KS': 0.065, 'KY': 0.06, 'LA': 0.0445, 'ME': 0.055, 'MD': 0.06,
  'MA': 0.0625, 'MI': 0.06, 'MN': 0.06875, 'MS': 0.07, 'MO': 0.04225, 'MT': 0.00, 'NE': 0.055, 'NV': 0.0685, 'NH': 0.00, 'NJ': 0.06625,
  'NM': 0.05125, 'NY': 0.04, 'NC': 0.0475, 'ND': 0.05, 'OH': 0.0575, 'OK': 0.045, 'OR': 0.00, 'PA': 0.06, 'RI': 0.07, 'SC': 0.06,
  'SD': 0.045, 'TN': 0.07, 'TX': 0.0625, 'UT': 0.0485, 'VT': 0.06, 'VA': 0.043, 'WA': 0.065, 'WV': 0.06, 'WI': 0.05, 'WY': 0.04
};

export default function Cart() {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { cartItems, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();
  
  const [deliveryType, setDeliveryType] = useState<'shipping' | 'pickup'>('shipping');
  const [fflSearchZip, setFflSearchZip] = useState('');
  const [fflResults, setFflResults] = useState<any[]>([]);
  const [selectedFFL, setSelectedFFL] = useState<any | null>(null);
  const [isSearchingFFL, setIsSearchingFFL] = useState(false);
  const [searchRadius, setSearchRadius] = useState('25');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    promoCode: '',
    shippingMethod: 'insured'
  });

  const SHIPPING_COSTS: Record<string, number> = {
    'standard': 15.00,
    'insured': 25.00,
    'expedited': 45.00
  };

  const productShippingTotal = cartItems.reduce((sum, item) => sum + (item.shipping_price || 0) * item.quantity, 0);
  const shipping = deliveryType === 'pickup' ? 0 : (productShippingTotal > 0 ? productShippingTotal : SHIPPING_COSTS[formData.shippingMethod]);
  const taxRate = TAX_RATES[formData.state] || 0;
  const discount = formData.promoCode.toUpperCase() === 'PRECISION' ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * taxRate;
  const total = subtotal - discount + shipping + tax;

  const hasFirearms = cartItems.some(item => ['Rifles', 'Pistols'].includes(item.category));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    
    if (hasFirearms && deliveryType === 'shipping' && !selectedFFL) {
      toast.error('Please select an FFL dealer for firearm transfer');
      return;
    }

    setIsCheckingOut(true);

    // 1. Get current user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let shippingAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`;
    let fflInfo = null;

    if (hasFirearms && deliveryType === 'shipping' && selectedFFL) {
      shippingAddress = `FFL TRANSFER: ${selectedFFL.name}, ${selectedFFL.address}, ${selectedFFL.city}, ${selectedFFL.state} ${selectedFFL.zip}`;
      fflInfo = selectedFFL;
    } else if (deliveryType === 'pickup') {
      shippingAddress = 'IN-STORE PICKUP: 346 BRAZOS ST, Bowie, Texas 76230';
    }

    const orderData = {
      userId: userId || 'guest',
      total,
      items: cartItems,
      shippingAddress,
      customerEmail: formData.email,
      customerName: `${formData.firstName} ${formData.lastName}`,
      fflInfo,
      deliveryType
    };

    // 2. Tokenize card data with Accept.js
    const authData = {
      clientKey: import.meta.env.VITE_AUTHORIZENET_CLIENT_KEY,
      apiLoginID: import.meta.env.VITE_AUTHORIZENET_API_LOGIN_ID,
    };

    console.log('Initializing payment tokenization...');
    if (!authData.clientKey || !authData.apiLoginID) {
      console.error('Missing Authorize.net configuration:', { 
        hasClientKey: !!authData.clientKey, 
        hasApiLoginId: !!authData.apiLoginID 
      });
      setIsCheckingOut(false);
      toast.error('Payment configuration is missing. Please check your admin settings.');
      return;
    }

    const cardData = {
      cardNumber: formData.cardNumber.replace(/\s/g, ''),
      month: formData.expiryMonth,
      year: formData.expiryYear,
      cardCode: formData.cvc,
    };

    const secureData = {
      authData,
      cardData,
    };

    // @ts-ignore
    if (!window.Accept) {
      console.error('Accept.js not loaded');
      setIsCheckingOut(false);
      toast.error('Payment system failed to load. Please refresh the page.');
      return;
    }

    // Safety timeout: if Accept.js doesn't respond in 15 seconds, stop the spinner
    const timeoutId = setTimeout(() => {
      console.error('Accept.js tokenization timed out');
      setIsCheckingOut(false);
      toast.error('Payment processing timed out. Please check your connection and try again.');
    }, 15000);

    // @ts-ignore
    window.Accept.dispatch(secureData, async (response: any) => {
      clearTimeout(timeoutId);
      console.log('Accept.js response received:', response.messages.resultCode);

      if (response.messages.resultCode === "Error") {
        setIsCheckingOut(false);
        const error = response.messages.message[0];
        const errorMsg = error.text || 'Failed to tokenize payment information';
        const errorCode = error.code;
        
        console.error('Accept.js Error:', errorMsg, errorCode);
        
        // Provide more user-friendly explanations for common error codes
        let friendlyMsg = errorMsg;
        if (errorCode === 'E_WC_05') friendlyMsg = 'Invalid card number. Please check and try again.';
        if (errorCode === 'E_WC_06') friendlyMsg = 'Invalid expiration date. Please check the month and year.';
        if (errorCode === 'E_WC_07') friendlyMsg = 'Invalid CVC code. Please check the 3 or 4 digit code on your card.';
        if (errorCode === 'E_WC_15') friendlyMsg = 'Transaction declined by your bank. Please contact them or use a different card.';
        
        toast.error(friendlyMsg);
        return;
      }

      if (!response.opaqueData) {
        setIsCheckingOut(false);
        toast.error('Failed to generate secure payment token. Please try again.');
        return;
      }

      // 3. Send token to server to process payment
      try {
        const processResponse = await fetch('/api/process-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opaqueData: response.opaqueData,
            orderData
          }),
        });

        const result = await processResponse.json();
        if (result.success) {
          toast.success('Order placed successfully!');
          clearCart();
          window.location.href = '/checkout/success';
        } else {
          throw new Error(result.error || 'Payment processing failed');
        }
      } catch (error: any) {
        console.error('Payment processing error:', error);
        toast.error(error.message || 'Failed to process payment. Please try again.');
      } finally {
        setIsCheckingOut(false);
      }
    });
  };

  const searchFFL = async () => {
    if (!fflSearchZip || fflSearchZip.length < 5) {
      toast.error('Please enter a valid ZIP code');
      return;
    }
    setIsSearchingFFL(true);

    try {
      const { data, error } = await supabase
        .from('ffl_dealers')
        .select('*')
        .eq('premise_zip', fflSearchZip)
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        const dealers = data.map((d: any) => ({
          id: d.id,
          name: d.business_name || d.license_name || 'Unknown Dealer',
          address: d.premise_street,
          city: d.premise_city,
          state: d.premise_state,
          zip: d.premise_zip,
          ffl_number: d.license_number,
          distance: 'Local',
          phone: d.phone_number || 'N/A',
          transfer_fee: 'Contact Dealer'
        }));
        setFflResults(dealers);
        toast.success(`Found ${dealers.length} dealers in ${fflSearchZip}`);
      } else {
        setFflResults([]);
        toast.error(`No FFL dealers found in ZIP code ${fflSearchZip}. Try a nearby ZIP.`);
      }
    } catch (error) {
      console.error('FFL Search Error:', error);
      toast.error('Failed to search FFL dealers. Please try again.');
    } finally {
      setIsSearchingFFL(false);
    }
  };

  if (cartItems.length === 0 && step === 'cart') {
    return (
      <div className="min-h-screen bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-200 mb-6" />
          <p className="text-gray-400 font-medium mb-8">Your cart is currently empty.</p>
          <Link to="/shop" className="btn-primary inline-block">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-24">
      <Helmet>
        <title>{step === 'cart' ? 'Your Cart' : 'Secure Checkout'} | 65GUNS</title>
        <meta name="description" content="Secure checkout for premium firearms and accessories at 65GUNS." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Stepper */}
        <div className="flex items-center justify-center mb-16 space-x-4">
          <div className={cn("flex items-center space-x-2", step === 'cart' ? "text-black" : "text-gray-400")}>
            <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2", step === 'cart' ? "border-black bg-black text-white" : "border-gray-200")}>1</span>
            <span className="text-xs font-black uppercase tracking-widest">Cart</span>
          </div>
          <div className="w-12 h-px bg-gray-200" />
          <div className={cn("flex items-center space-x-2", step === 'checkout' ? "text-black" : "text-gray-400")}>
            <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2", step === 'checkout' ? "border-black bg-black text-white" : "border-gray-200")}>2</span>
            <span className="text-xs font-black uppercase tracking-widest">Checkout</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {step === 'cart' ? (
                <motion.div
                  key="cart-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <h1 className="text-5xl font-black uppercase tracking-tighter mb-12">Your Cart</h1>
                  <div className="space-y-6">
                    {cartItems.map((item) => (
                      <div key={(item as any).cartItemId || item.id} className="flex items-center space-x-6 py-6 border-b border-gray-100">
                        <div className="w-24 h-24 bg-brand-muted overflow-hidden flex-shrink-0">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">{item.category}</span>
                          <h3 className="text-lg font-bold uppercase tracking-tight mb-1">{item.name}</h3>
                          {item.selectedOptions && Object.entries(item.selectedOptions).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {Object.entries(item.selectedOptions).map(([k, v]) => (
                                <span key={k} className="text-[9px] font-bold uppercase tracking-widest bg-gray-100 px-2 py-0.5 text-gray-500">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center border border-gray-200">
                              <button 
                                onClick={() => updateQuantity((item as any).cartItemId || item.id, item.quantity - 1)}
                                className="px-2 py-1 hover:bg-gray-50"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 text-xs font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity((item as any).cartItemId || item.id, item.quantity + 1)}
                                className="px-2 py-1 hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold mb-2">{formatPrice(item.finalPrice || item.price)}</p>
                          <button onClick={() => removeFromCart((item as any).cartItemId || item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-8">
                    <Link to="/shop" className="text-sm font-bold uppercase tracking-widest text-brand-accent hover:text-black transition-colors flex items-center">
                      <ArrowRight size={16} className="mr-2 rotate-180" /> Continue Shopping
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="checkout-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <button 
                    onClick={() => setStep('cart')}
                    className="flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                  >
                    <ChevronLeft size={16} className="mr-1" /> Back to Cart
                  </button>

                  <form onSubmit={handleCheckout} className="space-y-12">
                    {/* Delivery Type Selection */}
                    <section className="bg-brand-muted p-8 border border-gray-100">
                      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Delivery Type</h2>
                      <div className="flex flex-wrap gap-6">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="deliveryType" 
                            checked={deliveryType === 'shipping'} 
                            onChange={() => setDeliveryType('shipping')}
                            className="w-5 h-5 border-2 border-gray-300 text-brand-accent focus:ring-brand-accent"
                          />
                          <span className={cn("text-sm font-bold uppercase tracking-tight transition-colors", deliveryType === 'shipping' ? "text-black" : "text-gray-400 group-hover:text-gray-600")}>Shipping</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="deliveryType" 
                            checked={deliveryType === 'pickup'} 
                            onChange={() => setDeliveryType('pickup')}
                            className="w-5 h-5 border-2 border-gray-300 text-brand-accent focus:ring-brand-accent"
                          />
                          <span className={cn("text-sm font-bold uppercase tracking-tight transition-colors", deliveryType === 'pickup' ? "text-black" : "text-gray-400 group-hover:text-gray-600")}>In Store Pickup</span>
                        </label>
                      </div>
                    </section>

                    {/* FFL Transfer Section */}
                    {hasFirearms && deliveryType === 'shipping' && (
                      <section className="space-y-8">
                        <div className="flex items-center space-x-3">
                          <Target className="text-brand-accent" size={24} />
                          <h2 className="text-2xl font-black uppercase tracking-tight">Firearms Transfer Information</h2>
                          <div className="group relative">
                            <Info size={16} className="text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-black text-white text-[10px] leading-relaxed font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                              In the U.S., firearms may only be shipped to federally licensed firearms dealers (FFL). You must select a dealer where you will visit to complete the background check and pickup.
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border-2 border-brand-muted p-8 space-y-8">
                          <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-tighter">
                            Any individual purchasing a firearm online MUST select a Federal Firearms Licensee (FFL) located within his/her state of residency where s/he will visit in order to complete the process for an over the counter purchase of a firearm.
                          </p>

                          <div className="space-y-6">
                            <div className="space-y-4">
                              <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="radio" checked className="w-4 h-4 text-brand-accent" readOnly />
                                <span className="text-xs font-bold uppercase tracking-widest">Search For FFL By Zip Code</span>
                              </label>
                              
                              <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                  <input 
                                    type="text" 
                                    value={fflSearchZip}
                                    onChange={(e) => setFflSearchZip(e.target.value)}
                                    placeholder="Enter Zip Code *" 
                                    className="input-field !border-brand-accent !ring-brand-accent"
                                  />
                                </div>
                                <div className="w-full md:w-48">
                                  <select 
                                    value={searchRadius}
                                    onChange={(e) => setSearchRadius(e.target.value)}
                                    className="input-field"
                                  >
                                    <option value="10">10 miles</option>
                                    <option value="25">25 miles</option>
                                    <option value="50">50 miles</option>
                                    <option value="100">100 miles</option>
                                  </select>
                                </div>
                                <button 
                                  type="button"
                                  onClick={searchFFL}
                                  disabled={isSearchingFFL}
                                  className="btn-primary flex items-center justify-center space-x-2 px-8"
                                >
                                  {isSearchingFFL ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                                  <span>Search</span>
                                </button>
                              </div>
                            </div>

                            {/* FFL Results */}
                            {fflResults.length > 0 && (
                              <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Select a Dealer</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {fflResults.map((dealer) => (
                                    <button
                                      key={dealer.id}
                                      type="button"
                                      onClick={() => setSelectedFFL(dealer)}
                                      className={cn(
                                        "p-4 border-2 text-left transition-all relative group",
                                        selectedFFL?.id === dealer.id ? "border-brand-accent bg-brand-accent/5" : "border-gray-100 hover:border-gray-200"
                                      )}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <p className="font-black uppercase tracking-tight text-sm">{dealer.name}</p>
                                        <span className="text-[10px] font-bold text-brand-accent">{dealer.distance}</span>
                                      </div>
                                      <p className="text-xs text-gray-500 mb-1">{dealer.address}</p>
                                      <p className="text-xs text-gray-500 mb-2">{dealer.city}, {dealer.state} {dealer.zip}</p>
                                      {dealer.ffl_number && (
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">FFL: {dealer.ffl_number}</span>
                                          <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Fee: {dealer.transfer_fee}</span>
                                        </div>
                                      )}
                                      {selectedFFL?.id === dealer.id && (
                                        <div className="absolute top-2 right-2">
                                          <CheckCircle2 size={16} className="text-brand-accent" />
                                        </div>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Map Placeholder */}
                            <div className="aspect-video bg-gray-100 relative overflow-hidden group">
                              <iframe 
                                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13304.59477042071!2d-97.85974635!3d33.55845115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864d930f7b1f7b1f%3A0x7b1f7b1f7b1f7b1f!2sBowie%2C%20TX%2076230!5e0!3m2!1sen!2sus!4v1711311311311!5m2!1sen!2sus`} 
                                width="100%" 
                                height="100%" 
                                style={{ border: 0 }} 
                                allowFullScreen={true} 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                                title="FFL Dealer Map"
                                className="grayscale group-hover:grayscale-0 transition-all duration-700"
                              ></iframe>
                              <div className="absolute inset-0 pointer-events-none border-4 border-brand-muted"></div>
                            </div>
                            
                            <p className="text-[10px] text-right text-gray-400 font-bold uppercase tracking-widest">
                              Powered By <span className="text-brand-accent">FFLs.com</span>
                            </p>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Shipping Section */}
                    <section>
                      <div className="flex items-center space-x-3 mb-8">
                        <MapPin className="text-brand-accent" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight">Shipping Information</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">First Name</label>
                          <input required name="firstName" value={formData.firstName} onChange={handleInputChange} className="input-field" placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last Name</label>
                          <input required name="lastName" value={formData.lastName} onChange={handleInputChange} className="input-field" placeholder="Doe" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                          <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field" placeholder="john@example.com" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Street Address</label>
                          <input required name="address" value={formData.address} onChange={handleInputChange} className="input-field" placeholder="123 Precision Way" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">City</label>
                          <input required name="city" value={formData.city} onChange={handleInputChange} className="input-field" placeholder="Austin" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">State</label>
                            <select required name="state" value={formData.state} onChange={handleInputChange} className="input-field appearance-none">
                              <option value="">Select</option>
                              {Object.keys(TAX_RATES).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">ZIP Code</label>
                            <input required name="zip" value={formData.zip} onChange={handleInputChange} className="input-field" placeholder="78701" />
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shipping Method</label>
                          {deliveryType === 'pickup' ? (
                            <div className="p-4 bg-brand-accent/5 border-2 border-brand-accent/20">
                              <p className="text-xs font-bold uppercase tracking-widest text-brand-accent">In-Store Pickup Selected</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">No shipping charges apply.</p>
                            </div>
                          ) : productShippingTotal > 0 ? (
                            <div className="p-4 bg-brand-accent/5 border-2 border-brand-accent/20">
                              <p className="text-xs font-bold uppercase tracking-widest text-brand-accent">Per-Product Shipping Applied</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Shipping is calculated based on the specific items in your cart.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {Object.entries(SHIPPING_COSTS).map(([key, cost]) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, shippingMethod: key }))}
                                  className={cn(
                                    "p-4 border-2 text-left transition-all",
                                    formData.shippingMethod === key ? "border-black bg-black text-white" : "border-gray-100 hover:border-gray-200"
                                  )}
                                >
                                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">{key}</p>
                                  <p className="text-sm font-bold">{formatPrice(cost)}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Payment Section */}
                    <section>
                      <div className="flex items-center space-x-3 mb-8">
                        <CreditCard className="text-brand-accent" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight">Secure Payment</h2>
                      </div>
                      <div className="bg-brand-muted p-8 border border-gray-100 space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Card Number</label>
                          <input required name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} className="input-field bg-white" placeholder="0000 0000 0000 0000" />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Exp Month (MM)</label>
                            <input required name="expiryMonth" value={formData.expiryMonth} onChange={handleInputChange} className="input-field bg-white" placeholder="12" maxLength={2} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Exp Year (YYYY)</label>
                            <input required name="expiryYear" value={formData.expiryYear} onChange={handleInputChange} className="input-field bg-white" placeholder="2028" maxLength={4} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">CVC</label>
                            <input required name="cvc" value={formData.cvc} onChange={handleInputChange} className="input-field bg-white" placeholder="123" maxLength={4} />
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                          Card data is tokenized securely via Authorize.net. We never store your full card details on our servers.
                        </p>
                      </div>
                    </section>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-4">
            <div className="bg-brand-muted p-8 border border-gray-100 sticky top-32">
              <h3 className="text-xl font-black uppercase tracking-tight mb-8">Order Summary</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="font-bold">Discount (PRECISION)</span>
                    <span className="font-bold">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {deliveryType === 'pickup' ? 'Shipping (Pickup)' : (productShippingTotal > 0 ? 'Shipping (Per Product)' : `Shipping (${formData.shippingMethod})`)}
                  </span>
                  <span className="font-bold">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax {formData.state && `(${formData.state})`}</span>
                  <span className="font-bold">{formatPrice(tax)}</span>
                </div>
                {selectedFFL && hasFirearms && deliveryType === 'shipping' && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-2">Selected FFL Dealer</p>
                    <p className="text-xs font-bold uppercase tracking-tight">{selectedFFL.name}</p>
                    <p className="text-[10px] text-gray-500">{selectedFFL.address}, {selectedFFL.city}</p>
                  </div>
                )}
                {deliveryType === 'pickup' && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-2">Delivery Method</p>
                    <p className="text-xs font-bold uppercase tracking-tight">In-Store Pickup</p>
                    <p className="text-[10px] text-gray-500">346 BRAZOS ST, Bowie, TX</p>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200 flex justify-between">
                  <span className="font-black uppercase tracking-widest">Total</span>
                  <span className="text-xl font-black">{formatPrice(total)}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Promo Code</label>
                    <div className="flex space-x-2">
                      <input 
                        name="promoCode" 
                        value={formData.promoCode} 
                        onChange={handleInputChange} 
                        className="input-field bg-white" 
                        placeholder="Enter code" 
                      />
                    </div>
                    {formData.promoCode.toUpperCase() === 'PRECISION' && (
                      <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">10% Discount Applied</p>
                    )}
                  </div>
                  <button 
                    onClick={() => setStep('checkout')}
                    className="btn-primary w-full mb-6 flex items-center justify-center"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="btn-primary w-full mb-6 flex items-center justify-center space-x-2"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      <span>Pay {formatPrice(total)}</span>
                    </>
                  )}
                </button>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <ShieldCheck size={14} />
                  <span>Secure SSL Encrypted Checkout</span>
                </div>
                {step === 'checkout' && (
                  <div className="bg-white/50 p-4 border border-gray-100 rounded-sm">
                    <p className="text-[10px] text-center text-gray-500 leading-relaxed uppercase tracking-tighter mb-4">
                      By clicking "Pay Now", you agree to our Terms of Service and confirm you are of legal age to purchase firearms in your jurisdiction.
                    </p>
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[10px] text-center text-brand-accent font-bold leading-relaxed uppercase tracking-widest">
                        Legal Notice:
                      </p>
                      <p className="text-[9px] text-center text-gray-400 leading-relaxed mt-2 italic">
                        Please remember: You must know and follow all federal, state, and local laws before purchasing. We do not provide legal advice, and we cannot guarantee that any item is legal in your area. Always check your local laws before buying.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
