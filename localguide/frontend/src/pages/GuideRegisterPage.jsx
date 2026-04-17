import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { guidesAPI, digilockerAPI, userAPI } from '../services/api';

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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingDigiLocker, setIsStartingDigiLocker] = useState(false);
  const handledQueryRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        setForm((prev) => ({
          ...prev,
          ...saved,
        }));
      }
    } catch {
      // ignore invalid draft JSON
    }
  }, [draftKey]);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [draftKey, form]);

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

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.bio.trim()) {
      toast.error('Bio is required');
      return;
    }
    if (!form.expertise.trim()) {
      toast.error('Expertise is required');
      return;
    }
    if (!form.languages.trim()) {
      toast.error('Languages are required');
      return;
    }
    const hourly = Number(form.hourlyRate);
    if (!Number.isFinite(hourly) || hourly <= 0) {
      toast.error('Hourly rate must be a valid number');
      return;
    }

    setIsSubmitting(true);
    try {
      const status = await userAPI.getGuideStatus().then((r) => r.data);
      if (status?.hasGuide) {
        toast.success('Your guide profile is already submitted for review.');
        navigate('/guides');
        return;
      }

      await guidesAPI.register({
        bio: form.bio,
        expertise: form.expertise,
        languages: form.languages,
        hourlyRate: hourly,
        city: form.city,
        state: form.state,
      });
      localStorage.removeItem(draftKey);
      toast.success('Guide registration submitted. Await admin approval.');
      navigate('/guides');
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to submit guide registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onStartDigiLocker = async () => {
    setIsStartingDigiLocker(true);
    try {
      // Ensure guide profile exists before DigiLocker callback tries to update it.
      const status = await userAPI.getGuideStatus().then((r) => r.data);
      if (!status?.hasGuide) {
        if (!form.bio.trim() || !form.expertise.trim() || !form.languages.trim()) {
          toast.error('Fill bio, expertise and languages first');
          setIsStartingDigiLocker(false);
          return;
        }
        const hourly = Number(form.hourlyRate);
        if (!Number.isFinite(hourly) || hourly <= 0) {
          toast.error('Enter a valid hourly rate first');
          setIsStartingDigiLocker(false);
          return;
        }

        await guidesAPI.register({
          bio: form.bio,
          expertise: form.expertise,
          languages: form.languages,
          hourlyRate: hourly,
          city: form.city,
          state: form.state,
        });
        toast.success('Guide profile created. Redirecting to DigiLocker...');
      }

      const res = await digilockerAPI.getAuthUrl();
      const url = res?.data?.url;
      if (!url) {
        toast.error('Failed to get DigiLocker link');
      } else {
        window.location.href = url;
      }
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to start DigiLocker verification');
    } finally {
      setIsStartingDigiLocker(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Become a Guide</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-4">
            Logged in as <span className="font-medium">{user?.email}</span>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={5}
                placeholder="Tell travelers about your experience..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expertise (comma separated)</label>
              <input
                value={form.expertise}
                onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Languages (comma separated)</label>
              <input
                value={form.languages}
                onChange={(e) => setForm({ ...form, languages: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Hourly rate (₹)</label>
                <input
                  type="number"
                  value={form.hourlyRate}
                  onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="border-t border-gray-200 pt-4 mt-2 space-y-2">
              <p className="text-sm text-gray-700 font-medium">
                Aadhaar Verification (DigiLocker)
              </p>
              <p className="text-xs text-gray-500">
                Verify your Aadhaar via DigiLocker so travelers can see that you are ID-verified.
              </p>
              <button
                type="button"
                onClick={onStartDigiLocker}
                disabled={isStartingDigiLocker}
                className="inline-flex items-center px-4 py-2 border border-indigo-600 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-50 disabled:opacity-50"
              >
                {isStartingDigiLocker ? 'Connecting to DigiLocker...' : 'Verify Aadhaar via DigiLocker'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for approval'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GuideRegisterPage;

