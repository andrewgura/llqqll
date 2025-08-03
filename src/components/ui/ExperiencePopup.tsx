// src/components/ui/ExperiencePopup.tsx
import React, { useState, useEffect } from "react";
import { useEventBus } from "../../hooks/useEventBus";
import { ExperiencePopup as ExperiencePopupType } from "../../services/ExperienceSystem";

interface ActivePopup extends ExperiencePopupType {
  animationStarted: boolean;
}

const ExperiencePopups: React.FC = () => {
  const [popups, setPopups] = useState<ActivePopup[]>([]);

  // Listen for popup show events
  useEventBus("experience.popup.show", (popup: ExperiencePopupType) => {
    if (popup) {
      setPopups((prev) => [...prev, { ...popup, animationStarted: false }]);
    }
  });

  // Listen for popup hide events
  useEventBus("experience.popup.hide", (popup: ExperiencePopupType) => {
    if (popup) {
      setPopups((prev) => prev.filter((p) => p.id !== popup.id));
    }
  });

  // Start animations and auto-cleanup
  useEffect(() => {
    popups.forEach((popup) => {
      if (!popup.animationStarted) {
        // Mark animation as started
        setPopups((prev) =>
          prev.map((p) => (p.id === popup.id ? { ...p, animationStarted: true } : p))
        );

        // Auto-remove after animation duration
        setTimeout(() => {
          setPopups((prev) => prev.filter((p) => p.id !== popup.id));
        }, 2500);
      }
    });
  }, [popups]);

  return (
    <div className="experience-popups-container">
      {popups.map((popup) => (
        <ExperiencePopupItem key={popup.id} popup={popup} />
      ))}
    </div>
  );
};

interface ExperiencePopupItemProps {
  popup: ActivePopup;
}

const ExperiencePopupItem: React.FC<ExperiencePopupItemProps> = ({ popup }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(fadeTimer);
  }, []);

  return (
    <div
      className={`experience-popup ${isVisible ? "visible" : "fading"}`}
      style={{
        left: popup.x,
        top: popup.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <span className="exp-amount">+{popup.amount} XP</span>
    </div>
  );
};

export default ExperiencePopups;
