import React from 'react';
import { motion } from 'motion/react';
import { Phone, MapPin, Mail, Clock, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Contact() {
  return (
    <div className="flex flex-col bg-white">
      <Helmet>
        <title>Contact Us | 65GUNS Firearms</title>
        <meta name="description" content="Contact 65GUNS Firearms in Bowie, Texas. Reach us by phone at (940) 224-3477 or visit our shop at 346 BRAZOS ST." />
        <link rel="canonical" href={`${window.location.origin}/contact`} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80&w=1920" 
            alt="Contact Us Hero" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">Contact Us</h1>
            <p className="text-xl text-brand-accent font-bold uppercase tracking-widest">We're Here to Help</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Get In Touch</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Have questions about a specific firearm, need help with an FFL transfer, or looking for expert advice? Reach out to us — we're a family-owned shop that values every customer.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-brand-muted border border-gray-100 space-y-4 group hover:border-brand-accent transition-colors">
                  <div className="w-12 h-12 bg-brand-primary text-white flex items-center justify-center rounded-full group-hover:bg-brand-accent transition-colors">
                    <Phone size={24} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Phone</h3>
                  <p className="text-xl font-bold text-brand-primary">(940) 224-3477</p>
                  <p className="text-sm text-gray-500">Call or text us anytime.</p>
                </div>

                <div className="p-8 bg-brand-muted border border-gray-100 space-y-4 group hover:border-brand-accent transition-colors">
                  <div className="w-12 h-12 bg-brand-primary text-white flex items-center justify-center rounded-full group-hover:bg-brand-accent transition-colors">
                    <MapPin size={24} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Location</h3>
                  <div className="text-gray-700 font-bold">
                    <p>65GUNS</p>
                    <p>346 BRAZOS ST</p>
                    <p>Bowie, Texas 76230</p>
                  </div>
                </div>

                <div className="p-8 bg-brand-muted border border-gray-100 space-y-4 group hover:border-brand-accent transition-colors">
                  <div className="w-12 h-12 bg-brand-primary text-white flex items-center justify-center rounded-full group-hover:bg-brand-accent transition-colors">
                    <Mail size={24} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Email</h3>
                  <p className="text-brand-primary font-bold">daganraye123@gmail.com</p>
                  <p className="text-sm text-gray-500">We'll get back to you within 24 hours.</p>
                </div>

                <div className="p-8 bg-brand-muted border border-gray-100 space-y-4 group hover:border-brand-accent transition-colors">
                  <div className="w-12 h-12 bg-brand-primary text-white flex items-center justify-center rounded-full group-hover:bg-brand-accent transition-colors">
                    <Clock size={24} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Hours</h3>
                  <div className="text-gray-700 font-bold">
                    <p>Mon - Fri: 9am - 6pm</p>
                    <p>Sat: 10am - 4pm</p>
                    <p>Sun: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="h-full min-h-[500px] w-full bg-gray-100 shadow-2xl relative overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13304.59477042071!2d-97.85974635!3d33.55845115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864d930f7b1f7b1f%3A0x7b1f7b1f7b1f7b1f!2sBowie%2C%20TX%2076230!5e0!3m2!1sen!2sus!4v1711311311311!5m2!1sen!2sus" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="65GUNS Location Map"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-12 bg-brand-primary text-white border-t border-brand-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-12">
          <div className="flex items-center space-x-3">
            <Shield className="text-brand-accent" size={24} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Licensed FFL Dealer</span>
          </div>
          <div className="flex items-center space-x-3">
            <Shield className="text-brand-accent" size={24} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Secure Transactions</span>
          </div>
          <div className="flex items-center space-x-3">
            <Shield className="text-brand-accent" size={24} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Family Owned & Operated</span>
          </div>
        </div>
      </section>
    </div>
  );
}
