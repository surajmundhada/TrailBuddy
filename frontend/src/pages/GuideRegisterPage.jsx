import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { guidesAPI, digilockerAPI, userAPI } from '../services/api';
import { ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import GuideMediaFields from '../components/GuideMediaFields';

const GuideRegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const draftKey = `guide-register-draft-${user?.id ?? 'guest'}`;

  const [form, setForm] = useState({
    bio: '',
    expertise: 'Heritage Tours',
    languages: 'Hindi,English',
    hourlyRate: '',
    city: 'Delhi',
    state: 'Delhi',
    profileImageUrl: '',
    introVideoUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingDigiLocker, setIsStartingDigiLocker] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const handledQueryRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) {
        setIsLoaded(true);
        return;
      }

      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
        setForm((prev) => ({ ...prev, ...saved }));
      }
    } catch {
      // ignore invalid draft JSON
    } finally {
      setIsLoaded(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!isLoaded) return;

    const hasMeaningfulData = Object.values(form).some((value) => {
      if (typeof value === 'string') return value.trim() !== '';
      return value != null;
    });

    if (!hasMeaningfulData) return;
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [draftKey, form, isLoaded]);

  useEffect(() => {
    if (handledQueryRef.current) return;

    const params = new URLSearchParams(location.search);
    const status = params.get('digilocker');
    const message = params.get('message');

    if (status === 'success') {
      toast.success('Aadhaar verified via DigiLocker');
      handledQueryRef.current = true;
    } else if (status === 'error') {
      toast.error(message || 'DigiLocker verification failed');
      handledQueryRef.current = true;
    }
  }, [location.search]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = () => ({
    bio: form.bio,
    expertise: form.expertise,
    languages: form.languages,
    hourlyRate: Number(form.hourlyRate),
    city: form.city,
    state: form.state,
    profileImageUrl: form.profileImageUrl || null,
    introVideoUrl: form.introVideoUrl || null,
  });

  const validateForm = () => {
    if (!form.bio.trim()) {
      toast.error('Bio is required');
      return false;
    }
    if (!form.expertise.trim()) {
      toast.error('Expertise is required');
      return false;
    }
    if (!form.languages.trim()) {
      toast.error('Languages are required');
      return false;
    }
    const hourly = Number(form.hourlyRate);
    if (!Number.isFinite(hourly) || hourly <= 0) {
      toast.error('Hourly rate must be a valid number');
      return false;
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const status = await userAPI.getGuideStatus().then((r) => r.data);
      if (status?.hasGuide) {
        toast.success('Your guide profile is already submitted for review.');
        navigate('/profile');
        return;
      }

      await guidesAPI.register(buildPayload());
      localStorage.removeItem(draftKey);
      toast.success('Guide registration submitted. Await admin approval.');
      navigate('/guides');
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.response?.data || 'Failed to submit guide registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onStartDigiLocker = async () => {
    if (!validateForm()) return;

    setIsStartingDigiLocker(true);
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));

      const status = await userAPI.getGuideStatus().then((r) => r.data);
      if (!status?.hasGuide) {
        await guidesAPI.register(buildPayload());
        toast.success('Guide profile created. Redirecting to DigiLocker...');
      }

      const response = await digilockerAPI.getAuthUrl();
      const url = response?.data?.url;
      if (!url) {
        toast.error('Failed to get DigiLocker link');
        return;
      }
      window.location.href = url;
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.response?.data || 'Failed to start DigiLocker verification');
    } finally {
      setIsStartingDigiLocker(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          Become a Guide
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Share your local knowledge and earn by guiding curious travelers.
        </p>
      </div>

      <div className="glass rounded-2xl border border-white/6 p-6 sm:p-8">
        <div className="text-xs text-slate-500 mb-5 px-3 py-2 rounded-lg bg-white/3 border border-white/8">
          Logged in as <span className="font-medium text-slate-300">{user?.email}</span>
        </div>
        <div className="text-xs text-emerald-300/90 mb-5 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
          Your data is auto-saved.
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => updateForm('bio', e.target.value)}
              className="input-dark resize-none"
              rows={5}
              placeholder="Tell travelers about your experience, specialties, and what makes your tours unique..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Expertise <span className="text-slate-500">(comma separated)</span>
            </label>
            <input
              value={form.expertise}
              onChange={(e) => updateForm('expertise', e.target.value)}
              className="input-dark"
              placeholder="Heritage Tours, Food Walks, Photography..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Languages <span className="text-slate-500">(comma separated)</span>
            </label>
            <input
              value={form.languages}
              onChange={(e) => updateForm('languages', e.target.value)}
              className="input-dark"
              placeholder="Hindi, English, Tamil..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Hourly Rate (Rs)</label>
              <input
                type="number"
                value={form.hourlyRate}
                onChange={(e) => updateForm('hourlyRate', e.target.value)}
                className="input-dark"
                placeholder="e.g., 1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">City</label>
              <input
                value={form.city}
                onChange={(e) => updateForm('city', e.target.value)}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">State</label>
              <input
                value={form.state}
                onChange={(e) => updateForm('state', e.target.value)}
                className="input-dark"
              />
            </div>
          </div>

          <GuideMediaFields
            profileImageUrl={form.profileImageUrl}
            introVideoUrl={form.introVideoUrl}
            onFieldChange={updateForm}
          />

          <div className="border-t border-white/8 pt-5 mt-2">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Aadhaar Verification (DigiLocker)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify your Aadhaar via DigiLocker so travelers can see that you are ID-verified.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onStartDigiLocker}
              disabled={isStartingDigiLocker}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 text-emerald-300 hover:bg-emerald-500/15 text-sm font-medium transition-all disabled:opacity-50"
            >
              {isStartingDigiLocker ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-400/30 border-t-emerald-400" />
                  Connecting to DigiLocker...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-4 w-4" />
                  Verify Aadhaar via DigiLocker
                </>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-cyan font-semibold text-sm py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                Submitting...
              </>
            ) : (
              <>
                Submit for approval
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuideRegisterPage;
