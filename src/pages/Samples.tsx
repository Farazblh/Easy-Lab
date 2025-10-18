import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Eye, Search, Filter, FileDown, Printer } from 'lucide-react';
import SampleModal from '../components/SampleModal';
import SampleViewModal from '../components/SampleViewModal';
import { generatePDFReport } from '../utils/pdfGenerator';

type Sample = {
  id: string;
  sample_code: string;
  sample_type: string;
  source: string;
  collection_date: string;
  received_date: string;
  status: 'pending' | 'completed';
  user_id: string | null;
  analyst: { id: string; full_name: string } | null;
};

const Samples = () => {
  const { profile } = useAuth();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [viewingSample, setViewingSample] = useState<Sample | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterSamples();
  }, [searchTerm, statusFilter, samples]);

  const fetchSamples = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('samples')
      .select(`
        *,
        profiles:analyst_id (id, full_name)
      `)
      .order('received_date', { ascending: false });

    if (error) {
      console.error('Error fetching samples:', error);
    } else {
      const formattedData = data.map(s => ({
        ...s,
        analyst: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
      }));
      setSamples(formattedData);
    }
    setLoading(false);
  };

  const filterSamples = () => {
    let filtered = samples;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.sample_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.sample_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    setFilteredSamples(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sample?')) return;

    const { error } = await supabase.from('samples').delete().eq('id', id);

    if (error) {
      alert('Error deleting sample: ' + error.message);
    } else {
      fetchSamples();
    }
  };

  const handleEdit = (sample: Sample) => {
    setEditingSample(sample);
    setShowModal(true);
  };

  const handleView = (sample: Sample) => {
    setViewingSample(sample);
    setShowViewModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSample(null);
    fetchSamples();
  };

  const handleGenerateReport = async (sampleId: string, action: 'download' | 'print' = 'download') => {
    const { data: sampleData, error } = await supabase
      .from('samples')
      .select(`
        *,
        profiles:analyst_id (full_name),
        test_results (*)
      `)
      .eq('id', sampleId)
      .maybeSingle();

    if (error || !sampleData) {
      alert('Error fetching sample data for report');
      console.error('Error:', error);
      return;
    }

    const { data: labSettings } = await supabase
      .from('lab_settings')
      .select('*')
      .maybeSingle();

    const testResult = Array.isArray(sampleData.test_results) ? sampleData.test_results[0] : sampleData.test_results;

    const formattedSample = {
      ...sampleData,
      analyst: Array.isArray(sampleData.profiles) ? sampleData.profiles[0] : sampleData.profiles,
      test_result: testResult,
      client: {
        name: sampleData.source || 'N/A',
        company: sampleData.source || 'N/A',
        email: null,
        phone: null,
        address: null,
      }
    };

    const reportType = sampleData.sample_type.toLowerCase().includes('meat') ? 'meat'
      : sampleData.sample_type.toLowerCase().includes('air') ? 'air'
      : sampleData.sample_type.toLowerCase().includes('water') ? 'water'
      : sampleData.sample_type.toLowerCase().includes('food handler') ? 'foodhandler'
      : sampleData.sample_type.toLowerCase().includes('food surface') || sampleData.sample_type.toLowerCase().includes('surface') ? 'foodsurface'
      : sampleData.sample_type.toLowerCase().includes('deboning') ? 'deboning'
      : 'meat';

    let customData = null;
    if (testResult?.custom_data) {
      try {
        customData = typeof testResult.custom_data === 'string'
          ? JSON.parse(testResult.custom_data)
          : testResult.custom_data;
      } catch (e) {
        console.error('Error parsing custom_data:', e);
      }
    }

    await generatePDFReport(
      formattedSample,
      labSettings || {
        lab_name: 'Laboratory Name',
        lab_logo_url: null,
        address: 'Lab Address',
        phone: '+1234567890',
        email: 'lab@example.com',
      },
      {
        download: action === 'download',
        print: action === 'print',
        reportType: reportType,
        customData: customData,
      }
    );

    if (action === 'download') {
      await supabase.from('reports').insert({
        sample_id: sampleId,
        user_id: sampleData.user_id,
        pdf_url: `${sampleData.sample_code}_Report.pdf`,
        generated_by: profile?.id,
      });

      fetchSamples();
    }
  };

  const canModify = profile?.role === 'admin' || profile?.role === 'analyst';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search samples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        {canModify && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Sample
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sample Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Microbiologist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No samples found
                  </td>
                </tr>
              ) : (
                filteredSamples.map((sample) => (
                  <tr key={sample.id} className="hover:bg-orange-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-red-600">{sample.sample_code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sample.sample_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{sample.source}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {sample.analyst?.full_name || 'Junaid Gabol'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          sample.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {sample.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(sample)}
                          className="text-red-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleGenerateReport(sample.id, 'download')}
                          className="text-green-600 hover:text-green-800"
                          title="Download PDF Report"
                        >
                          <FileDown className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleGenerateReport(sample.id, 'print')}
                          className="text-purple-600 hover:text-purple-800"
                          title="Print Report"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleEdit(sample)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                        {profile?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(sample.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <SampleModal
          sample={editingSample}
          onClose={handleModalClose}
        />
      )}

      {showViewModal && viewingSample && (
        <SampleViewModal
          sample={viewingSample}
          onClose={() => {
            setShowViewModal(false);
            setViewingSample(null);
          }}
        />
      )}
    </div>
  );
};

export default Samples;
