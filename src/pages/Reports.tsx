import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, FileText, Trash2, Download } from 'lucide-react';
import { generatePDFReport } from '../utils/pdfGenerator';

type Report = {
  id: string;
  pdf_url: string;
  date_generated: string;
  sample: {
    sample_code: string;
    sample_type: string;
    status: string;
    source: string;
  } | null;
  generator: {
    full_name: string;
  } | null;
};

const Reports = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchTerm, dateFilter, reports]);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        samples:sample_id (sample_code, sample_type, status, source),
        generator:generated_by (full_name)
      `)
      .order('date_generated', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      const formattedData = data.map(r => ({
        ...r,
        sample: Array.isArray(r.samples) ? r.samples[0] : r.samples,
        generator: Array.isArray(r.generator) ? r.generator[0] : r.generator
      }));
      setReports(formattedData);
    }
    setLoading(false);
  };

  const filterReports = () => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.sample?.sample_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.sample?.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((r) => new Date(r.date_generated) >= filterDate);
    }

    setFilteredReports(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report record?')) return;

    const { error } = await supabase.from('reports').delete().eq('id', id);

    if (error) {
      alert('Error deleting report: ' + error.message);
    } else {
      fetchReports();
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const { data: reportData, error } = await supabase
        .from('reports')
        .select(`
          *,
          sample:sample_id (
            *,
            test_result:test_results (*)
          ),
          generated_by_user:generated_by (*)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;

      const { data: labSettings } = await supabase
        .from('lab_settings')
        .select('*')
        .maybeSingle();

      const sampleInfo = reportData.sample;
      const testResults = Array.isArray(sampleInfo.test_result)
        ? sampleInfo.test_result
        : [sampleInfo.test_result];
      const testResult = testResults[0];

      const sampleData = {
        sample_code: sampleInfo.sample_code,
        sample_type: sampleInfo.sample_type,
        source: sampleInfo.source,
        collection_date: sampleInfo.collection_date,
        received_date: sampleInfo.received_date,
        status: sampleInfo.status,
        client: {
          name: sampleInfo.source,
          company: sampleInfo.source,
          email: null,
          phone: null,
          address: null,
        },
        test_result: testResult,
        analyst: {
          full_name: reportData.generated_by_user?.full_name || 'Lab Analyst',
        },
      };

      const reportType = sampleInfo.sample_type.toLowerCase().includes('meat') ? 'meat'
        : sampleInfo.sample_type.toLowerCase().includes('air') ? 'air'
        : sampleInfo.sample_type.toLowerCase().includes('water') ? 'water'
        : sampleInfo.sample_type.toLowerCase().includes('food handler') ? 'foodhandler'
        : sampleInfo.sample_type.toLowerCase().includes('food surface') || sampleInfo.sample_type.toLowerCase().includes('surface') ? 'foodsurface'
        : sampleInfo.sample_type.toLowerCase().includes('deboning') ? 'deboning'
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
        sampleData,
        labSettings || {
          lab_name: 'THE ORGANIC MEAT COMPANY LIMITED',
          lab_logo_url: null,
          address: null,
          phone: null,
          email: null,
        },
        {
          download: true,
          print: false,
          reportType: reportType,
          customData: customData,
        }
      );
    } catch (error: any) {
      alert('Error downloading report: ' + error.message);
    }
  };

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
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-amber-900">Generated Reports</h3>
          <p className="text-sm text-gray-600 mt-1">{filteredReports.length} total reports</p>
        </div>
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
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Generated
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
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-amber-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-900" />
                        <span className="text-sm font-medium text-amber-900">
                          {report.sample?.sample_code || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {report.sample?.sample_type || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{report.sample?.source || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {report.generator?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(report.date_generated).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Generated
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(report.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Download Report"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {profile?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="text-amber-900 hover:text-red-900"
                            title="Delete Report Record"
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
    </div>
  );
};

export default Reports;
