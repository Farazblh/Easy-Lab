import { X } from 'lucide-react';

type SampleViewModalProps = {
  sample: any;
  onClose: () => void;
};

const SampleViewModal = ({ sample, onClose }: SampleViewModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Sample Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Sample Code</p>
              <p className="text-lg font-semibold text-red-600">{sample.sample_code}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span
                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  sample.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {sample.status}
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Sample Type</p>
              <p className="text-base font-medium text-gray-900">{sample.sample_type}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Source / Area</p>
              <p className="text-base font-medium text-gray-900">{sample.source}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Collection Date</p>
              <p className="text-base font-medium text-gray-900">
                {new Date(sample.collection_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Received Date</p>
              <p className="text-base font-medium text-gray-900">
                {new Date(sample.received_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Client Name</p>
              <p className="text-base font-medium text-gray-900">{sample.client?.name || 'N/A'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Company</p>
              <p className="text-base font-medium text-gray-900">{sample.client?.company || 'N/A'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Assigned Analyst</p>
              <p className="text-base font-medium text-gray-900">
                {sample.analyst?.full_name || 'Unassigned'}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleViewModal;
