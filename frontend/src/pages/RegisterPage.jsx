import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const RegisterPage = () => {
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [phoneAvailable, setPhoneAvailable] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const checkEmailAvailability = async (email) => {
    if (email && /\S+@\S+\.\S+/.test(email)) {
      try {
        const response = await fetch(`/api/auth/check-email?email=${email}`);
        const available = await response.json();
        setEmailAvailable(available);
      } catch (error) {
        setEmailAvailable(null);
      }
    } else {
      setEmailAvailable(null);
    }
  };

  const checkPhoneAvailability = async (phone) => {
    if (phone && /^[6-9]\d{9}$/.test(phone)) {
      try {
        const response = await fetch(`/api/auth/check-phone?phone=${phone}`);
        const available = await response.json();
        setPhoneAvailable(available);
      } catch (error) {
        setPhoneAvailable(null);
      }
    } else {
      setPhoneAvailable(null);
    }
  };

  const onSubmit = async (data) => {
    const result = await registerUser(data);
    if (result.success) {
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/login');
    } else {
      toast.error(result.error);
    }
  };

  const inputClass = (hasError, available) => {
    let border = 'border-white/10';
    if (available === false) border = 'border-red-500/50';
    else if (available === true) border = 'border-emerald-500/50';
    else if (hasError) border = 'border-red-500/50';
    return `input-dark border ${border}`;
  };

  return (
    <div className="min-h-screen bg-dark-radial flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-2xl p-8 sm:p-10 shadow-card-dark">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TB</span>
              </div>
              <span className="text-white font-semibold text-lg">Trail Buddy</span>
            </Link>
            <h1 className="text-2xl font-bold text-white mb-1.5">Create your account</h1>
            <p className="text-slate-400 text-sm">
              Already have one?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">First Name</label>
                <input
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: { value: 2, message: 'Min 2 characters' },
                  })}
                  type="text"
                  autoComplete="given-name"
                  className={inputClass(errors.firstName)}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Last Name</label>
                <input
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: { value: 2, message: 'Min 2 characters' },
                  })}
                  type="text"
                  autoComplete="family-name"
                  className={inputClass(errors.lastName)}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                  })}
                  type="email"
                  autoComplete="email"
                  className={`${inputClass(errors.email, emailAvailable)} pr-9`}
                  placeholder="you@example.com"
                  onBlur={(e) => checkEmailAvailability(e.target.value)}
                />
                {emailAvailable !== null && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {emailAvailable ? (
                      <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              {emailAvailable === false && (
                <p className="mt-1 text-xs text-red-400">Email is already registered</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number</label>
              <div className="relative">
                <input
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid Indian phone number' },
                  })}
                  type="tel"
                  autoComplete="tel"
                  className={`${inputClass(errors.phone, phoneAvailable)} pr-9`}
                  placeholder="9876543210"
                  onBlur={(e) => checkPhoneAvailability(e.target.value)}
                />
                {phoneAvailable !== null && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {phoneAvailable ? (
                      <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
              {phoneAvailable === false && (
                <p className="mt-1 text-xs text-red-400">Phone number already registered</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`${inputClass(errors.password)} pr-9`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`${inputClass(errors.confirmPassword)} pr-9`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">I want to join as</label>
              <select
                {...register('role', { required: 'Please select a role' })}
                className="input-dark appearance-none"
              >
                <option value="">Select role</option>
                <option value="USER">Traveler</option>
                <option value="GUIDE">Local Guide</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-400">{errors.role.message}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="agree-terms"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 flex-shrink-0"
              />
              <span className="text-sm text-slate-400">
                I agree to the{' '}
                <Link to="/terms" className="text-cyan-400 hover:text-cyan-300">Terms and Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-cyan font-semibold text-sm py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              ) : (
                <>Create Account <ArrowRightIcon className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
