export default function RideSummaryCard({ ride }) {
    return (
      <div>
        <p>
          {ride.pickupLocation} → {ride.dropLocation}
        </p>
        <p>Fare: ₹{ride.estimatedFare}</p>
      </div>
    );
  }
  