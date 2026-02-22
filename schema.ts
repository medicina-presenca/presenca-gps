import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import { useGeolocation } from '../hooks/useGeolocation';
import { LoadingScreen, LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [checkInStatus, setCheckInStatus] = useState<string | null>(null);
  
  const { data: user } = trpc.auth.me.useQuery();
  const activityId = Number(id);

  const {
    data: activity,
    isLoading,
    error,
    refetch
  } = trpc.activities.getById.useQuery(
    { id: activityId },
    { enabled: !isNaN(activityId), retry: 1 }
  );

  const checkInMutation = trpc.activities.checkIn.useMutation({
    onSuccess: (data) => {
      setCheckInStatus(data.message);
      refetch();
    },
    onError: (err) => {
      setCheckInStatus(`Erro: ${err.message}`);
    }
  });

  const {
    latitude,
    longitude,
    accuracy,
    error: gpsError,
    loading: gpsLoading,
    refresh: refreshLocation
  } = useGeolocation();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  if (isLoading) {
    return <LoadingScreen message="Carregando agenda..." />;
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <ErrorMessage
            title="Erro ao carregar agenda"
            message={error?.message || 'Agenda não encontrada'}
            onRetry={() => navigate('/')}
          />
        </div>
      </div>
    );
  }

  const startTime = new Date(activity.startTime);
  const endTime = new Date(activity.endTime);
  const now = new Date();
  const isActive = now >= startTime && now <= endTime;
  const canCheckIn = user.appRole === 'student' && isActive && !activity.attendance;

  const handleCheckIn = async () => {
    if (!latitude || !longitude || !accuracy) {
      setCheckInStatus('Aguardando localização GPS...');
      refreshLocation();
      return;
    }

    setCheckInStatus(null);
    await checkInMutation.mutateAsync({
      activityId,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date()
    });
  };

  const statusColors = {
    accepted: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  const statusLabels = {
    accepted: 'Presença Confirmada ✓',
    rejected: 'Presença Rejeitada',
    pending: 'Presença Pendente'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-white mb-4 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Voltar
          </button>
          <h1 className="text-2xl font-bold">{activity.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Activity Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Informações</h2>

          {activity.description && (
            <div className="mb-4">
              <p className="text-gray-700">{activity.description}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-3 mt-0.5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              <div>
                <p className="font-medium text-gray-900">{activity.locationName}</p>
                <p className="text-sm text-gray-600">
                  Raio: {activity.radiusMeters}m
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-3 mt-0.5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-medium text-gray-900">
                  {startTime.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {startTime.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}{' '}
                  às{' '}
                  {endTime.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Status */}
        {activity.attendance && (
          <div
            className={`rounded-lg border p-6 ${
              statusColors[activity.attendance.status]
            }`}
          >
            <h3 className="font-semibold text-lg mb-2">
              {statusLabels[activity.attendance.status]}
            </h3>
            {activity.attendance.status === 'rejected' && (
              <p className="text-sm">{(activity.attendance as any).rejectReason}</p>
            )}
          </div>
        )}

        {/* Check-in Section (Student only) */}
        {canCheckIn && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Registrar Presença</h2>

            {gpsError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{gpsError}</p>
              </div>
            )}

            {checkInStatus && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">{checkInStatus}</p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-mono">
                  {latitude ? latitude.toFixed(6) : '---'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-mono">
                  {longitude ? longitude.toFixed(6) : '---'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Precisão GPS:</span>
                <span className="font-mono">
                  {accuracy ? `±${accuracy.toFixed(0)}m` : '---'}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending || gpsLoading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {checkInMutation.isPending ? (
                <LoadingSpinner size="sm" className="border-white border-t-transparent" />
              ) : gpsLoading ? (
                'Aguardando GPS...'
              ) : !latitude || !longitude ? (
                'Obter Localização'
              ) : (
                'Confirmar Presença'
              )}
            </button>

            {!latitude && !gpsLoading && (
              <button
                onClick={refreshLocation}
                className="w-full mt-2 text-sm text-primary hover:underline"
              >
                Tentar obter localização novamente
              </button>
            )}
          </div>
        )}

        {!isActive && !activity.attendance && user.appRole === 'student' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              {now < startTime
                ? 'Esta agenda ainda não está ativa.'
                : 'Esta agenda já foi encerrada.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
