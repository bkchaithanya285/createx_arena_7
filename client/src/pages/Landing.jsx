import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Shield, QrCode, ClipboardList, Gamepad2, HelpCircle, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';

const Landing = () => {
  const navigate = useNavigate();

  const guidelines = [
    {
      title: '🛠️ Requesting Assistance',
      icon: <HelpCircle className="w-6 h-6 text-arena-rose" />,
      desc: 'Use "Request Help" button. Volunteers notified instantly. Status in Feed.'
    },
    {
      title: '🔐 Credentials',
      icon: <Shield className="w-6 h-6 text-arena-rose" />,
      desc: 'ID cards mandatory. Password = Lead Reg No. Do NOT share.'
    },
    {
      title: '📷 Attendance',
      icon: <QrCode className="w-6 h-6 text-arena-rose" />,
      desc: 'QR-based attendance. Multiple checkpoints. Keep QR ready.'
    },
    {
      title: '🧩 Selection Flow',
      icon: <ClipboardList className="w-6 h-6 text-arena-rose" />,
      desc: 'Reveal (Titles) -> Admin Details -> Timer -> Final Selection.'
    },
    {
      title: '🎮 Game Hub',
      icon: <Gamepad2 className="w-6 h-6 text-arena-rose" />,
      desc: 'Memory, Jigsaw, Color Code. One attempt per team. Top scores win!'
    }
  ];

  return (
    <div className="min-h-screen relative selection:bg-arena-rose selection:text-white overflow-hidden">
      {/* Dynamic Background Noise/Mesh Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 px-8 py-5 flex items-center justify-between backdrop-blur-3xl border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white p-1 rounded-lg flex items-center justify-center">
            <img src="/kare_logo.png" alt="KARELogo" className="h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase wine-glow">CREATEX</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-arena-muted font-black tracking-widest border border-white/10 px-3 py-1 rounded-full uppercase flex items-center gap-2">
            <img src="/club_logo.png" alt="CSILogo" className="h-6 object-contain" />
            CSI Club
          </span>
          <div className="w-10 h-10 bg-arena-wine rounded-lg flex items-center justify-center shadow-wine-glow">
             <Rocket className="w-5 h-5 text-white" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6 flex flex-col items-center justify-center text-center">
        {/* Decorative Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-arena-wine/30 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-arena-rose/20 rounded-full blur-[120px] animate-pulse-slow" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-4 mb-6 px-4 py-1 rounded-full border border-arena-rose/30 bg-arena-rose/5">
             <img src="/createx_logo.png" alt="CREATEXLogo" className="h-8 object-contain" />
             <span className="text-xs font-black uppercase tracking-[0.3em] text-arena-rose animate-pulse">Live Arena Entry Open</span>
          </div>
          
          <h1 className="text-6xl sm:text-9xl font-black mb-6 tracking-tighter uppercase leading-none">
            <span className="text-white">CREATEX</span><br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-arena-rose via-white to-arena-wine drop-shadow-2xl">ARENA</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-arena-muted mb-12 font-light tracking-[.25em] uppercase max-w-2xl mx-auto italic">
            Where <span className="text-white font-bold not-italic">Innovation</span> Assembles
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="glass-button min-w-[240px] text-xl py-5 group"
            >
              <div className="flex items-center justify-center gap-3">
                🚀 Launch Arena <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
            
            <div className="flex items-center gap-4 px-6 py-4 glass-premium !bg-transparent !rounded-full border-white/5">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-arena-bg bg-arena-wine flex items-center justify-center text-[10px] font-bold">T{i}</div>
                ))}
              </div>
              <span className="text-xs text-white/60 font-medium uppercase tracking-widest">109 Teams Active</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Guidelines Section */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto z-10">
        <div className="flex items-center gap-6 mb-16">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <h3 className="text-3xl font-black text-white wine-glow uppercase tracking-[0.4em]">Protocol</h3>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {guidelines.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="glass-premium p-10 flex flex-col items-start gap-6 border-l-4 border-l-arena-wine"
            >
              <div className="p-4 bg-white/5 rounded-2xl text-arena-rose shadow-rose-glow">
                {item.icon}
              </div>
              <div>
                <h4 className="text-lg font-black uppercase tracking-widest text-white mb-3">{item.title}</h4>
                <p className="text-sm text-arena-muted leading-relaxed font-normal uppercase tracking-wider">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
