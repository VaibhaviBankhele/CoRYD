import { PUNE_LOCATIONS } from '../../utils/constants';
import { MapPin } from 'lucide-react';

export default function LocationPicker({ label, value, onSelect, required = true }) {
  const selectedLocation = PUNE_LOCATIONS.find(loc => loc.name === value);

  return (
    <div className="mb-4">
      <label className="block text-gray-700 font-bold mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2 items-center">
        <MapPin className="text-blue-500" size={20} />
        <select
          value={value || ''}
          onChange={(e) => {
            const location = PUNE_LOCATIONS.find(loc => loc.name === e.target.value);
            onSelect(location);
          }}
          className="input-field flex-1"
          required={required}
        >
          <option value="">Select a location</option>
          {PUNE_LOCATIONS.map(location => (
            <option key={location.name} value={location.name}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
      
      {selectedLocation && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
          📍 {selectedLocation.name}
          <br />
          <span className="text-xs text-gray-500">
            Lat: {selectedLocation.lat.toFixed(4)}, Lng: {selectedLocation.lng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}
