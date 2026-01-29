export const formatFare = (amount) => {
    if (!amount) return "₹0";
    return `₹${amount.toFixed(2)}`;
  };
  
  export const fareBreakdown = (distanceKm, ratePerKm = 10, baseFare = 50) => {
    return {
      baseFare,
      distanceFare: distanceKm * ratePerKm,
      totalFare: baseFare + distanceKm * ratePerKm,
    };
  };
  