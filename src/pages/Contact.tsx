import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, MapPin, Mail, Clock, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { OptimizedImage } from '../components/OptimizedImage';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      toast.error('Contact form is not configured. Please add VITE_WEB3FORMS_ACCESS_KEY to your environment.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: accessKey,
          name: formValues.name,
          email: formValues.email,
          subject: `TX65 Contact: ${formValues.subject || 'General Inquiry'}`,
          message: formValues.message,
          from_name: 'TX65 Precision Website'
        })
      });

      const result = await response.json();
      if (result.success) {
        setIsSubmitted(true);
        toast.success('Message sent successfully!');
        setFormValues({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Web3Forms Error:', error);
      toast.error(error.message || 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <OptimizedImage 
            src="https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80&w=1920" 
            alt="Contact Us Hero" 
            containerClassName="w-full h-full"
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

            {/* Map & Form */}
            <div className="space-y-12">
              <div className="h-[400px] w-full bg-gray-100 shadow-2xl relative overflow-hidden">
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

              <div className="bg-brand-muted p-8 md:p-12 border border-gray-100">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Send a Message</h3>
                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={40} />
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tight">Message Sent</h4>
                    <p className="text-gray-500 max-w-xs mx-auto">
                      Thank you for contacting us. We'll get back to you as soon as possible.
                    </p>
                    <button 
                      onClick={() => setIsSubmitted(false)}
                      className="text-xs font-black uppercase tracking-widest text-brand-accent hover:text-black transition-colors"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={formValues.name}
                          onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="John Doe" 
                          className="input-field bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={formValues.email}
                          onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@example.com" 
                          className="input-field bg-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</label>
                      <input 
                        type="text" 
                        value={formValues.subject}
                        onChange={(e) => setFormValues(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="How can we help?" 
                        className="input-field bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Message</label>
                      <textarea 
                        rows={5} 
                        required
                        value={formValues.message}
                        onChange={(e) => setFormValues(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Your message here..." 
                        className="input-field bg-white resize-none"
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="btn-primary w-full py-4 text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center space-x-3"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
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
