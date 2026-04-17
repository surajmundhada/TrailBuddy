import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { guidePackagesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  title: '',
  description: '',
  city: '',
  duration: '2 days',
  price: '',
  famousSpots: '',
  hiddenSpots: '',
  foodPlaces: '',
};

export default function GuidePackagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean).map((r) => String(r).toUpperCase())
    : [];
  const isGuide = roles.includes('GUIDE') || roles.includes('ROLE_GUIDE');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const { data: packages = [], isLoading } = useQuery(
    ['guide-packages'],
    () => guidePackagesAPI.getAll().then((res) => res.data),
    { enabled: !!user?.id }
  );

  const myGuideId = user?.guideId;
  const featuredPackages = useMemo(() => packages, [packages]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await guidePackagesAPI.create({
        title: form.title,
        description: form.description,
        city: form.city,
        duration: form.duration,
        price: Number(form.price),
        famousSpots: form.famousSpots.split(',').map((v) => v.trim()).filter(Boolean),
        hiddenSpots: form.hiddenSpots.split(',').map((v) => v.trim()).filter(Boolean),
        foodPlaces: form.foodPlaces.split(',').map((v) => v.trim()).filter(Boolean),
      });
      toast.success('Package published.');
      setForm(emptyForm);
      queryClient.invalidateQueries('guide-packages');
    } catch (error) {
      toast.error(error?.response?.data || 'Failed to publish package');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          Curated Packages
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          MMT and Airbnb style packages crafted by local guides with iconic spots, hidden heritage gems, and local food trails.
        </p>
      </div>

      {isGuide && (
        <form onSubmit={onSubmit} className="glass rounded-2xl border border-white/6 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Create Your Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="input-dark" placeholder="Package title" />
            <input value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} className="input-dark" placeholder="City" />
            <input value={form.duration} onChange={(e) => setForm((s) => ({ ...s, duration: e.target.value }))} className="input-dark" placeholder="Duration" />
            <input type="number" min={1} value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} className="input-dark" placeholder="Price" />
          </div>
          <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="input-dark resize-none" rows={3} placeholder="Describe the curated package" />
          <input value={form.famousSpots} onChange={(e) => setForm((s) => ({ ...s, famousSpots: e.target.value }))} className="input-dark" placeholder="Famous spots, comma separated" />
          <input value={form.hiddenSpots} onChange={(e) => setForm((s) => ({ ...s, hiddenSpots: e.target.value }))} className="input-dark" placeholder="Hidden heritage spots, comma separated" />
          <input value={form.foodPlaces} onChange={(e) => setForm((s) => ({ ...s, foodPlaces: e.target.value }))} className="input-dark" placeholder="Food places, comma separated" />
          <button type="submit" disabled={submitting} className="btn-cyan px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
            {submitting ? 'Publishing...' : 'Publish Package'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading packages...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {featuredPackages.map((pkg) => (
            <div key={pkg.id} className="glass rounded-2xl border border-white/6 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">{pkg.city}</div>
                  <h2 className="mt-2 text-xl font-semibold text-white">{pkg.title}</h2>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{pkg.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-cyan-300 font-semibold">₹{pkg.price}</div>
                  <div className="text-xs text-slate-500 mt-1">{pkg.duration}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500">By {pkg.guideName}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-white/4 border border-white/8 p-3">
                  <div className="text-slate-500 mb-1">Famous Spots</div>
                  <div className="text-slate-300">{pkg.famousSpots?.join(', ')}</div>
                </div>
                <div className="rounded-xl bg-white/4 border border-white/8 p-3">
                  <div className="text-slate-500 mb-1">Hidden Heritage</div>
                  <div className="text-slate-300">{pkg.hiddenSpots?.join(', ')}</div>
                </div>
                <div className="rounded-xl bg-white/4 border border-white/8 p-3">
                  <div className="text-slate-500 mb-1">Food Places</div>
                  <div className="text-slate-300">{pkg.foodPlaces?.join(', ')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
