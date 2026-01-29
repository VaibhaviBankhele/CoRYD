import { MapPin, Users, DollarSign, Badge, Trash2 } from 'lucide-react';
import { PASSENGER_STATUS } from '../../utils/constants';

export default function PassengerCard({ passenger, onBoard, onDrop, isDrive = false, isProcessing = false }) {
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'MATCHED':
        return 'badge-yellow';
      case 'BOARDED':
        return 'badge-green';
      case 'DROPPED':
        return 'badge-gray';
      default:
        return 'badge-blue';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'MATCHED':
        return '⏳ Waiting for pickup';
      case 'BOARDED':
        return '✓ In ride';
      case 'DROPPED':
        return '✅ Completed';
      default:
        return status;
    }
  };

  return (
    <div className="card bg-white border-l-4 border-blue-500 hover:shadow-lg transition mb-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-gray-900">{passenger.riderName || 'Unknown'}</h4>
          <span className={`badge text-xs ${getStatusBadgeColor(passenger.status)}`}>
            {getStatusText(passenger.status)}
          </span>
        </div>
        <span className="text-sm text-gray-500"># {passenger.id}</span>
      </div>

      <div className="space-y-2 text-sm mb-3">
        <div className="flex items-center text-gray-700">
          <MapPin size={16} className="mr-2 text-blue-500" />
          <span>{passenger.boardingLocation} → {passenger.dropLocation}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-gray-600">
            📍 {passenger.distanceInKm?.toFixed(2)} km
          </div>
          <div className="text-green-600 font-bold">
            ₹{passenger.fareAmount?.toFixed(2)}
          </div>
        </div>
      </div>

      {isDrive && (
        <div className="flex gap-2">
          {passenger.status === 'MATCHED' && (
            <button
              onClick={() => onBoard(passenger.id)}
              className="flex-1 btn-success text-sm py-1 px-2"
            >
              🆙 Pick Up
            </button>
          )}

          {passenger.status === 'BOARDED' && (
            <button
              onClick={() => onDrop(passenger.id)}
              disabled={isProcessing}
              className={`flex-1 text-sm py-1 px-2 font-bold rounded cursor-pointer ${isProcessing ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'btn-danger'}`}
            >
              {isProcessing ? '💳 Processing...' : '📍 Drop Off'}
            </button>
          )}

          {passenger.status === 'DROPPED' && (
            <button
              disabled
              className="flex-1 bg-gray-300 text-gray-600 font-bold text-sm py-1 px-2 rounded cursor-not-allowed"
            >
              ✓ Completed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
