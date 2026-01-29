// Pune locations with coordinates
export const PUNE_LOCATIONS = [
  { name: 'Hinjewadi Phase 1', lat: 18.5912, lng: 73.7389 },
  { name: 'Hinjewadi Phase 2', lat: 18.5827, lng: 73.7241 },
  { name: 'Kothrud', lat: 18.5074, lng: 73.8077 },
  { name: 'Baner', lat: 18.5593, lng: 73.7793 },
  { name: 'Aundh', lat: 18.5592, lng: 73.8074 },
  { name: 'Viman Nagar', lat: 18.5679, lng: 73.9172 },
  { name: 'Wakad', lat: 18.5761, lng: 73.8138 },
  { name: 'Pimpri', lat: 18.6298, lng: 73.8006 },
  { name: 'Akurdi', lat: 18.6368, lng: 73.8237 },
  { name: 'Pune Railway Station', lat: 18.5204, lng: 73.8567 },
  { name: 'FC Road', lat: 18.5301, lng: 73.8445 },
  { name: 'Koregaon Park', lat: 18.5334, lng: 73.8822 },
];

export const API_BASE_URL = 'http://localhost:8080/api';

export const USER_ROLES = {
  RIDER: 'RIDER',
  DRIVER: 'DRIVER',
};

export const RIDE_STATUS = {
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

export const PASSENGER_STATUS = {
  MATCHED: 'MATCHED',
  BOARDED: 'BOARDED',
  DROPPED: 'DROPPED',
};

export const RIDE_REQUEST_STATUS = {
  PENDING: 'PENDING',
  MATCHED: 'MATCHED',
  IN_RIDE: 'IN_RIDE',
  COMPLETED: 'COMPLETED',
};

export const STATUS_COLORS = {
  MATCHED: 'yellow',
  BOARDED: 'green',
  DROPPED: 'gray',
  WAITING: 'orange',
  IN_PROGRESS: 'blue',
  COMPLETED: 'gray',
  PENDING: 'orange',
};

export const FARE_CONFIG = {
  BASE_FARE: 50, // ₹50
  PER_KM_RATE: 10, // ₹10/km
};
