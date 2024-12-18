import React from "react";

interface NotificationProps {
  message: string;
}

const Notification: React.FC<NotificationProps> = ({ message }) => (
  <div className="bg-ualert-500 text-white p-4 rounded-md shadow-lg transition-opacity duration-200">{message}</div>
);

export default Notification;
