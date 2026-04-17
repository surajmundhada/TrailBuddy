import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPinIcon, 
  ShieldCheckIcon, 
  StarIcon,
  UserGroupIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const LandingPage = () => {
  const [email, setEmail] = useState('');

  const features = [
    {
      name: 'Verified Local Guides',
      description: 'All our guides are background-checked and verified through Aadhar KYC for your safety.',
      icon: ShieldCheckIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'AI Trip Planning',
      description: 'Get personalized itineraries powered by AI, including hidden gems and local insights.',
      icon: SparklesIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Real-time Chat',
      description: 'Connect instantly with guides through our secure messaging platform.',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Women Safety',
      description: 'Special safety features including women-friendly guides and emergency contacts.',
      icon: HeartIcon,
      color: 'bg-pink-500'
    },
    {
      name: 'Secure Payments',
      description: 'Safe and secure transactions through Razorpay with transparent pricing.',
      icon: CheckCircleIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Local Stories',
      description: 'Discover authentic cultural insights and experiences shared by local guides.',
      icon: UserGroupIcon,
      color: 'bg-indigo-500'
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Travel Enthusiast',
      content: 'TrailBuddy made my solo trip to Rajasthan incredibly safe and memorable. The guide was knowledgeable and the AI planner helped me discover places I would have never found!',
      rating: 5,
      avatar: 'PS'
    },
    {
      name: 'Rahul Verma',
      role: 'Business Traveler',
      content: 'As a frequent business traveler, I appreciate the verified guides and seamless booking process. The chat feature helps me coordinate everything efficiently.',
      rating: 5,
      avatar: 'RV'
    },
    {
      name: 'Anita Desai',
      role: 'Solo Female Traveler',
      content: 'The women safety features gave me confidence to travel alone. My guide was amazing and I felt completely safe throughout my Kerala trip.',
      rating: 5,
      avatar: 'AD'
    }
  ];

  const stats = [
    { name: 'Verified Guides', value: '500+' },
    { name: 'Happy Travelers', value: '10,000+' },
    { name: 'Cities Covered', value: '50+' },
    { name: 'Success Rate', value: '98%' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gradient-to-br from-primary-600 to-primary-800 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">India's Most Trusted</span>{' '}
                  <span className="block text-primary-200 xl:inline">Local Travel Guide Platform</span>
                </h1>
                <p className="mt-3 text-base text-primary-200 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Discover India with verified local guides, AI-powered trip planning, and real-time experiences. 
                  Your safety and authentic travel experience are our top priorities.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-white text-primary-600 hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                    >
                      Get Started
                    </Link>
                  </div>
                  <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                    <Link
                      to="/guides"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
                    >
                      Explore Guides
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.unsplash.com/photo-1524492442967-8c3b5c9c1d0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            alt="Travel in India"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="mt-2 text-sm font-medium text-primary-200">{stat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for safe and authentic travel
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our platform combines cutting-edge technology with local expertise to provide you with the best travel experience in India.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <div key={feature.name} className="relative">
                  <div className={`absolute flex items-center justify-center h-12 w-12 rounded-md ${feature.color} text-white`}>
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Trusted by thousands of travelers
            </p>
          </div>

          <div className="mt-8 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-white font-medium">{testimonial.avatar}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600">{testimonial.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to explore India?</span>
            <span className="block text-primary-200">Join thousands of happy travelers today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
              >
                Get started
                <ArrowRightIcon className="ml-3 -mr-1 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <h3 className="text-2xl font-bold text-white">TrailBuddy</h3>
              <p className="text-gray-300 text-base">
                Making travel in India safe, authentic, and unforgettable with verified local guides and AI-powered planning.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Product</h3>
                  <ul className="space-y-4">
                    <li><Link to="/guides" className="text-base text-gray-300 hover:text-white">Find Guides</Link></li>
                    <li><Link to="/ai-planner" className="text-base text-gray-300 hover:text-white">AI Planner</Link></li>
                    <li><Link to="/stories" className="text-base text-gray-300 hover:text-white">Local Stories</Link></li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Company</h3>
                  <ul className="space-y-4">
                    <li><Link to="/about" className="text-base text-gray-300 hover:text-white">About</Link></li>
                    <li><Link to="/contact" className="text-base text-gray-300 hover:text-white">Contact</Link></li>
                    <li><Link to="/privacy" className="text-base text-gray-300 hover:text-white">Privacy</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 xl:text-center">
              &copy; 2024 TrailBuddy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
