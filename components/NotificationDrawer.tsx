import React from "react";


interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: Notification[];
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "New Course Available",
    message: "Advanced Python course is now available for enrollment.",
    time: "2m ago",
    unread: true,
  },
  {
    id: "2",
    title: "Assignment Due",
    message: "Your DBMS assignment is due tomorrow.",
    time: "1h ago",
    unread: true,
  },
  {
    id: "3",
    title: "Progress Update",
    message: "You completed 62% of the Encryption module.",
    time: "3h ago",
    unread: false,
  },
  {
    id: "4",
    title: "Mentor Message",
    message: "Your mentor left feedback on your latest submission.",
    time: "1d ago",
    unread: false,
  },
];

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications = SAMPLE_NOTIFICATIONS,
}) => {
  return (
    <>
      <div
        className={`drawer-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />

      <div className={`notif-drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title">
            <div className="drawer-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>

            <div>
              <div className="flabel">Inbox</div>
              <h4>Notifications</h4>
            </div>
          </div>

          <button
            className="drawer-close"
            onClick={onClose}
            aria-label="Close notifications"
          >
            ×
          </button>
        </div>

        <div className="asc-sm"></div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="empty-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <h4>No notifications</h4>
            <p>You're all caught up.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-card ${
                  n.unread ? "notification-unread" : ""
                }`}
              >
                <div className="notification-top">
                  <div className="notification-heading">
                    {n.unread && (
                      <span className="notification-dot"></span>
                    )}

                    <span>{n.title}</span>
                  </div>

                  <span className="notification-time">
                    {n.time}
                  </span>
                </div>

                <p className="notification-message">
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationDrawer;