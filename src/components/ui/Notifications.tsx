import React, { useState, useEffect } from "react";
import { useEventBus } from "../../hooks/useEventBus";

interface LevelUpData {
  oldLevel: number;
  newLevel: number;
  experience: number;
}

interface SkillUpdatedData {
  skillId: string;
  level: number;
  experience: number;
  maxExperience: number;
  leveledUp: boolean;
}

interface QuestReadyData {
  id: string;
  title: string;
  description: string;
  objectives: any[];
  completed: boolean;
  readyToTurnIn?: boolean;
}

interface QuestTurnedInData {
  quest: any;
  isFirstCompletion: boolean;
  completionCount: number;
}

interface NotificationData {
  type: "levelup" | "skill" | "quest-objective" | "quest-complete";
  title: string;
  message: string;
}

const Notifications: React.FC = () => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = (data: NotificationData) => {
    setNotificationData(data);
    setIsVisible(true);

    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setNotificationData(null);
      }, 300);
    }, 3000);
  };

  useEventBus("player.levelup", (data: LevelUpData) => {
    showNotification({
      type: "levelup",
      title: "LEVEL UP!",
      message: `You advanced to level ${data.newLevel}`,
    });
  });

  useEventBus("playerCharacter.skill.updated", (data: SkillUpdatedData) => {
    if (!data.leveledUp) return;

    const skillNames: Record<string, string> = {
      meleeWeapons: "Melee",
      archery: "Ranged",
      magic: "Magic",
      shield: "Shield",
    };

    const skillName = skillNames[data.skillId];
    if (!skillName) return;

    showNotification({
      type: "skill",
      title: "SKILL ADVANCEMENT!",
      message: `Your ${skillName} skill reached level ${data.level}`,
    });
  });

  useEventBus("quest.ready.to.turn.in", (quest: QuestReadyData) => {
    showNotification({
      type: "quest-objective",
      title: "QUEST OBJECTIVE COMPLETE!",
      message: `${quest.title} is ready to turn in`,
    });
  });

  useEventBus("quest.turned.in", (data: QuestTurnedInData) => {
    showNotification({
      type: "quest-complete",
      title: "QUEST COMPLETE!",
      message: `Completed: ${data.quest.title}`,
    });
  });

  if (!notificationData) return null;

  return (
    <>
      <div
        className={`notification ${isVisible ? "visible" : "hidden"}`}
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
        <div className={`notification-content ${notificationData.type}`}>
          <div className="notification-title">{notificationData.title}</div>
          <div className="notification-message">{notificationData.message}</div>
        </div>
      </div>

      <style>{`
        .notification {
          transition: all 0.5s ease-in-out;
        }

        .notification.visible {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .notification.hidden {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }

        .notification-content {
          border-radius: 8px;
          padding: 16px 24px;
          text-align: center;
          position: relative;
          animation: subtleNotificationPulse 3s ease-in-out;
        }

        .notification-content.levelup {
          background: linear-gradient(135deg, 
            rgba(76, 175, 80, 0.9) 0%, 
            rgba(56, 142, 60, 0.85) 50%, 
            rgba(46, 125, 50, 0.9) 100%);
          border: 2px solid rgba(76, 175, 80, 0.8);
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(76, 175, 80, 0.2);
        }

        .notification-content.skill {
          background: linear-gradient(135deg, 
            rgba(103, 58, 183, 0.9) 0%, 
            rgba(81, 45, 168, 0.85) 50%, 
            rgba(69, 39, 160, 0.9) 100%);
          border: 2px solid rgba(103, 58, 183, 0.8);
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(103, 58, 183, 0.2);
        }

        .notification-content.quest-objective {
          background: linear-gradient(135deg, 
            rgba(255, 152, 0, 0.9) 0%, 
            rgba(245, 124, 0, 0.85) 50%, 
            rgba(230, 108, 0, 0.9) 100%);
          border: 2px solid rgba(255, 152, 0, 0.8);
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(255, 152, 0, 0.2);
        }

        .notification-content.quest-complete {
          background: linear-gradient(135deg, 
            rgba(255, 193, 7, 0.9) 0%, 
            rgba(255, 179, 0, 0.85) 50%, 
            rgba(255, 160, 0, 0.9) 100%);
          border: 2px solid rgba(255, 193, 7, 0.8);
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(255, 193, 7, 0.2);
        }

        .notification-title {
          font-family: "Georgia", serif;
          font-size: 20px;
          font-weight: bold;
          color: #ffffff;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
          letter-spacing: 1px;
          margin-bottom: 6px;
          animation: subtleNotificationTitle 3s ease-in-out;
        }

        .notification-message {
          font-family: "Georgia", serif;
          font-size: 14px;
          font-weight: normal;
          color: #f1f8e9;
          text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
          animation: subtleNotificationMessage 3s ease-in-out 0.2s both;
        }

        @keyframes subtleNotificationPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        @keyframes subtleNotificationTitle {
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

        @keyframes subtleNotificationMessage {
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

export default Notifications;
