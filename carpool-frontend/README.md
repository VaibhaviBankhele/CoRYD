# Carpool Frontend

A modern React-based carpool application frontend that allows riders and drivers to connect and share rides.

## Features

### 🚗 Driver Features
- Go online with route selection using interactive maps
- View active ride requests
- Accept and manage ride requests
- Track earnings from completed rides
- View and update profile information

### 🚕 Rider Features
- Request rides with location selection
- View available rides and active ride status
- Track ride history and payment history
- Rate drivers and view ratings
- Manage profile information

### 🗺️ Map Integration
- Interactive map picker using Leaflet and OpenStreetMap
- Real-time location display
- Route visualization between pickup and drop locations

## Tech Stack

- **React 18.3** - UI framework
- **Vite 7.2** - Build tool and dev server
- **React Router 7.13** - Navigation and routing
- **Axios 1.13** - HTTP client
- **React Leaflet 5.0** - Interactive maps
- **Leaflet 1.9** - Map library

## Project Structure

```
src/
├── api/              # API integration modules
├── components/       # Reusable React components
│   ├── Common/      # Shared components (Loader, ErrorMessage, etc.)
│   ├── Map/         # Map components (MapPicker, MapView)
│   ├── Navbar/      # Navigation bars for drivers and riders
│   ├── Notifications/ # Notification components
│   └── Ratings/     # Rating components
├── context/         # React context for state management
├── pages/           # Page components
│   ├── auth/        # Login and Register pages
│   ├── driver/      # Driver-specific pages
│   └── rider/       # Rider-specific pages
├── routes/          # Route definitions
├── styles/          # Global CSS
└── utils/           # Utility functions
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

## API Configuration

The app connects to a backend API running on `http://localhost:8080`. Update the `baseURL` in `src/api/axios.js` if your backend is running on a different URL.

## Authentication

- Uses localStorage to store user session
- Automatic redirection based on user role (DRIVER/RIDER)
- Protected routes with role-based access control

## Key Components

### Authentication
- **Login.jsx** - User login with email and password
- **Register.jsx** - User registration with role selection
- **AuthContext.jsx** - Global authentication state management

### Driver Pages
- **DriverHome.jsx** - Go online with route selection
- **ActiveRide.jsx** - View and accept ride requests
- **DriverEarnings.jsx** - Track earnings from completed rides
- **DriverProfile.jsx** - View driver profile

### Rider Pages
- **RiderHome.jsx** - Request a ride
- **RiderActiveRide.jsx** - Monitor active ride
- **RiderRides.jsx** - View available rides with filtering
- **RiderPayments.jsx** - Track payment history
- **RiderRideDetails.jsx** - Detailed ride information
- **RiderProfile.jsx** - View rider profile

### Common Components
- **MapPicker.jsx** - Interactive location selection
- **MapView.jsx** - Display route on map
- **Loader.jsx** - Loading indicator
- **ErrorMessage.jsx** - Error display
- **ProtectedRoute.jsx** - Route protection

## API Endpoints Used

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `GET /api/users/{id}` - Get user profile

### Rides
- `POST /api/rides/create` - Create a new ride (driver)
- `POST /api/rides/request` - Request a ride (rider)
- `GET /api/rides/available` - Get available rides
- `GET /api/rides/{id}` - Get ride details
- `GET /api/rides/driver/{driverId}` - Get driver's rides

### Matches
- `GET /api/matches/driver/{driverId}` - Get driver's ride requests
- `POST /api/matches/{matchId}/accept` - Accept a ride request

### Other
- `GET /api/notifications/user/{userId}` - Get notifications
- `GET /api/payments/rating/{userId}` - Get user rating

## Styling

The application uses a combination of:
- CSS files in `src/styles/` and `src/components/*/`
- Inline styles for dynamic theming
- CSS classes for consistent styling

Color scheme:
- Primary: `#0066cc` (Blue)
- Secondary: `#9933cc` (Purple)
- Success: `#4caf50` (Green)
- Error: `#f44336` (Red)
- Warning: `#ff9800` (Orange)

## Future Enhancements

- [ ] Payment integration
- [ ] Real-time notifications using WebSockets
- [ ] Advanced search and filtering
- [ ] Driver/Rider ratings and reviews
- [ ] Chat functionality
- [ ] Push notifications
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, Vite will try the next available port. Check the console output.

### Map Not Loading
Ensure you have internet connectivity as the map uses OpenStreetMap tiles.

### API Connection Issues
Verify that your backend API is running on `http://localhost:8080` and update the URL in `src/api/axios.js` if needed.

### Authentication Issues
Clear localStorage and cookies, then try logging in again:
```javascript
localStorage.clear();
```

## License

MIT
