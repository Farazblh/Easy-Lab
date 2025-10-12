import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, AlertCircle } from 'lucide-react';

type TestResultModalProps = {
  sample: any;
  onClose: () => void;
};

const TestResultModal = ({ sample, onClose }: TestResultModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    tpc: '',
    coliforms: '',
    ecoli_o157: '',
    salmonella: '',
    ph: '',
    tds: '',
    remarks: '',
  });

  useEffect(() => {
    if (sample.test_result) {
      setFormData({
        tpc: sample.test_result.tpc?.toString() || '',
        coliforms: sample.test_result.coliforms || '',
        ecoli_o157: sample.test_result.ecoli_o157 || '',
        salmonella: sample.test_result.salmonella || '',
        ph: sample.test_result.ph?.toString() || '',
        tds: sample.test_result.tds?.toString() || '',
        remarks: sample.test_result.remarks || '',
      });
    }
  }, [sample]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resultData = {
        sample_id: sample.id,
        tpc: formData.tpc ? parseFloat(formData.tpc) : null,
        coliforms: formData.coliforms || null,
        ecoli_o157: formData.ecoli_o157 || null,
        salmonella: formData.salmonella || null,
        ph: formData.ph ? parseFloat(formData.ph) : null,
        tds: formData.tds ? parseFloat(formData.tds) : null,
        remarks: formData.remarks || null,
        tested_by: user?.id,
      };

      if (sample.test_result) {
        const { error: updateError } = await supabase
          .from('test_results')
          .update(resultData)
          .eq('id', sample.test_result.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('test_results').insert(resultData);

        if (insertError) throw insertError;
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Test Results</h2>
            <p className="text-sm text-gray-600 mt-1">Sample: {sample.sample_code}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Type</p>
              <p className="font-medium text-gray-900">{sample.sample_type}</p>
            </div>
            <div>
              <p className="text-gray-500">Source</p>
              <p className="font-medium text-gray-900">{sample.source}</p>
            </div>
            <div>
              <p className="text-gray-500">Client</p>
              <p className="font-medium text-gray-900">{sample.client?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  sample.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {sample.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TPC (CFU/ml)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tpc}
                onChange={(e) => setFormData({ ...formData, tpc: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter TPC value"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coliforms</label>
              <select
                value={formData.coliforms}
                onChange={(e) => setFormData({ ...formData, coliforms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select result</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E. coli O157</label>
              <select
                value={formData.ecoli_o157}
                onChange={(e) => setFormData({ ...formData, ecoli_o157: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select result</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salmonella</label>
              <select
                value={formData.salmonella}
                onChange={(e) => setFormData({ ...formData, salmonella: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select result</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
              <input
                type="number"
                step="0.01"
                value={formData.ph}
                onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter pH value"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TDS (mg/L)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tds}
                onChange={(e) => setFormData({ ...formData, tds: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter TDS value"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter any additional remarks or observations..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Saving...' : sample.test_result ? 'Update Results' : 'Save Results'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestResultModal;
