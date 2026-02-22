import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import { getAuthToken } from '../lib/trpc-provider';

export function useAuth() {
  const navigate = useNavigate();
  const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    enabled: !!getAuthToken()
  });

  const requireAuth = () => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  };

  const requireRole = (role: 'professor' | 'student') => {
    if (!isLoading && user && user.appRole !== role) {
      navigate('/');
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    requireAuth,
    requireRole
  };
}
