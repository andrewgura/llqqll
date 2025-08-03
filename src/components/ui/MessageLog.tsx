import React, { useState, useEffect, useRef } from "react";
import { useEventBus } from "../../hooks/useEventBus";

interface Message {
  id: string;
  text: string;
  timestamp: number;
  category: "combat" | "event" | "chat";
}

type TabType = "combat" | "event" | "chat";

const MessageLog: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("combat");
  const [isExpanded, setIsExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_MESSAGES_PER_TAB = 50;
  const MESSAGE_FADE_DURATION = 300000; // 5 minutes

  // Event listeners for combat messages
  useEventBus(
    "combat.damage.dealt",
    (data: { damage: number; target: string; attackType: "auto-attack" | string }) => {
      const attackTypeText = data.attackType === "auto-attack" ? "auto-attack" : data.attackType;
      addMessage(
        `You dealt ${data.damage} damage to ${data.target} with ${attackTypeText}.`,
        "combat"
      );
    }
  );

  useEventBus(
    "combat.damage.received",
    (data: { damage: number; source: string; attackType: "auto-attack" | string }) => {
      const attackTypeText = data.attackType === "auto-attack" ? "auto attack" : data.attackType;
      addMessage(
        `${data.source} dealt ${data.damage} damage to you with ${attackTypeText}.`,
        "combat"
      );
    }
  );

  // Event listeners for event messages
  useEventBus("item.picked.up", (data: { itemName: string; quantity?: number }) => {
    const quantityText = data.quantity && data.quantity > 1 ? ` (${data.quantity})` : "";
    addMessage(`You picked up a ${data.itemName}${quantityText}.`, "event");
  });

  useEventBus("player.level.advanced", (data: { fromLevel: number; toLevel: number }) => {
    addMessage(`You advanced from level ${data.fromLevel} to ${data.toLevel}.`, "event");
  });

  useEventBus("skill.level.advanced", (data: { skillName: string; level: number }) => {
    const skillDisplayName = formatSkillName(data.skillName);
    addMessage(`You advanced to ${skillDisplayName} Level ${data.level}.`, "event");
  });

  useEventBus("experience.gained", (data: { amount: number; source?: string }) => {
    const sourceText = data.source ? ` from ${data.source}` : "";
    addMessage(`You gained ${data.amount} experience${sourceText}.`, "event");
  });

  // Legacy event listeners for existing system compatibility
  useEventBus("ui.message.show", (text: string) => {
    addMessage(text, "event");
  });

  useEventBus("ui.error.show", (error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error;
    addMessage(`Error: ${errorMessage}`, "event");
  });

  // Chat messages (for future implementation)
  useEventBus("chat.message.received", (data: { message: string; player?: string }) => {
    const chatText = data.player ? `${data.player}: ${data.message}` : data.message;
    addMessage(chatText, "chat");
  });

  const formatSkillName = (skillId: string): string => {
    const skillNameMap: { [key: string]: string } = {
      meleeWeapons: "Melee Weapons",
      archery: "Archery",
      magic: "Magic",
      shield: "Shield",
      playerLevel: "Combat",
      health: "Health",
      mana: "Mana",
      moveSpeed: "Move Speed",
      attackSpeed: "Attack Speed",
      capacity: "Capacity",
    };
    return skillNameMap[skillId] || skillId;
  };

  const generateUniqueId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `msg_${timestamp}_${random}`;
  };

  const addMessage = (text: string, category: TabType) => {
    const messageId = generateUniqueId();
    const newMessage: Message = {
      id: messageId,
      text,
      timestamp: Date.now(),
      category,
    };

    setMessages((prev) => {
      // Add new message
      const updated = [...prev, newMessage];

      // Keep only the latest messages per category to prevent memory bloat
      const categoryMessages = updated.filter((msg) => msg.category === category);
      if (categoryMessages.length > MAX_MESSAGES_PER_TAB) {
        const messagesToRemove = categoryMessages
          .slice(0, categoryMessages.length - MAX_MESSAGES_PER_TAB)
          .map((msg) => msg.id);
        return updated.filter((msg) => !messagesToRemove.includes(msg.id));
      }

      return updated;
    });

    // Set up automatic removal after fade duration
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    }, MESSAGE_FADE_DURATION);
  };

  // Filter messages based on active tab
  const filteredMessages = messages.filter((msg) => msg.category === activeTab);

  // Auto-scroll to newest message when tab content changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredMessages, activeTab]);

  const getTabDisplayName = (tab: TabType): string => {
    const names = {
      combat: "Combat",
      event: "Event",
      chat: "Chat",
    };
    return names[tab];
  };

  const getTabMessageCount = (tab: TabType): number => {
    return messages.filter((msg) => msg.category === tab).length;
  };

  if (!isExpanded) {
    return (
      <div className="message-log-container collapsed">
        <div className="message-log-header">
          <button
            className="expand-button"
            onClick={() => setIsExpanded(true)}
            title="Expand Message Log"
          >
            ▲
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="message-log-container">
      <div className="message-log-header">
        <div className="message-log-tabs">
          {(["combat", "event", "chat"] as TabType[]).map((tab) => (
            <button
              key={tab}
              className={`message-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {getTabDisplayName(tab)}
              {getTabMessageCount(tab) > 0 && (
                <span className="message-count">({getTabMessageCount(tab)})</span>
              )}
            </button>
          ))}
        </div>
        <button
          className="collapse-button"
          onClick={() => setIsExpanded(false)}
          title="Collapse Message Log"
        >
          ▼
        </button>
      </div>

      <div className="message-log-content" ref={containerRef}>
        {filteredMessages.length === 0 ? (
          <div className="no-messages">
            {activeTab === "combat" && "No combat messages yet."}
            {activeTab === "event" && "No events yet."}
            {activeTab === "chat" && "Chat system coming soon..."}
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div key={message.id} className={`message-item ${message.category}`}>
              <span className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="message-text">{message.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessageLog;
