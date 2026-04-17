import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import RevenueModelSection from '../components/RevenueModelSection';
import { guidesAPI } from '../services/api';

export default function PricingPage() {
  const { user } = useAuth();
  const normalizedRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
    : [];
  const isGuide = normalizedRoles.includes('GUIDE');

  // Non-guide users are silently redirected — no error page shown
  if (user && !isGuide) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data, isLoading, isError } = useQuery(
    ['guide-revenue-model', user?.id],
    () => guidesAPI.getRevenueModel().then((r) => r.data),
    {
      enabled: !!user?.id && isGuide,
      retry: 1,
    }
  );

  const model = isGuide && !isError && data ? data : null;

  return (
    <RevenueModelSection
      model={model}
      loading={isGuide && isLoading}
      showStaticDefault={!isGuide || !model}
    />
  );
}
