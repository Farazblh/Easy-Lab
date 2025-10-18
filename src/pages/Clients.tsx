import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Search, FileText, Download } from 'lucide-react';
import ClientModal from '../components/ClientModal';
import { exportToCSV } from '../utils/csvExport';

type Client = {
  id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  sample_count?: number;
};

const Clients = () => {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    setLoading(true);
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching clients:', error);
    } else if (clientsData) {
      const clientsWithCount = await Promise.all(
        clientsData.map(async (client) => {
          const { count } = await supabase
            .from('samples')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id);
          return { ...client, sample_count: count || 0 };
        })
      );
      setClients(clientsWithCount);
    }
    setLoading(false);
  };

  const filterClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier? This will also delete all associated samples.')) return;

    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) {
      alert('Error deleting supplier: ' + error.message);
    } else {
      fetchClients();
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingClient(null);
    fetchClients();
  };

  const handleExportCSV = () => {
    const exportData = filteredClients.map(client => ({
      Name: client.name,
      Company: client.company,
      Email: client.email || '',
      Phone: client.phone || '',
      Address: client.address || '',
      'Sample Count': client.sample_count || 0,
      'Created Date': new Date(client.created_at).toLocaleDateString(),
    }));

    exportToCSV(exportData, `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
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
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          {canModify && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Supplier
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No suppliers found</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-600">{client.company}</p>
                </div>
                {canModify && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    {profile?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-amber-900 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">Email:</span>
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">Phone:</span>
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <span className="font-medium">Address:</span>
                    <span className="flex-1">{client.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{client.sample_count || 0} samples</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Added {new Date(client.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && <ClientModal client={editingClient} onClose={handleModalClose} />}
    </div>
  );
};

export default Clients;
