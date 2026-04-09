import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-24 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <XCircle size={40} />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Payment Cancelled</h1>
        <p className="text-gray-500 mb-12 leading-relaxed">
          Your payment was cancelled. No charges were made. 
          If you have any questions, please contact our support team.
        </p>
        <div className="space-y-4">
          <Link to="/cart" className="btn-primary w-full flex items-center justify-center space-x-2">
            <ShoppingBag size={20} />
            <span>Return to Cart</span>
          </Link>
          <Link to="/shop" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center justify-center">
            Continue Shopping <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
