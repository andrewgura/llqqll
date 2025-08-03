import React, { useState, useEffect } from "react";
import { useEventBus } from "../../hooks/useEventBus";

interface ExperiencePopup {
  id: string;
  x: number;
  y: number;
  experience: number;
  timestamp: number;
}

const ExperiencePopups: React.FC = () => {
  const [popups, setPopups] = useState<ExperiencePopup[]>([]);

  // Listen for monster death events
  useEventBus(
    "monster.died",
    (data: {
      id: string;
      type: string;
      name: string;
      x: number;
      y: number;
      experience: number;
    }) => {
      // Create new popup
      const newPopup: ExperiencePopup = {
        id: `exp-${data.id}-${Date.now()}`,
        x: data.x,
        y: data.y,
        experience: data.experience,
        timestamp: Date.now(),
      };

      setPopups((prev) => [...prev, newPopup]);

      // Remove popup after animation completes
      setTimeout(() => {
        setPopups((prev) => prev.filter((popup) => popup.id !== newPopup.id));
      }, 3000);
    }
  );

  // Convert world coordinates to screen coordinates
  const worldToScreen = (worldX: number, worldY: number) => {
    // Get the game canvas element
    const canvas = document.querySelector("canvas");
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    // Approximate screen position based on world coordinates
    // This is a simplified conversion - you may need to adjust based on your camera/viewport system
    const screenX = rect.left + (worldX / 32) * 2; // Assuming 32px tiles
    const screenY = rect.top + (worldY / 32) * 2;

    return { x: screenX, y: screenY };
  };

  return (
    <>
      <div style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 1000 }}>
        {popups.map((popup) => {
          const screenPos = worldToScreen(popup.x, popup.y);

          return (
            <div
              key={popup.id}
              className="experience-popup"
              style={{
                position: "absolute",
                left: `${screenPos.x}px`,
                top: `${screenPos.y}px`,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              <div className="exp-text">+{popup.experience}</div>
              <div className="exp-label">XP</div>
            </div>
          );
        })}
      </div>

      <style>{`
        .experience-popup {
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: enhancedExpPopup 3s ease-out forwards;
          font-family: "Georgia", serif;
          font-weight: bold;
        }

        .exp-text {
          font-size: 20px;
          color: #00ff88;
          margin-bottom: -2px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .exp-label {
          font-size: 12px;
          color: #88ffaa;
          font-weight: bold;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        @keyframes enhancedExpPopup {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.8);
          }
          15% {
            opacity: 1;
            transform: translateY(-10px) scale(1.2);
          }
          30% {
            opacity: 1;
            transform: translateY(-25px) scale(1.1);
          }
          60% {
            opacity: 1;
            transform: translateY(-40px) scale(1.0);
          }
          100% {
            opacity: 0;
            transform: translateY(-70px) scale(0.9);
          }
        }

        /* Add a subtle pulsing glow effect */
        .experience-popup::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(0, 255, 136, 0.2) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          border-radius: 50%;
          animation: expGlow 3s ease-out forwards;
          z-index: -1;
        }

        @keyframes expGlow {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.0);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default ExperiencePopups;
