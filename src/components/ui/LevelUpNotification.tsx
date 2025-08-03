import React, { useState, useEffect } from "react";
import { useEventBus } from "../../hooks/useEventBus";

interface LevelUpData {
  oldLevel: number;
  newLevel: number;
  experience: number;
}

const LevelUpNotification: React.FC = () => {
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Listen for level up events
  useEventBus("player.levelup", (data: LevelUpData) => {
    setLevelUpData(data);
    setIsVisible(true);

    // Hide the notification after 3 seconds (shorter duration)
    setTimeout(() => {
      setIsVisible(false);
      // Clear the data after fade out animation completes
      setTimeout(() => {
        setLevelUpData(null);
      }, 300);
    }, 3000);
  });

  if (!levelUpData) return null;

  return (
    <>
      <div
        className={`level-up-notification ${isVisible ? "visible" : "hidden"}`}
        style={{
          position: "fixed",
          top: "120px",
          left: "45%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div className="level-up-content">
          <div className="level-up-title">LEVEL UP!</div>
          <div className="level-up-message">You advanced to level {levelUpData.newLevel}</div>
        </div>
      </div>

      <style>{`
        .level-up-notification {
          transition: all 0.5s ease-in-out;
        }

        .level-up-notification.visible {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .level-up-notification.hidden {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }

        .level-up-content {
          background: linear-gradient(135deg, 
            rgba(76, 175, 80, 0.9) 0%, 
            rgba(56, 142, 60, 0.85) 50%, 
            rgba(46, 125, 50, 0.9) 100%);
          border: 2px solid rgba(76, 175, 80, 0.8);
          border-radius: 8px;
          padding: 16px 24px;
          text-align: center;
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(76, 175, 80, 0.2);
          position: relative;
          animation: subtleLevelUpPulse 3s ease-in-out;
        }

        .level-up-title {
          font-family: "Georgia", serif;
          font-size: 20px;
          font-weight: bold;
          color: #ffffff;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
          letter-spacing: 1px;
          margin-bottom: 6px;
          animation: subtleLevelUpTitle 3s ease-in-out;
        }

        .level-up-message {
          font-family: "Georgia", serif;
          font-size: 14px;
          font-weight: normal;
          color: #f1f8e9;
          text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
          animation: subtleLevelUpMessage 3s ease-in-out 0.2s both;
        }

        @keyframes subtleLevelUpPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 
              0 4px 12px rgba(0, 0, 0, 0.3),
              0 0 20px rgba(76, 175, 80, 0.2);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 
              0 6px 16px rgba(0, 0, 0, 0.4),
              0 0 25px rgba(76, 175, 80, 0.3);
          }
        }

        @keyframes subtleLevelUpTitle {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          30% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes subtleLevelUpMessage {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          40% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default LevelUpNotification;
