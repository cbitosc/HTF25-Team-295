import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";

export default function Notification({ type = "info", message, duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="text-green-400" size={20} />;
      case "error":
        return <FiXCircle className="text-red-400" size={20} />;
      case "warning":
        return <FiAlertTriangle className="text-yellow-400" size={20} />;
      default:
        return <FiInfo className="text-blue-400" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-900 border-green-700";
      case "error":
        return "bg-red-900 border-red-700";
      case "warning":
        return "bg-yellow-900 border-yellow-700";
      default:
        return "bg-blue-900 border-blue-700";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`${getBgColor()} border rounded-lg p-4 shadow-lg max-w-sm`}
      >
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiXCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
