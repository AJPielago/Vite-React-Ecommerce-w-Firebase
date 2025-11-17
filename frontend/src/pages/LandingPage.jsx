import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBagIcon, SparklesIcon, ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/outline';

// Feature component for the features section
const Feature = ({ icon: Icon, title, children }) => (
  <motion.div 
    className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
  >
    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-md">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{children}</p>
  </motion.div>
);

// Hero Section
const Hero = () => {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
          <motion.div 
            className="relative inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Modern E-Commerce
              <span className="block bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover a new way to shop with our seamless, intuitive, and beautiful e-commerce experience.
            </p>
          </motion.div>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-pink-600 hover:bg-pink-700 md:py-4 md:text-lg md:px-10 transition-all duration-300 hover:scale-105"
            >
              Shop Now
              <ShoppingBagIcon className="ml-2 -mr-1 h-5 w-5" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-pink-700 bg-pink-100 hover:bg-pink-200 md:py-4 md:text-lg md:px-10 transition-all duration-300 hover:scale-105"
            >
              Create Account
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Features Section
const Features = () => (
  <section className="py-16 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Why Choose Us
        </h2>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          We're committed to providing the best shopping experience
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Feature 
          icon={SparklesIcon} 
          title="Premium Quality"
        >
          We source only the finest products to ensure you get the best quality items that last.
        </Feature>
        
        <Feature 
          icon={ShieldCheckIcon} 
          title="Secure Shopping"
        >
          Your security is our priority. All transactions are encrypted and secure.
        </Feature>
        
        <Feature 
          icon={TruckIcon} 
          title="Fast Delivery"
        >
          Get your orders delivered to your doorstep with our fast and reliable shipping.
        </Feature>
      </div>
    </div>
  </section>
);

// CTA Section
const CTA = () => (
  <section className="bg-gradient-to-r from-pink-500 to-rose-500">
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 lg:py-16">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mt-4 text-xl text-pink-100 max-w-2xl mx-auto">
          Join thousands of satisfied customers who trust us for their shopping needs.
        </p>
        <div className="mt-8">
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-pink-600 bg-white hover:bg-pink-50 md:py-4 md:text-lg md:px-10"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// Footer
const Footer = () => (
  <footer className="bg-white border-t border-gray-200">
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Company</h3>
          <ul className="mt-4 space-y-2">
            <li><Link to="/about" className="text-gray-600 hover:text-gray-900">About Us</Link></li>
            <li><Link to="/careers" className="text-gray-600 hover:text-gray-900">Careers</Link></li>
            <li><Link to="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Support</h3>
          <ul className="mt-4 space-y-2">
            <li><Link to="/contact" className="text-gray-600 hover:text-gray-900">Contact Us</Link></li>
            <li><Link to="/faq" className="text-gray-600 hover:text-gray-900">FAQs</Link></li>
            <li><Link to="/shipping" className="text-gray-600 hover:text-gray-900">Shipping</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Legal</h3>
          <ul className="mt-4 space-y-2">
            <li><Link to="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-gray-600 hover:text-gray-900">Terms of Service</Link></li>
            <li><Link to="/refunds" className="text-gray-600 hover:text-gray-900">Refund Policy</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Connect</h3>
          <div className="flex space-x-4 mt-4">
            <a href="#" className="text-gray-600 hover:text-pink-600">
              <span className="sr-only">Facebook</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-600 hover:text-rose-400">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-gray-600 hover:text-pink-600">
              <span className="sr-only">Instagram</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.399 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-gray-200">
        <p className="text-base text-gray-500 text-center">&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// Main LandingPage component
const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Hero />
      <Features />
      <CTA />
    </div>
  );
};

export default LandingPage;
