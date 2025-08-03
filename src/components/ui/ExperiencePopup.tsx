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
      }, 2000);
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
    <div style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 1000 }}>
      {popups.map((popup) => {
        const screenPos = worldToScreen(popup.x, popup.y);

        return (
          <div
            key={popup.id}
            style={{
              position: "absolute",
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
              color: "#00ff00",
              fontSize: "16px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
              animation: "experiencePopup 2s ease-out forwards",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            +{popup.experience} XP
          </div>
        );
      })}
      <style>{`
        @keyframes experiencePopup {
          0% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateY(-30px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ExperiencePopups;
