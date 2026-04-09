import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Heart, MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';

interface SiteContent {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'image';
}

export default function About() {
  const [content, setContent] = useState<Record<string, string>>({
    'about_hero_image': 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80&w=1920',
    'about_who_we_are_image': 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200',
    'about_mission_image': 'https://images.unsplash.com/photo-1584285418504-0052ec244a7b?auto=format&fit=crop&q=80&w=1200',
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .filter('key', 'like', 'about_%');
    
    if (data) {
      const newContent = { ...content };
      data.forEach((item: SiteContent) => {
        newContent[item.key] = item.value;
      });
      setContent(newContent);
    }
  };

  return (
    <div className="flex flex-col bg-white">
      <Helmet>
        <title>Our Story | 65GUNS Firearms</title>
        <meta name="description" content="Learn about 65GUNS, a family-owned FFL in Bowie, Texas. Founded on honesty, integrity, and a legacy of service." />
        <link rel="canonical" href={`${window.location.origin}/about`} />
      </Helmet>
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-50">
          <img 
            src={content['about_hero_image']} 
            alt="About Us Hero" 
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
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">Our Story</h1>
            <p className="text-xl text-brand-accent font-bold uppercase tracking-widest">Built on Service, Shaped by Sacrifice</p>
          </motion.div>
        </div>
      </section>

      {/* Main Story Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center space-x-2 text-brand-accent font-bold uppercase tracking-widest text-sm">
                <span className="w-8 h-[1px] bg-brand-accent"></span>
                <span>The 65Guns Story</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                Honesty, Integrity, <br /> and Family Values.
              </h2>
              <div className="prose prose-lg text-gray-600 max-w-none space-y-6">
                <p>
                  65Guns is a small, family-run FFL based in Bowie, Texas. Founded by a 23-year fire service veteran, we started this business to honor our late son-in-law—a sheriff’s deputy killed in the line of duty.
                </p>
                <p>
                  Our mission is simple: offer honest prices, reliable gear, and treat every customer like a neighbor. Whether you're buying your first firearm or your fiftieth, we’re here to make the process smooth, secure, and straight-up.
                </p>
                <p className="font-bold text-brand-primary italic">
                  “Thanks for being a part of it.” – Daniel Byler, Owner, 65Guns
                </p>
              </div>
            </motion.div>
            <div className="relative aspect-square lg:aspect-[4/5] bg-brand-muted overflow-hidden">
              <img 
                src={content['about_who_we_are_image']} 
                alt="The Byler Family" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-24 bg-brand-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative aspect-square lg:aspect-[4/5] bg-white overflow-hidden shadow-xl">
              <img 
                src={content['about_mission_image']} 
                alt="Our Mission" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Who We Are</h2>
              <div className="prose prose-lg text-gray-600 max-w-none space-y-6">
                <p>
                  We're the Byler family — proud Texans, public servants, and the folks behind 65Guns.
                </p>
                <p>
                  With over two decades in the fire service and a deep respect for those who serve and protect, this business is personal for us. Inspired by our son-in-law, a fallen deputy, we set out to build a place where honest people can buy quality firearms at fair prices — backed by integrity and family values.
                </p>
                <p>
                  Whether you're shopping for your first handgun or just need someone you can trust, welcome — we're glad you're here.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-24 bg-brand-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto space-y-12"
          >
            <div className="inline-block p-4 bg-brand-accent/10 rounded-full mb-4">
              <Shield className="text-brand-accent" size={48} />
            </div>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter">Our Mission</h2>
            <div className="space-y-8 text-xl text-gray-300 leading-relaxed">
              <p>
                At 65Guns, this isn’t just business — it’s personal.
              </p>
              <p>
                We’re a family-owned firearms dealer founded on service, shaped by sacrifice, and driven by purpose. The badge you see here belonged to our son-in-law, a Wise County Sheriff’s Deputy who gave his life in the line of duty. His legacy reminds us every day why we do this.
              </p>
              <p>
                Our mission is to serve the good folks who stand the line — law enforcement, first responders, and responsible citizens — with fair prices, real honesty, and gear you can count on.
              </p>
            </div>
            <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <p className="text-3xl font-black text-brand-accent uppercase tracking-tighter">Family</p>
                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">The Heart of 65Guns</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-black text-brand-accent uppercase tracking-tighter">Service</p>
                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Our Lifelong Commitment</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-black text-brand-accent uppercase tracking-tighter">Legacy</p>
                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Honoring the Fallen</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 text-brand-accent font-bold uppercase tracking-widest text-sm">
                <MapPin size={18} />
                <span>Visit Us in Bowie, Texas</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Come See Us.</h2>
              <p className="text-lg text-gray-600">
                We're located in the heart of Bowie, Texas. Whether you're local or just passing through, we'd love to meet you and help you find exactly what you're looking for.
              </p>
              <div className="p-8 bg-brand-muted border border-gray-100 space-y-4">
                <p className="font-bold uppercase tracking-widest text-xs text-gray-400">Our Location</p>
                <div className="space-y-1">
                  <p className="text-xl font-bold uppercase tracking-tight">65GUNS</p>
                  <p className="text-lg font-medium text-gray-700">346 BRAZOS ST</p>
                  <p className="text-lg font-medium text-gray-700">Bowie, Texas 76230</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="font-bold uppercase tracking-widest text-xs text-gray-400 mb-1">Phone</p>
                  <p className="text-xl font-bold text-brand-accent">(940) 224-3477</p>
                </div>
              </div>
            </div>
            <div className="h-[500px] w-full bg-gray-100 shadow-2xl relative overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13304.59477042071!2d-97.85974635!3d33.55845115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864d930f7b1f7b1f%3A0x7b1f7b1f7b1f7b1f!2sBowie%2C%20TX%2076230!5e0!3m2!1sen!2sus!4v1711311311311!5m2!1sen!2sus" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Bowie, Texas Map"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
