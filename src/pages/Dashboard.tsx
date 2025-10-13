import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TestTube, Clock, CheckCircle, FileText, Trash2 } from 'lucide-react';

type Stats = {
  totalSamples: number;
  pendingSamples: number;
  completedSamples: number;
  totalReports: number;
};

type RecentSample = {
  id: string;
  sample_code: string;
  sample_type: string;
  status: string;
  received_date: string;
  source: string;
};


const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalSamples: 0,
    pendingSamples: 0,
    completedSamples: 0,
    totalReports: 0,
  });
  const [recentSamples, setRecentSamples] = useState<RecentSample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    const [totalRes, pendingRes, completedRes, reportsRes] = await Promise.all([
      supabase.from('samples').select('id', { count: 'exact', head: true }),
      supabase.from('samples').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('samples').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('reports').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      totalSamples: totalRes.count || 0,
      pendingSamples: pendingRes.count || 0,
      completedSamples: completedRes.count || 0,
      totalReports: reportsRes.count || 0,
    });

    const { data: samplesData } = await supabase
      .from('samples')
      .select(`
        id,
        sample_code,
        sample_type,
        status,
        received_date,
        source
      `)
      .order('received_date', { ascending: false })
      .limit(5);

    if (samplesData) {
      setRecentSamples(samplesData);
    }

    setLoading(false);
  };

  const handleDeleteAll = async (type: 'all' | 'pending' | 'completed') => {
    const confirmMessages = {
      all: 'Are you sure you want to delete ALL samples? This will also delete related test results.',
      pending: 'Are you sure you want to delete all PENDING samples?',
      completed: 'Are you sure you want to delete all COMPLETED samples?'
    };

    if (!confirm(confirmMessages[type])) return;

    try {
      if (type === 'all') {
        const { error } = await supabase.from('samples').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('samples').delete().eq('status', type);
        if (error) throw error;
      }

      fetchDashboardData();
      alert('Data deleted successfully');
    } catch (error: any) {
      alert('Error deleting data: ' + error.message);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, onDelete }: { icon: any; label: string; value: number; color: string; onDelete?: () => void }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {profile?.role === 'admin' && onDelete && value > 0 && (
            <button
              onClick={onDelete}
              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
              title="Delete all"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={TestTube}
          label="Total Samples"
          value={stats.totalSamples}
          color="bg-blue-600"
          onDelete={() => handleDeleteAll('all')}
        />
        <StatCard
          icon={Clock}
          label="Pending Samples"
          value={stats.pendingSamples}
          color="bg-orange-500"
          onDelete={() => handleDeleteAll('pending')}
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completedSamples}
          color="bg-green-600"
          onDelete={() => handleDeleteAll('completed')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Samples</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sample Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSamples.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                      No samples found
                    </td>
                  </tr>
                ) : (
                  recentSamples.map((sample) => (
                    <tr key={sample.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{sample.sample_code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{sample.sample_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            sample.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {sample.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
