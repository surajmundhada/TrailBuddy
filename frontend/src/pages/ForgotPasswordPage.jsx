import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { authAPI } from '../services/api';

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setResult(null);
    try {
      const response = await authAPI.forgotPassword(data.email);
      setResult(response.data);
      toast.success('Check your email for reset link');
    } catch (e) {
      const message = e?.response?.data || 'Failed to initiate password reset';
      toast.error(typeof message === 'string' ? message : 'Failed to initiate password reset');
      setResult(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we’ll send a reset link.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
              })}
              type="email"
              autoComplete="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>

          {result && typeof result === 'string' && (
            <p className="text-sm text-gray-600">{result}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

