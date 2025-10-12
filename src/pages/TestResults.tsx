import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Edit, FileText, Search } from 'lucide-react';
import TestResultModal from '../components/TestResultModal';

type SampleWithResult = {
  id: string;
  sample_code: string;
  sample_type: string;
  source: string;
  status: string;
  client: { name: string; company: string } | null;
  test_result: {
    id: string;
    tpc: number | null;
    coliforms: string | null;
    ecoli_o157: string | null;
    salmonella: string | null;
    ph: number | null;
    tds: number | null;
    remarks: string | null;
  } | null;
};

const TestResults = () => {
  const { profile } = useAuth();
  const [samples, setSamples] = useState<SampleWithResult[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<SampleWithResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SampleWithResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterSamples();
  }, [searchTerm, samples]);

  const fetchSamples = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('samples')
      .select(`
        *,
        clients:client_id (name, company),
        test_results (*)
      `)
      .order('received_date', { ascending: false });

    if (error) {
      console.error('Error fetching samples:', error);
    } else {
      const formattedData = data.map(s => ({
        ...s,
        client: Array.isArray(s.clients) ? s.clients[0] : s.clients,
        test_result: Array.isArray(s.test_results) ? s.test_results[0] : s.test_results
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
          s.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSamples(filtered);
  };

  const handleEdit = (sample: SampleWithResult) => {
    setSelectedSample(sample);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSample(null);
    fetchSamples();
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
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TPC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coliforms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E. coli O157
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No samples found
                  </td>
                </tr>
              ) : (
                filteredSamples.map((sample) => (
                  <tr key={sample.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{sample.sample_code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sample.sample_type}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{sample.client?.name || 'N/A'}</p>
                        <p className="text-gray-500 text-xs">{sample.client?.company || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sample.test_result?.tpc || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sample.test_result?.coliforms ? (
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            sample.test_result.coliforms === 'positive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {sample.test_result.coliforms}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sample.test_result?.ecoli_o157 ? (
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            sample.test_result.ecoli_o157 === 'positive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {sample.test_result.ecoli_o157}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          sample.test_result
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {sample.test_result ? 'Recorded' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {canModify && (
                        <button
                          onClick={() => handleEdit(sample)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {sample.test_result ? (
                            <>
                              <Edit className="w-4 h-4" />
                              Edit
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              Add Results
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedSample && (
        <TestResultModal sample={selectedSample} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default TestResults;
