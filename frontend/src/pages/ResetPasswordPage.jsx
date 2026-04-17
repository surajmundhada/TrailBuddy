import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('token');
  }, [location.search]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const newPassword = watch('newPassword');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Reset token missing');
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.resetPassword(token, data.newPassword);
      toast.success('Password reset successful');
      navigate('/login');
    } catch (e) {
      const message = e?.response?.data || 'Failed to reset password';
      toast.error(typeof message === 'string' ? message : 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Set new password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose a strong password. You’ll be able to sign in right away.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
              type="password"
              autoComplete="new-password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === newPassword || 'Passwords do not match',
              })}
              type="password"
              autoComplete="new-password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

