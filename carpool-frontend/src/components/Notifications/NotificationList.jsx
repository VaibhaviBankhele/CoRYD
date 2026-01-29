import React from "react";
import { useEffect, useState } from "react";
import { notificationAPI } from "../../api/axiosAPI";

export default function NotificationList() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationAPI.getUnreadNotifications(user.id);
        const newNotifications = res.data || [];
        
        // Prevent duplicates - only add notifications not already shown
        setNotifications((prevNotifs) => {
          const existingIds = new Set(prevNotifs.map(n => n.id));
          const uniqueNewNotifs = newNotifications.filter(
            n => !existingIds.has(n.id)
          );
          
          // Merge and keep only last 10 notifications
          const merged = [...prevNotifs, ...uniqueNewNotifs];
          return merged.slice(-10);
        });
        
        setLastFetch(new Date());
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Fetch every 15 seconds
    return () => clearInterval(interval);
  }, [user.id]);

  const visibleNotifications = notifications.filter(
    (n) => !dismissedIds.includes(n.id),
  );

  const dismissNotification = (id) => {
    setDismissedIds([...dismissedIds, id]);
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case "MATCH_FOUND":
        return { bg: "bg-green-50", border: "border-green-200", icon: "🚗", title: "New Ride Match!" };
      case "RIDE_STARTED":
        return { bg: "bg-blue-50", border: "border-blue-200", icon: "▶️", title: "Ride Started" };
      case "PASSENGER_BOARDED":
        return { bg: "bg-purple-50", border: "border-purple-200", icon: "✓", title: "Passenger Boarded" };
      case "PASSENGER_DROPPED":
        return { bg: "bg-orange-50", border: "border-orange-200", icon: "📍", title: "Passenger Dropped" };
      case "PAYMENT_SUCCESS":
        return { bg: "bg-emerald-50", border: "border-emerald-200", icon: "✓", title: "Payment Successful" };
      case "PAYMENT_FAILED":
        return { bg: "bg-red-50", border: "border-red-200", icon: "✕", title: "Payment Failed" };
      case "RIDE_COMPLETED":
        return { bg: "bg-cyan-50", border: "border-cyan-200", icon: "✓", title: "Ride Completed" };
      default:
        return { bg: "bg-blue-50", border: "border-blue-200", icon: "🔔", title: "Notification" };
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          🔔 Notifications ({visibleNotifications.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {visibleNotifications.map((n) => {
            const style = getNotificationStyle(n.type);
            return (
              <div
                key={n.id}
                className={`flex items-start justify-between p-3 ${style.bg} border ${style.border} rounded-lg transition hover:shadow-md`}
              >
                <div className="flex-1 flex items-start gap-3">
                  <span className="text-lg mt-1">{style.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {style.title}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(n.id)}
                  className="ml-3 text-gray-400 hover:text-gray-600 p-1 flex-shrink-0 text-xl"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
