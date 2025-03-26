import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black/50 border-t border-white/10 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center mb-6">
              <div className="text-primary text-2xl">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="ml-2 text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Capitalure
              </div>
            </div>
            <p className="text-white/60 mb-6 leading-relaxed">
              Advanced trading education for aspiring and experienced traders. Learn, practice, and master the markets.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-all duration-300">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-all duration-300">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-all duration-300">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-primary">Home</a></li>
              <li><a href="#features" className="text-white/60 hover:text-primary">Features</a></li>
              <li><a href="#markets" className="text-white/60 hover:text-primary">Markets</a></li>
              <li><a href="#contact" className="text-white/60 hover:text-primary">Contact</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-primary">Trading Guides</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary">Market Analysis</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary">Education Blog</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary">Glossary</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-3 text-primary"></i>
                <span className="text-white/60">123 Trading Street, Financial District, NY 10004</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope mr-3 text-primary"></i>
                <span className="text-white/60">support@capitalure.com</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone-alt mr-3 text-primary"></i>
                <span className="text-white/60">+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <div className="text-white/50 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Capitalure. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-white/50 hover:text-primary">Privacy Policy</a>
            <a href="#" className="text-white/50 hover:text-primary">Terms of Service</a>
            <a href="#" className="text-white/50 hover:text-primary">Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
