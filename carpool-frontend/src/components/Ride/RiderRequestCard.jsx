export default function RiderRequestCard({ request }) {
    return (
      <div>
        <p>{request.pickupLocation} → {request.dropLocation}</p>
      </div>
    );
  }
  