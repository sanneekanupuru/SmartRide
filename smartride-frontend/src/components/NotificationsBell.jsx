// src/components/NotificationsBell.jsx
import { useEffect, useState, useRef } from "react";
import { fetchNotifications, markNotificationSeen } from "../services/notifications";

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchNotifications();
      setNotifications(res.data || []);
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // polling every 20 seconds (simple, reliable)
    pollingRef.current = setInterval(load, 20000);
    return () => clearInterval(pollingRef.current);
  }, []);

  const unread = notifications.filter(n => !n.seen).length;

  const onMarkSeen = async (id) => {
    try {
      await markNotificationSeen(id);
      // optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n));
    } catch (e) {
      console.error("Failed to mark notification seen", e);
    }
  };

  return (
    <div className="relative inline-block text-left mr-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100"
        aria-haspopup="true"
        aria-expanded={open}
        title="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unread > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-2 max-h-96 overflow-auto">
            <div className="px-3 py-2 border-b">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Notifications</div>
                <div className="text-sm text-gray-500">{loading ? "Loading..." : `${notifications.length} total`}</div>
              </div>
            </div>

            {notifications.length === 0 && (
              <div className="p-4 text-sm text-gray-600">No notifications</div>
            )}

            {notifications.map(n => (
              <div key={n.id} className={"px-3 py-2 hover:bg-gray-50 flex justify-between " + (n.seen ? "" : "bg-gray-50/60")}>
                <div className="pr-2">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-gray-600">{n.message?.slice(0, 120)}{n.message && n.message.length > 120 ? "..." : ""}</div>
                  <div className="text-xs text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                </div>
                <div className="pl-2 flex flex-col items-end">
                  {!n.seen ? (
                    <button onClick={() => onMarkSeen(n.id)} className="text-xs text-blue-600 hover:underline">Mark read</button>
                  ) : (
                    <span className="text-xs text-gray-400">Read</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
