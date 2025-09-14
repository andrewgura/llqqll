// src/components/ui/HealingPopup.tsx
import React, { useState, useEffect } from "react";
import { useEventBus } from "../../hooks/useEventBus";

interface HealingEvent {
  id: string;
  amount: number;
  x: number;
  y: number;
  timestamp: number;
  source?: string;
  spellId?: string;
}

const HealingPopup: React.FC = () => {
  const [healingEvents, setHealingEvents] = useState<HealingEvent[]>([]);

  // Listen for healing events
  useEventBus("healing.dealt", (data) => {
    if (data && data.amount) {
      // Create a new healing event
      const healingEvent: HealingEvent = {
        id: `healing_${Date.now()}_${Math.random()}`,
        amount: data.amount,
        x: window.innerWidth / 2, // Center of screen for player healing
        y: window.innerHeight / 2 - 50, // Slightly above center
        timestamp: Date.now(),
        source: data.source,
        spellId: data.spellId,
      };

      setHealingEvents((prev) => [...prev, healingEvent]);

      // Remove the healing event after animation completes
      setTimeout(() => {
        setHealingEvents((prev) => prev.filter((event) => event.id !== healingEvent.id));
      }, 2000); // Remove after 2 seconds
    }
  });

  // Clean up old healing events periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setHealingEvents((prev) => prev.filter((event) => now - event.timestamp < 2000));
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="healing-popup-container">
      {healingEvents.map((event) => (
        <HealingNumber
          key={event.id}
          amount={event.amount}
          x={event.x}
          y={event.y}
          timestamp={event.timestamp}
          source={event.source}
        />
      ))}
    </div>
  );
};

interface HealingNumberProps {
  amount: number;
  x: number;
  y: number;
  timestamp: number;
  source?: string;
}

const HealingNumber: React.FC<HealingNumberProps> = ({ amount, x, y, timestamp, source }) => {
  const [position, setPosition] = useState({ x, y });
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Animate the healing number
    const animationDuration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Move up and slightly to the side
      setPosition({
        x: x + (Math.random() - 0.5) * 50 * progress,
        y: y - 80 * progress,
      });

      // Scale animation: start big, then shrink
      const scaleValue = 1 + 0.5 * Math.sin(progress * Math.PI);
      setScale(scaleValue);

      // Fade out
      setOpacity(1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [x, y]);

  const getHealingColor = (amount: number): string => {
    // Different shades of green based on healing amount
    if (amount >= 50) return "#00ff00"; // Bright green for large heals
    if (amount >= 20) return "#32cd32"; // Lime green for medium heals
    return "#90ee90"; // Light green for small heals
  };

  const getSourceIcon = (source?: string): string => {
    if (source === "spell") return "✨";
    if (source === "potion") return "🧪";
    if (source === "ability") return "⚡";
    return "💚"; // Default healing heart
  };

  return (
    <div
      className="healing-number"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        color: getHealingColor(amount),
        fontSize: `${16 + amount / 10}px`, // Bigger numbers for larger heals
        fontWeight: "bold",
        fontFamily: "Georgia, serif",
        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
        opacity: opacity,
        transform: `translate(-50%, -50%) scale(${scale})`,
        pointerEvents: "none",
        zIndex: 9999,
        userSelect: "none",
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      {getSourceIcon(source)} +{amount}
    </div>
  );
};

export default HealingPopup;
