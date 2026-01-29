export default function ActiveRideCard({ ride }) {
    return (
      <div>
        <h4>Active Ride</h4>
        <p>{ride.pickupLocation} → {ride.dropLocation}</p>
        <p>Status: {ride.status}</p>
      </div>
    );
  }
  