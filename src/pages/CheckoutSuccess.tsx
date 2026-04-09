import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

export default function CheckoutSuccess() {
  useEffect(() => {
    // In a real app, you would clear the cart here
    localStorage.removeItem('cart');
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-24 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={40} />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Payment Successful!</h1>
        <p className="text-gray-500 mb-12 leading-relaxed">
          Thank you for your purchase. Your order has been received and is being processed. 
          You will receive a confirmation email shortly.
        </p>
        <div className="space-y-4">
          <Link to="/shop" className="btn-primary w-full flex items-center justify-center space-x-2">
            <ShoppingBag size={20} />
            <span>Continue Shopping</span>
          </Link>
          <Link to="/" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center justify-center">
            Back to Home <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
