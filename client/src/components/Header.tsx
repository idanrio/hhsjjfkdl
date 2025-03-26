import React, { useState } from 'react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
        <div className="flex items-center">
          <div className="text-primary text-2xl">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="ml-2 text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Capitalure
          </div>
        </div>

        <nav className="hidden md:block">
          <ul className="flex">
            <li className="ml-10 first:ml-0">
              <a href="#" className="font-medium relative nav-link hover:text-primary-light">Home</a>
            </li>
            <li className="ml-10">
              <a href="#features" className="font-medium relative nav-link hover:text-primary-light">Features</a>
            </li>
            <li className="ml-10">
              <a href="#markets" className="font-medium relative nav-link hover:text-primary-light">Markets</a>
            </li>
            <li className="ml-10">
              <a href="#contact" className="font-medium relative nav-link hover:text-primary-light">Contact</a>
            </li>
          </ul>
        </nav>

        <div className="flex gap-4">
          <button className="hidden sm:block border-2 border-primary px-5 py-2 rounded font-semibold hover:bg-primary transition-all duration-300">
            Login
          </button>
          <button className="bg-primary px-5 py-2 rounded font-semibold hover:bg-primary-light transition-all duration-300">
            Sign Up
          </button>
          <button 
            className="md:hidden text-xl"
            onClick={toggleMenu}
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} bg-black/95 w-full absolute top-full left-0 border-b border-white/10`}>
        <nav className="px-4 py-5">
          <ul className="space-y-4">
            <li>
              <a 
                href="#" 
                className="block py-2 font-medium hover:text-primary-light"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="#features" 
                className="block py-2 font-medium hover:text-primary-light"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
            </li>
            <li>
              <a 
                href="#markets" 
                className="block py-2 font-medium hover:text-primary-light"
                onClick={() => setIsMenuOpen(false)}
              >
                Markets
              </a>
            </li>
            <li>
              <a 
                href="#contact" 
                className="block py-2 font-medium hover:text-primary-light"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
