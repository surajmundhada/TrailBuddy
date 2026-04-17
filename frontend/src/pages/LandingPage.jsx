import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  SparklesIcon,
  MapPinIcon,
  StarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

/* ─── Navbar ─────────────────────────────────────────────────── */
const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-900/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">TB</span>
            </div>
            <span className="text-white font-semibold text-base tracking-tight">Trail Buddy</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/guides" className="nav-link">Explore</Link>
            <Link to="/packages" className="nav-link">Hidden Gems</Link>
            <Link to="/become-guide" className="nav-link">Become a Guide</Link>
            <Link to="/dashboard" className="nav-link">Traveler Dashboard</Link>
            <Link to="/dashboard" className="nav-link">Guide Dashboard</Link>
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-navy-900 px-4 py-1.5 rounded-full transition-all duration-200 hover:shadow-glow-cyan"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <div className="w-5 h-0.5 bg-current mb-1 transition-all" />
            <div className="w-5 h-0.5 bg-current mb-1 transition-all" />
            <div className="w-5 h-0.5 bg-current transition-all" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/5 space-y-3 animate-slide-down">
            <Link to="/guides" className="block text-slate-300 hover:text-white py-1 text-sm">Explore</Link>
            <Link to="/packages" className="block text-slate-300 hover:text-white py-1 text-sm">Hidden Gems</Link>
            <Link to="/become-guide" className="block text-slate-300 hover:text-white py-1 text-sm">Become a Guide</Link>
            <Link to="/dashboard" className="block text-slate-300 hover:text-white py-1 text-sm">Dashboard</Link>
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="text-sm text-slate-300 hover:text-white">Login</Link>
              <Link to="/register" className="btn-cyan text-sm font-semibold px-4 py-1.5 rounded-full">Sign Up</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

/* ─── Hero Section ───────────────────────────────────────────── */
const HeroSection = () => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark-radial pt-16">
    {/* Radial glow */}
    <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
    {/* Subtle dot grid */}
    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />

    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow" />
        <span className="text-sm text-slate-300 font-medium">Trusted local guides across India</span>
      </div>

      {/* Heading */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight tracking-tight mb-6">
        Travel like a local with{' '}
        <span className="gradient-text">Trail Buddy</span>
      </h1>

      {/* Subtext */}
      <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
        Discover hidden chai spots in Jaipur, monasteries in Spiti, and sunrise aartis in Varanasi —
        curated by verified local experts who know every lane and story.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/guides"
          className="inline-flex items-center gap-2 btn-cyan font-semibold text-sm px-7 py-3 rounded-full"
        >
          Explore guides
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <Link
          to="/become-guide"
          className="inline-flex items-center justify-center btn-outline-dark font-semibold text-sm px-7 py-3 rounded-full"
        >
          Become a guide
        </Link>
      </div>
    </div>
  </section>
);

/* ─── Why Choose Section ─────────────────────────────────────── */
const whyFeatures = [
  {
    icon: ShieldCheckIcon,
    iconBg: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
    title: 'Verified local experts',
    description:
      'Every guide is ID-verified and quality checked, so you always know who you are traveling with.',
  },
  {
    icon: UserGroupIcon,
    iconBg: 'from-pink-500/20 to-pink-600/10',
    iconColor: 'text-pink-400',
    title: 'Women-safe travel',
    description:
      'Specially trained, women-safe verified guides and curated experiences for solo women travelers.',
  },
  {
    icon: SparklesIcon,
    iconBg: 'from-cyan-500/20 to-cyan-600/10',
    iconColor: 'text-cyan-400',
    title: 'Story-first itineraries',
    description:
      'From temple backstories to street-art walks, every experience is designed around local stories — not checklists.',
  },
];

const WhyChooseSection = () => (
  <section className="py-24 bg-navy-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="section-title mb-4">Why travelers choose Trail Buddy</h2>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Built for solo travelers,{' '}
          <span className="text-cyan-400">small groups</span>, and curious explorers who want real stories over scripted tours.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {whyFeatures.map((f) => (
          <div key={f.title} className="card-dark p-8">
            <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${f.iconBg} mb-5`}>
              <f.icon className={`h-6 w-6 ${f.iconColor}`} />
            </div>
            <h3 className="text-white font-semibold text-base mb-3">{f.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Destinations Section ───────────────────────────────────── */
const destinations = [
  {
    name: 'Jaipur',
    description: 'Hidden havelis, sunset forts, and old city food walks with storytellers.',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80&auto=format&fit=crop',
  },
  {
    name: 'Spiti Valley',
    description: 'Monasteries above the clouds, village stays, and high-altitude treks with locals.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&auto=format&fit=crop',
  },
  {
    name: 'Varanasi',
    description: 'Dawn boat rides, ghat walks, and alley explorations with generations of residents.',
    image: 'https://www.andbeyond.com/wp-content/uploads/sites/5/iStock_000058485880_XXXLarge.jpg',
  },
];

const DestinationsSection = () => (
  <section className="py-24 bg-navy-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <h2 className="section-title mb-2">Handpicked Indian destinations</h2>
          <p className="text-slate-400 text-sm">
            Start your next journey in cities and regions our community loves.
          </p>
        </div>
        <Link
          to="/guides"
          className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
        >
          View all experiences <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {destinations.map((dest, i) => (
          <Link
            key={dest.name}
            to="/guides"
            className="group relative rounded-2xl overflow-hidden bg-navy-700 block"
            style={{ minHeight: 280 }}
          >
            <img
              src={dest.image}
              alt={dest.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/95 via-navy-900/40 to-transparent" />
            {/* Cyan border on hover */}
            <div
              className={`absolute inset-0 rounded-2xl border-2 transition-colors duration-300 ${i === destinations.length - 1
                ? 'border-cyan-500/50'
                : 'border-transparent group-hover:border-cyan-500/30'
                }`}
            />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-white font-bold text-lg mb-1.5">{dest.name}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{dest.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Featured Guides Section ────────────────────────────────── */
const featuredGuides = [
  {
    name: 'Ramesh Sharma',
    city: 'Jaipur',
    rating: 4.8,
    price: '₹1200/day',
    womenSafe: false,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop&facepad=3&crop=face',
  },
  {
    name: 'Aditi Mehta',
    city: 'Varanasi',
    rating: 4.9,
    price: '₹1500/day',
    womenSafe: true,
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&auto=format&fit=crop&facepad=3&crop=face',
    featured: true,
  },
  {
    name: 'Tashi Dorje',
    city: 'Spiti Valley',
    rating: 4.7,
    price: '₹2000/day',
    womenSafe: true,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80&auto=format&fit=crop&facepad=3&crop=face',
  },
];

const FeaturedGuidesSection = () => (
  <section className="py-24 bg-navy-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="section-title mb-4">Featured guides</h2>
        <p className="text-slate-400 text-sm">
          Meet some of the <span className="text-slate-300">locals</span> crafting unforgettable journeys on Trail Buddy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredGuides.map((g) => (
          <div
            key={g.name}
            className={`relative rounded-2xl overflow-hidden group cursor-pointer ${g.featured ? 'ring-2 ring-cyan-500/50 shadow-glow-cyan' : ''
              }`}
            style={{ minHeight: 340 }}
          >
            <img
              src={g.image}
              alt={g.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/95 via-navy-900/30 to-transparent" />

            {/* Rating badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full px-2.5 py-1">
              <StarSolidIcon className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-amber-300 text-xs font-semibold">{g.rating}</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-white font-bold text-base mb-1">{g.name}</h3>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                <MapPinIcon className="h-3.5 w-3.5" />
                {g.city}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-semibold text-sm">{g.price}</span>
                {g.womenSafe && (
                  <span className="text-xs px-2 py-0.5 rounded-full border border-pink-500/40 text-pink-400">
                    Women-safe
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Testimonials Section ───────────────────────────────────── */
const testimonials = [
  {
    quote:
      'My Jaipur evening walk with a Trail Buddy guide felt like exploring the city with an old friend.',
    author: 'Sara, Solo Traveler',
  },
  {
    quote:
      'Our Spiti trip was effortless. Our guide knew every bend in the road and the best homestays.',
    author: 'Ankit & Riya',
  },
  {
    quote:
      'As a woman traveling alone, the women-safe guides helped me feel confident and relaxed.',
    author: 'Maya',
  },
];

const TestimonialsSection = () => (
  <section className="py-24 bg-navy-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h2 className="section-title mb-4">Loved by curious travelers</h2>
        <p className="text-slate-400 text-sm">Real stories from people who chose to see India through local eyes.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div key={t.author} className="card-dark p-7">
            {/* Quote mark */}
            <div className="text-cyan-500 text-4xl font-serif leading-none mb-4 select-none">"</div>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">{t.quote}</p>
            <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase">{t.author}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── CTA Banner ─────────────────────────────────────────────── */
const CTASection = () => (
  <section className="py-20 bg-navy-900 border-t border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to explore India like a local?
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Browse verified guides in Jaipur, Varanasi, Spiti and beyond, then send a booking request
            in a couple of clicks.
          </p>
        </div>
        <div className="flex gap-4 flex-shrink-0">
          <Link
            to="/guides"
            className="btn-cyan font-semibold text-sm px-6 py-3 rounded-full"
          >
            Explore guides
          </Link>
          <Link
            to="/become-guide"
            className="btn-outline-dark font-semibold text-sm px-6 py-3 rounded-full"
          >
            Become a Trail Buddy guide
          </Link>
        </div>
      </div>
    </div>
  </section>
);

/* ─── Footer ─────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="bg-navy-900 border-t border-white/5 py-14">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">TB</span>
            </div>
            <span className="text-white font-semibold text-base">Trail Buddy</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Making travel in India authentic and unforgettable with verified local guides.
          </p>
        </div>
        <div>
          <h4 className="text-slate-400 text-xs font-semibold tracking-widest uppercase mb-4">Product</h4>
          <ul className="space-y-3">
            <li><Link to="/guides" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Find Guides</Link></li>
            <li><Link to="/ai-planner" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">AI Planner</Link></li>
            <li><Link to="/stories" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Local Stories</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-slate-400 text-xs font-semibold tracking-widest uppercase mb-4">Company</h4>
          <ul className="space-y-3">
            <li><Link to="/about" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">About</Link></li>
            <li><Link to="/contact" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Contact</Link></li>
            <li><Link to="/privacy" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-white/5">
        <p className="text-slate-600 text-xs text-center">© 2024 Trail Buddy. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

/* ─── Page ───────────────────────────────────────────────────── */
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <HeroSection />
      <WhyChooseSection />
      <DestinationsSection />
      <FeaturedGuidesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
