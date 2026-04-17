import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-dark-radial flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="relative z-10 text-center">
        <div className="text-8xl font-bold gradient-text mb-4 select-none">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 btn-cyan font-semibold text-sm px-6 py-3 rounded-full"
        >
          Go Home <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
