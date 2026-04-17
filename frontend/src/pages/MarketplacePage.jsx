import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { marketplaceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const durationOptions = ['Half day', '1 day', '2-3 days', '4-7 days'];

const emptyProposal = {
  requestId: null,
  title: '',
  description: '',
  itinerary: '',
  days: 1,
  price: '',
  highlights: '',
  isBoosted: false,
};

function formatBudgetDisplay(request) {
  if (request == null) return '—';
  const rupees = request.budgetRupees;
  if (typeof rupees === 'number' && rupees > 0) {
    return `₹${rupees.toLocaleString('en-IN')}`;
  }
  if (typeof request.budget === 'number' && request.budget > 0) {
    return `₹${request.budget.toLocaleString('en-IN')}`;
  }
  const legacy = request.budget;
  if (legacy == null || legacy === '') return '—';
  return String(legacy).toUpperCase();
}

function getErrorMessage(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    return payload.message || payload.error || fallback;
  }
  return error?.message || fallback;
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean).map((r) => String(r).toUpperCase())
    : [];
  const isGuide = roles.includes('GUIDE') || roles.includes('ROLE_GUIDE');

  const [requestForm, setRequestForm] = useState({
    freeText: '',
    duration: durationOptions[1],
    city: '',
    state: '',
    budgetRupees: '',
  });
  const [proposalForm, setProposalForm] = useState(emptyProposal);
  const [savingRequest, setSavingRequest] = useState(false);
  const [savingProposal, setSavingProposal] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);

  const travelerRequestsQuery = useQuery(
    ['marketplace-my-requests'],
    () => marketplaceAPI.getMyRequests().then((res) => res.data),
    { enabled: !isGuide && !!user?.id }
  );

  /** Only guides fetch the inbox — avoids extra API load and prevents odd errors for pure travelers. */
  const incomingRequestsQuery = useQuery(
    ['marketplace-incoming-requests'],
    () => marketplaceAPI.getIncomingRequests().then((res) => res.data),
    { enabled: isGuide && !!user?.id }
  );

  const requests = useMemo(
    () => (isGuide ? incomingRequestsQuery.data || [] : travelerRequestsQuery.data || []),
    [incomingRequestsQuery.data, isGuide, travelerRequestsQuery.data]
  );

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!requestForm.freeText.trim()) {
      toast.error('Please share your preferences first.');
      return;
    }
    if (!requestForm.city.trim()) {
      toast.error('Please enter a city so local guides can see your request.');
      return;
    }
    const rupees = Number(String(requestForm.budgetRupees).replace(/,/g, ''));
    if (!Number.isFinite(rupees) || rupees < 1) {
      toast.error('Enter a realistic budget in rupees (₹).');
      return;
    }

    setSavingRequest(true);
    try {
      await marketplaceAPI.createRequest({
        freeText: requestForm.freeText.trim(),
        duration: requestForm.duration,
        city: requestForm.city.trim(),
        state: requestForm.state.trim(),
        budgetRupees: rupees,
      });
      toast.success('Posted to guides in ' + requestForm.city.trim() + '. They can send you plans here.');
      setRequestForm((prev) => ({ ...prev, freeText: '' }));
      queryClient.invalidateQueries('marketplace-my-requests');
      queryClient.invalidateQueries('marketplace-incoming-requests');
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data || 'Failed to create request';
      toast.error(typeof msg === 'string' ? msg : 'Failed to create request');
    } finally {
      setSavingRequest(false);
    }
  };

  const openProposalForm = (requestId) => {
    setProposalForm((prev) => ({ ...prev, ...emptyProposal, requestId }));
    setProposalModalOpen(true);
  };

  const submitProposal = async (event) => {
    event.preventDefault();
    if (!proposalForm.requestId) return;
    setSavingProposal(true);
    try {
      await marketplaceAPI.createProposal({
        ...proposalForm,
        days: Number(proposalForm.days),
        price: Number(proposalForm.price),
        highlights: proposalForm.highlights
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      toast.success('Proposal sent to traveler.');
      setProposalForm(emptyProposal);
      setProposalModalOpen(false);
      queryClient.invalidateQueries('marketplace-incoming-requests');
      queryClient.invalidateQueries('marketplace-my-requests');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create proposal'));
    } finally {
      setSavingProposal(false);
    }
  };

  const selectProposal = async (proposal) => {
    try {
      await marketplaceAPI.selectProposal(proposal.id);
      toast.success('Proposal accepted. Booking created automatically.');
      queryClient.invalidateQueries('marketplace-my-requests');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to select proposal'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          Personal Trip Marketplace
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          {isGuide
            ? 'See requests posted for your city (and state, if the traveler specified one). Send a tailored plan — travelers pick their favorite and book.'
            : 'Tell guides what you want, set your city and budget in rupees, and compare replies from hosts in that city.'}
        </p>
      </div>

      {(travelerRequestsQuery.isError || incomingRequestsQuery.isError) && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Could not load marketplace data. Ensure the API is running and you are signed in.
        </div>
      )}

      {!isGuide && (
        <form onSubmit={submitRequest} className="glass rounded-2xl border border-white/6 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">What kind of trip do you want?</label>
            <textarea
              rows={4}
              value={requestForm.freeText}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, freeText: event.target.value }))}
              className="input-dark resize-none"
              placeholder="Example: no museums, want trek + food, prefer sunrise spots"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
              <input
                type="text"
                value={requestForm.city}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, city: event.target.value }))}
                className="input-dark"
                placeholder="e.g. Jaipur, Bengaluru, Mumbai"
              />
              <p className="text-[11px] text-slate-500 mt-1">Only guides registered in this city see your request.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">State (optional)</label>
              <input
                type="text"
                value={requestForm.state}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, state: event.target.value }))}
                className="input-dark"
                placeholder="e.g. Rajasthan — narrows to guides in that city + state"
              />
              <p className="text-[11px] text-slate-500 mt-1">Leave blank to include every guide in the city.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Duration</label>
              <select
                value={requestForm.duration}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, duration: event.target.value }))}
                className="input-dark"
              >
                {durationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Budget (₹)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={requestForm.budgetRupees}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, budgetRupees: event.target.value }))}
                className="input-dark [color-scheme:dark]"
                placeholder="e.g. 15000"
              />
              <p className="text-[11px] text-slate-500 mt-1">Whole-trip ballpark in Indian rupees.</p>
            </div>
          </div>
          <button type="submit" disabled={savingRequest} className="btn-cyan px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
            {savingRequest ? 'Sending request...' : 'Send Preferences'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {requests.map((request) => (
          <div key={request.id} className="glass rounded-2xl border border-white/6 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Request #{request.id}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {request.city ? (
                    <span className="inline-flex rounded-full bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200">
                      {request.city}
                    </span>
                  ) : null}
                  {request.state ? (
                    <span className="inline-flex rounded-full bg-white/6 border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                      {request.state}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-slate-200 leading-relaxed">{request.freeText}</p>
              </div>
              <div className="text-right text-xs text-slate-500 shrink-0">
                <div>{request.duration}</div>
                <div className="mt-1 font-semibold text-emerald-300">{formatBudgetDisplay(request)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white/4 border border-white/8 p-3">
                <div className="text-slate-500 mb-1">Activities</div>
                <div className="text-slate-300">{request.preferences?.activities?.join(', ') || 'Open'}</div>
              </div>
              <div className="rounded-xl bg-white/4 border border-white/8 p-3">
                <div className="text-slate-500 mb-1">Avoid</div>
                <div className="text-slate-300">{request.preferences?.avoid?.join(', ') || 'None'}</div>
              </div>
            </div>

            {!isGuide && request.proposals?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">Proposals</h2>
                  <span className="text-xs text-slate-500">{request.proposalCount} received</span>
                </div>
                {request.proposals.map((proposal) => (
                  <div key={proposal.id} className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">{proposal.title}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {proposal.guideName} • {proposal.days} day{proposal.days > 1 ? 's' : ''} • ₹{proposal.price}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {proposal.isBoosted && (
                          <span className="inline-flex rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                            Boosted
                          </span>
                        )}
                        <span className="inline-flex rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                          Score {proposal.relevanceScore}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{proposal.description}</p>
                    <div className="rounded-xl bg-white/4 border border-white/8 p-3 text-xs text-slate-300 whitespace-pre-wrap">
                      {proposal.itinerary}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(proposal.highlights || []).map((highlight) => (
                        <span key={highlight} className="rounded-full bg-white/6 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                          {highlight}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => selectProposal(proposal)}
                        disabled={proposal.selected || proposal.status === 'ACCEPTED'}
                        className="btn-cyan px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                      >
                        {proposal.status === 'ACCEPTED' ? 'Accepted' : proposal.selected ? 'Selected' : 'Accept Proposal'}
                      </button>
                      {proposal.guideUserId && (
                        <Link
                          to={`/chat/${proposal.guideUserId}`}
                          className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/8 transition-colors"
                        >
                          Open Chat
                        </Link>
                      )}
                      {proposal.bookingId ? (
                        <Link
                          to="/bookings"
                          className="px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/15 transition-colors"
                        >
                          View Booking
                        </Link>
                      ) : proposal.guideId ? (
                        <Link
                          to={`/booking/${proposal.guideId}`}
                          className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/8 transition-colors"
                        >
                          Book This Guide
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isGuide && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => openProposalForm(request.id)}
                  className="btn-cyan px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Create Proposal
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="glass rounded-2xl border border-white/6 p-8 text-center text-sm text-slate-400">
          {isGuide ? 'No requests in your city.' : 'You have not posted any preference requests yet.'}
        </div>
      )}

      {proposalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass rounded-2xl border border-white/10 shadow-card-dark">
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div>
                <div className="text-base font-semibold text-white">Send Itinerary Proposal</div>
                <div className="text-xs text-slate-400 mt-1">This will appear in chat for the traveler to review.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProposalModalOpen(false);
                  setProposalForm(emptyProposal);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-slate-300 text-sm border border-white/10"
              >
                Close
              </button>
            </div>
            <form onSubmit={submitProposal} className="p-5 space-y-3">
              <input
                value={proposalForm.title}
                onChange={(event) => setProposalForm((prev) => ({ ...prev, title: event.target.value }))}
                className="input-dark"
                placeholder="Proposal title"
              />
              <textarea
                rows={3}
                value={proposalForm.description}
                onChange={(event) => setProposalForm((prev) => ({ ...prev, description: event.target.value }))}
                className="input-dark resize-none"
                placeholder="Why this plan fits the traveler"
              />
              <textarea
                rows={5}
                value={proposalForm.itinerary}
                onChange={(event) => setProposalForm((prev) => ({ ...prev, itinerary: event.target.value }))}
                className="input-dark resize-none"
                placeholder="Day-wise itinerary"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1}
                  value={proposalForm.days}
                  onChange={(event) => setProposalForm((prev) => ({ ...prev, days: event.target.value }))}
                  className="input-dark"
                  placeholder="Days"
                />
                <input
                  type="number"
                  min={1}
                  value={proposalForm.price}
                  onChange={(event) => setProposalForm((prev) => ({ ...prev, price: event.target.value }))}
                  className="input-dark"
                  placeholder="Price (₹)"
                />
              </div>
              <input
                value={proposalForm.highlights}
                onChange={(event) => setProposalForm((prev) => ({ ...prev, highlights: event.target.value }))}
                className="input-dark"
                placeholder="Highlights separated by commas"
              />
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={proposalForm.isBoosted}
                  onChange={(event) => setProposalForm((prev) => ({ ...prev, isBoosted: event.target.checked }))}
                />
                Boost proposal placement
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={savingProposal} className="btn-cyan px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
                  {savingProposal ? 'Sending...' : 'Send Proposal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProposalModalOpen(false);
                    setProposalForm(emptyProposal);
                  }}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
