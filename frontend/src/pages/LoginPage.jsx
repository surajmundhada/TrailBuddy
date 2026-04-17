import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const { login, loginWithGoogle, loginWithPhone, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [phoneLoginOpen, setPhoneLoginOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const watchedEmail = watch('email');

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-radial flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="glass rounded-2xl p-8 sm:p-10 shadow-card-dark">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TB</span>
              </div>
              <span className="text-white font-semibold text-lg">Trail Buddy</span>
            </Link>
            <h1 className="text-2xl font-bold text-white mb-1.5">Welcome back</h1>
            <p className="text-slate-400 text-sm">
              No account?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Create one free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                })}
                type="email"
                autoComplete="email"
                className="input-dark"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
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
                  autoComplete="current-password"
                  className="input-dark pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Phone OTP section */}
            {phoneLoginOpen && (
              <div className="space-y-4 p-4 rounded-xl bg-white/3 border border-white/8">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone number</label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-dark"
                    placeholder="Enter your phone"
                  />
                </div>
                {!otpSent ? (
                  <button
                    type="button"
                    disabled={isOtpSending}
                    onClick={async () => {
                      setIsOtpSending(true);
                      try {
                        await authAPI.sendOtp({ phone });
                        setOtpSent(true);
                        toast.success('OTP sent. (Dev OTP is printed in backend logs.)');
                      } catch (e) {
                        const message = e?.response?.data || 'Failed to send OTP';
                        toast.error(typeof message === 'string' ? message : 'Failed to send OTP');
                      } finally {
                        setIsOtpSending(false);
                      }
                    }}
                    className="w-full btn-cyan font-medium text-sm py-2.5 rounded-xl disabled:opacity-50"
                  >
                    {isOtpSending ? 'Sending...' : 'Send OTP'}
                  </button>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">OTP code</label>
                      <input
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="input-dark"
                        placeholder="Enter OTP"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isOtpVerifying}
                      onClick={async () => {
                        setIsOtpVerifying(true);
                        try {
                          const result = await loginWithPhone({ phone, code: otp });
                          if (result.success) {
                            toast.success('Phone sign-in successful!');
                            navigate('/dashboard');
                          } else {
                            toast.error(result.error || 'Phone sign-in failed');
                          }
                        } catch (e) {
                          toast.error(e?.response?.data || 'Phone sign-in failed');
                        } finally {
                          setIsOtpVerifying(false);
                        }
                      }}
                      className="w-full btn-cyan font-medium text-sm py-2.5 rounded-xl disabled:opacity-50"
                    >
                      {isOtpVerifying ? 'Verifying...' : 'Verify & Login'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-400">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-cyan font-semibold text-sm py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              ) : (
                <>Sign in <ArrowRightIcon className="h-4 w-4" /></>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-slate-500">or continue with</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300 transition-all"
                onClick={async () => {
                  try {
                    if (!watchedEmail) {
                      toast.error('Enter email to continue with Google sign-in');
                      return;
                    }
                    const result = await loginWithGoogle({ email: watchedEmail });
                    if (result.success) {
                      toast.success('Signed in with Google!');
                      navigate('/dashboard');
                    } else {
                      toast.error(result.error || 'Google sign-in failed');
                    }
                  } catch (e) {
                    toast.error(e?.response?.data || 'Google sign-in failed');
                  }
                }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" />
                  <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z" />
                  <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300 transition-all"
                onClick={() => {
                  setPhoneLoginOpen(true);
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Phone
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
