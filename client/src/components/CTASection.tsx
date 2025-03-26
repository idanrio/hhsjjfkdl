import React, { useState } from 'react';

const CTASection: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    agreeTerms: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    console.log('Form submitted:', formData);
  };

  return (
    <section id="contact" className="py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="lg:w-1/2">
          <h2 className="text-4xl font-bold mb-5">Start Your Trading Journey Today</h2>
          <p className="text-white/70 mb-8 text-lg leading-relaxed">
            Join thousands of traders who have transformed their approach to the markets with our comprehensive education platform. Sign up now to access free starter courses.
          </p>
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center">
              <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-user-graduate text-primary"></i>
              </div>
              <div>
                <div className="font-bold">10,000+</div>
                <div className="text-white/60 text-sm">Active Students</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-video text-primary"></i>
              </div>
              <div>
                <div className="font-bold">250+</div>
                <div className="text-white/60 text-sm">Video Lessons</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-star text-primary"></i>
              </div>
              <div>
                <div className="font-bold">4.9/5</div>
                <div className="text-white/60 text-sm">Average Rating</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 w-full">
          <div className="bg-black/50 border border-white/10 rounded-xl p-8 shadow-xl w-full max-w-md mx-auto">
            <h3 className="text-2xl font-bold mb-6">Create Your Free Account</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="fullName" className="block mb-2 text-white/90">Full Name</label>
                <input 
                  type="text" 
                  id="fullName" 
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-5">
                <label htmlFor="email" className="block mb-2 text-white/90">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-5">
                <label htmlFor="password" className="block mb-2 text-white/90">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="agreeTerms"
                    className="w-4 h-4 mr-2" 
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                  />
                  <span className="text-white/70 text-sm">
                    I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </span>
                </label>
              </div>
              <button 
                type="submit" 
                className="w-full bg-primary py-3 rounded-lg font-semibold hover:bg-primary-light transition-all duration-300"
              >
                Get Started Now
              </button>
              <div className="text-center mt-5 text-white/50 text-sm">
                Already have an account? <a href="#" className="text-primary hover:underline">Sign in</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
