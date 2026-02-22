import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import { LoadingScreen } from '../components/LoadingSpinner';
import { ErrorMessage, EmptyState } from '../components/ErrorMessage';

interface Activity {
  id: number;
  title: string;
  locationName: string;
  startTime: Date;
  endTime: Date;
  attendance?: {
    status: 'accepted' | 'rejected' | 'pending';
  } | null;
}

function ActivityCard({ activity }: { activity: Activity }) {
  const navigate = useNavigate();
  const startTime = new Date(activity.startTime);
  const endTime = new Date(activity.endTime);
  const now = new Date();
  const isActive = now >= startTime && now <= endTime;
  const isPast = now > endTime;

  const statusColors = {
    accepted: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  const statusLabels = {
    accepted: 'Presente',
    rejected: 'Rejeitado',
    pending: 'Pendente'
  };

  return (
    <div
      onClick={() => navigate(`/activities/${activity.id}`)}
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
        {activity.attendance && (
          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              statusColors[activity.attendance.status]
            }`}
          >
            {statusLabels[activity.attendance.status]}
          </span>
        )}
      </div>

      <div className="flex items-center text-sm text-gray-600 mb-2">
        <svg
          className="w-4 h-4 mr-2"
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>{activity.locationName}</span>
      </div>

      <div className="flex items-center text-sm text-gray-600">
        <svg
          className="w-4 h-4 mr-2"
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
        <span>
          {startTime.toLocaleDateString('pt-BR')} •{' '}
          {startTime.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}{' '}
          -{' '}
          {endTime.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>

      {isActive && !activity.attendance && (
        <div className="mt-3 flex items-center text-sm text-green-600 font-medium">
          <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
          Ativo agora
        </div>
      )}

      {isPast && !activity.attendance && (
        <div className="mt-3 text-sm text-red-600">Ausente</div>
      )}
    </div>
  );
}

export function ActivitiesPage() {
  const navigate = useNavigate();
  const { data: user } = trpc.auth.me.useQuery();

  const {
    data: activities = [],
    isLoading,
    error,
    refetch
  } = trpc.activities.list.useQuery(undefined, {
    retry: 1
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  if (isLoading) {
    return <LoadingScreen message="Carregando agendas..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <ErrorMessage
            title="Erro ao carregar agendas"
            message={error.message || 'Ocorreu um erro ao buscar as agendas.'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Olá, {user.name}</h1>
          <p className="text-primary-light mt-1">
            {user.appRole === 'student' ? 'Minhas Agendas' : 'Agendas Criadas'}
          </p>
        </div>
      </div>

      {/* Activities List */}
      <div className="max-w-4xl mx-auto p-4">
        {activities.length === 0 ? (
          <EmptyState
            title="Nenhuma agenda encontrada"
            message={
              user.appRole === 'student'
                ? 'Você ainda não está inscrito em nenhuma agenda.'
                : 'Você ainda não criou nenhuma agenda.'
            }
            icon={
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
          />
        ) : (
          <div className="space-y-4">
            {activities.map((activity: any) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Professor only) */}
      {user.appRole === 'professor' && (
        <button
          onClick={() => navigate('/activities/create')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
