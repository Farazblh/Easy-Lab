import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, AlertCircle } from 'lucide-react';

type Analyst = {
  id: string;
  full_name: string;
};

type SampleModalProps = {
  sample?: any;
  onClose: () => void;
};

const SampleModal = ({ sample, onClose }: SampleModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysts, setAnalysts] = useState<Analyst[]>([]);

  const [formData, setFormData] = useState({
    sample_type: '',
    source: '',
    collection_date: '',
    received_date: '',
    analyst_id: '',
    status: 'pending' as 'pending' | 'completed',
  });

  useEffect(() => {
    fetchAnalysts();

    if (sample) {
      setFormData({
        sample_type: sample.sample_type,
        source: sample.source,
        collection_date: sample.collection_date,
        received_date: sample.received_date,
        analyst_id: sample.analyst_id || '',
        status: sample.status,
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData((prev) => ({
        ...prev,
        collection_date: today,
        received_date: today,
      }));
    }
  }, [sample]);

  const fetchAnalysts = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['admin', 'analyst'])
      .order('full_name');
    if (data) setAnalysts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (sample) {
        const { error: updateError } = await supabase
          .from('samples')
          .update(formData)
          .eq('id', sample.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('samples').insert({
          ...formData,
          created_by: user?.id,
          user_id: user?.id,
        });

        if (insertError) throw insertError;
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sampleTypes = ['Water', 'Meat', 'Swab', 'Air', 'Food', 'Soil', 'Other'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {sample ? 'Edit Sample' : 'Add New Sample'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Type *
              </label>
              <select
                required
                value={formData.sample_type}
                onChange={(e) => setFormData({ ...formData, sample_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select type</option>
                {sampleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source / Area *
              </label>
              <select
                required
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select source</option>
                <option value="Micro Lab">Micro Lab</option>
                <option value="Beef Hall 1">Beef Hall 1</option>
                <option value="Beef Hall 2">Beef Hall 2</option>
                <option value="Debone Hall 1">Debone Hall 1</option>
                <option value="Debone Hall 2">Debone Hall 2</option>
                <option value="China Hall 1">China Hall 1</option>
                <option value="China Hall 2">China Hall 2</option>
                <option value="Cooking Area">Cooking Area</option>
                <option value="Chiller">Chiller</option>
                <option value="Freezer">Freezer</option>
                <option value="Blast Freezer">Blast Freezer</option>
                <option value="Chiller Corridor">Chiller Corridor</option>
                <option value="RO Plant">RO Plant</option>
                <option value="Lairage">Lairage</option>
                <option value="Offal Hall 1">Offal Hall 1</option>
                <option value="Offal Hall 2">Offal Hall 2</option>
                <option value="Kitchen 1">Kitchen 1</option>
                <option value="Kitchen 2">Kitchen 2</option>
                <option value="Office Area">Office Area</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Date *
              </label>
              <input
                type="date"
                required
                value={formData.collection_date}
                onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Received Date *
              </label>
              <input
                type="date"
                required
                value={formData.received_date}
                onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Microbiologist
              </label>
              <select
                value={formData.analyst_id}
                onChange={(e) => setFormData({ ...formData, analyst_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Junaid Gabol</option>
                {analysts.map((analyst) => (
                  <option key={analyst.id} value={analyst.id}>
                    {analyst.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                required
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'pending' | 'completed' })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Saving...' : sample ? 'Update Sample' : 'Add Sample'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SampleModal;
