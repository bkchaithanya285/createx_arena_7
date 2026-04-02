import React from 'react';
import { Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full relative z-40 bg-black/80 backdrop-blur-2xl border-t border-white/5 pb-4 pt-6 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Social Bar */}
        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/csi_kare?igsh=bXhtNXd6anRhaXVw"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 glass-card !rounded-full hover:bg-white/10 hover:border-arena-rose/50 transition-all group"
          >
            <Instagram className="w-5 h-5 text-white group-hover:text-arena-rose transition-colors" />
          </a>
          
          <a
            href="https://www.linkedin.com/company/csi-kare/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 glass-card !rounded-full hover:bg-white/10 hover:border-arena-rose/50 transition-all group"
          >
            <Linkedin className="w-5 h-5 text-white group-hover:text-arena-rose transition-colors" />
          </a>
        </div>

        {/* Logos Container */}
        <div className="flex items-center gap-6">
           <img src="/kare_logo.png" alt="KARE Logo" className="h-10 object-contain drop-shadow-lg opacity-90" />
           <div className="h-8 w-px bg-white/20" />
           <img src="/club_logo.png" alt="CSI Club Info" className="h-10 object-contain drop-shadow-lg opacity-90" />
        </div>

        {/* Footer Content */}
        <p className="text-arena-muted text-xs font-black uppercase tracking-[0.3em] text-center md:text-right">
          Built by Web Dev Team CSI KARE with <span className="text-arena-rose animate-pulse">❤️</span>
        </p>

      </div>
    </footer>
  );
};

export default Footer;
