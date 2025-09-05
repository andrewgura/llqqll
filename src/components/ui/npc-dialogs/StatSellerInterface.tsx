import React, { useState, useEffect } from "react";
import { useGameStore } from "../../../stores/gameStore";
import { useEventBus, useEmitEvent } from "../../../hooks/useEventBus";
import { StatBuyingService } from "../../../services/StatBuyingService";
import { PurchasedStats } from "@/types";

interface StatBuyRowProps {
  statName: string;
  statId: keyof PurchasedStats;
  currentValue: number;
  goldCost: number;
  expCost: number;
  onBuy: (statId: keyof PurchasedStats, goldCost: number, expCost: number) => void;
  canAfford: boolean;
}

const StatBuyRow: React.FC<StatBuyRowProps> = ({
  statName,
  statId,
  currentValue,
  goldCost,
  expCost,
  onBuy,
  canAfford,
}) => {
  const getStatIcon = (statId: string) => {
    switch (statId) {
      case "hpRegen":
        return "💗";
      case "mpRegen":
        return "💙";
      case "attackSpeed":
        return "⚡";
      case "moveSpeed":
        return "👟";
      default:
        return "📊";
    }
  };

  return (
    <div className="stat-buy-row">
      <div className="stat-icon">{getStatIcon(statId)}</div>
      <div className="stat-details">
        <div className="stat-name">{statName}</div>
        <div className="stat-current">Current: +{currentValue}</div>
        <div className="stat-cost">
          <span className="gold-cost">{goldCost} gold</span>
          <span className="exp-cost">{expCost} exp</span>
        </div>
      </div>
      <button
        className={`buy-stat-button ${!canAfford ? "disabled" : ""}`}
        onClick={() => canAfford && onBuy(statId, goldCost, expCost)}
        disabled={!canAfford}
      >
        Buy +1
      </button>
    </div>
  );
};

const StatSellerInterface: React.FC = () => {
  const {
    playerCharacter,
    updatePlayerGold,
    updatePlayerExperience,
    updatePurchasedStats,
    getStatPurchaseCount,
  } = useGameStore();

  const [visible, setVisible] = useState(false);
  const [npcName, setNpcName] = useState("");
  const emitEvent = useEmitEvent();

  useEventBus("stat-seller.open", (data: { npcId: string; npcName: string }) => {
    setNpcName(data.npcName);
    setVisible(true);
    emitEvent("input.focused", true);
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  const handleClose = () => {
    setVisible(false);
    emitEvent("input.focused", false);
  };

  const calculateStatCost = (statId: keyof PurchasedStats) => {
    const purchaseCount = getStatPurchaseCount(statId);
    return StatBuyingService.calculateProgressiveCost(statId, purchaseCount);
  };

  const handleBuyStat = (statId: keyof PurchasedStats, goldCost: number, expCost: number) => {
    if (playerCharacter.gold < goldCost) {
      emitEvent("ui.message.show", "You don't have enough gold!");
      return;
    }
    if (playerCharacter.experience < expCost) {
      emitEvent("ui.message.show", "You don't have enough experience!");
      return;
    }

    updatePlayerGold(playerCharacter.gold - goldCost);
    updatePlayerExperience(playerCharacter.experience - expCost);
    updatePurchasedStats(statId, 1);

    const statNames = {
      hpRegen: "HP Regeneration",
      mpRegen: "MP Regeneration",
      attackSpeed: "Attack Speed",
      moveSpeed: "Movement Speed",
    };
    emitEvent("ui.message.show", `Purchased +1 ${statNames[statId]}!`);
  };

  const canAfford = (goldCost: number, expCost: number): boolean => {
    return playerCharacter.gold >= goldCost && playerCharacter.experience >= expCost;
  };

  if (!visible) return null;

  const stats = [
    { name: "HP Regeneration", id: "hpRegen" as const },
    { name: "MP Regeneration", id: "mpRegen" as const },
    { name: "Attack Speed", id: "attackSpeed" as const },
    { name: "Movement Speed", id: "moveSpeed" as const },
  ];

  return (
    <div className="stat-seller-container">
      <div className="stat-seller-header">
        <h2>{npcName}'s Stat Training</h2>
        <div className="player-resources">
          <div>Gold: {playerCharacter.gold}</div>
          <div>Experience: {playerCharacter.experience}</div>
        </div>
        <button className="stat-seller-close-button" onClick={handleClose}>
          ✕
        </button>
      </div>
      <div className="stat-seller-content">
        <div className="stat-seller-info">
          <p>Improve your secondary stats permanently using Gold and Experience.</p>
          <p>
            <strong>Warning:</strong> Spending experience may cause you to lose levels!
          </p>
        </div>
        <div className="stats-container">
          {stats.map((stat) => {
            const costs = calculateStatCost(stat.id);
            const currentValue = playerCharacter.purchasedStats?.[stat.id] || 0;

            return (
              <StatBuyRow
                key={stat.id}
                statName={stat.name}
                statId={stat.id}
                currentValue={currentValue}
                goldCost={costs.gold}
                expCost={costs.exp}
                onBuy={handleBuyStat}
                canAfford={canAfford(costs.gold, costs.exp)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatSellerInterface;
