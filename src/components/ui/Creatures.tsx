import React, { useState, useEffect, useMemo } from "react";
import { useEventBus, useEmitEvent } from "../../hooks/useEventBus";
import { MonsterDictionary } from "../../services/MonsterDictionaryService";
import { ItemDictionary } from "../../services/ItemDictionaryService";
import { MonsterData } from "@/types";
import { useGameStore } from "@/stores/gameStore";

interface ProgressMilestone {
  kills: number;
  reward: string;
  achieved: boolean;
}

// Tinted Image Component using blend mode
const TintedImage: React.FC<{
  creature: MonsterData;
  className?: string;
  style?: React.CSSProperties;
}> = ({ creature, className = "", style = {} }) => {
  const tintColor = creature.color ? `#${creature.color.toString(16).padStart(6, "0")}` : "";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <img
        src={creature.preview}
        alt={creature.name}
        style={{
          imageRendering: "pixelated",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "assets/monsters/placeholder.png";
        }}
      />
      {tintColor && tintColor !== "#ffffff" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: tintColor,
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

const CreatureNavigationItem: React.FC<{
  creature: MonsterData;
  killCount: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ creature, killCount, isSelected, onClick }) => {
  return (
    <div className={`creature-nav-item ${isSelected ? "selected" : ""}`} onClick={onClick}>
      <div className="creature-nav-image">
        <TintedImage creature={creature} />
      </div>
      <div className="creature-nav-info">
        <div className="creature-nav-name">{creature.name}</div>
        <div className="creature-nav-category">
          {creature.category} • {killCount} kills
        </div>
      </div>
    </div>
  );
};

const LootTable: React.FC<{ creature: MonsterData }> = ({ creature }) => {
  const drops = creature.drops || [];

  if (drops.length === 0) {
    return (
      <div className="creature-loot-section">
        <h4>Loot Table</h4>
        <p>No known drops</p>
      </div>
    );
  }

  // Group drops into rows of 4
  const lootRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < drops.length; i += 4) {
      rows.push(drops.slice(i, i + 4));
    }
    return rows;
  }, [drops]);

  // Helper function to get item image path
  const getItemImagePath = (itemId: string): string => {
    const item = ItemDictionary.getItem(itemId);
    if (!item?.texture) return "assets/items/placeholder.png";

    const folder = ItemDictionary.getItemFolder(item);
    return `assets/equipment/${folder}/${item.texture}.png`;
  };

  // Helper function to get item name
  const getItemName = (itemId: string): string => {
    const item = ItemDictionary.getItem(itemId);
    return item?.name || itemId;
  };

  return (
    <div className="creature-loot-section">
      <h4>Loot Table</h4>
      <div className="loot-items">
        {lootRows.map((row, rowIndex) => (
          <div key={rowIndex} className="loot-row">
            {row.map((drop, itemIndex) => (
              <div key={itemIndex} className="loot-item">
                <div className="loot-item-image">
                  <img
                    src={getItemImagePath(drop.itemId)}
                    alt={getItemName(drop.itemId)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "assets/items/placeholder.png";
                    }}
                  />
                </div>
                <div className="loot-item-info">
                  <span className="loot-name">{getItemName(drop.itemId)}</span>
                  <span className="loot-chance">{Math.round(drop.chance * 100)}%</span>
                  {drop.minQuantity && drop.maxQuantity && (
                    <span className="loot-quantity">
                      {drop.minQuantity === drop.maxQuantity
                        ? `${drop.minQuantity}`
                        : `${drop.minQuantity}-${drop.maxQuantity}`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ creature: MonsterData; killCount: number }> = ({
  creature,
  killCount,
}) => {
  const maxKills = 1250;
  const progressPercentage = Math.min((killCount / maxKills) * 100, 100);

  const milestones = [
    { killCount: 250, reward: "+1% Bonus Damage", completed: killCount >= 250 },
    { killCount: 500, reward: "+1% Damage Reduction", completed: killCount >= 500 },
    { killCount: 1000, reward: "+2% Bonus Damage & Reduction", completed: killCount >= 1000 },
    { killCount: 1250, reward: "+1% Better Loot Chance", completed: killCount >= 1250 },
  ];

  return (
    <div className="creature-progress-section">
      <h4>Kill Progress</h4>
      <div className="progress-bar-container">
        <div className="progress-bar-background">
          <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
          {milestones.map((milestone, index) => {
            const position = (milestone.killCount / maxKills) * 100;
            return (
              <div
                key={index}
                className={`progress-milestone ${milestone.completed ? "achieved" : ""}`}
                style={{ left: `${position}%` }}
              >
                {milestone.completed ? "✓" : "○"}
              </div>
            );
          })}
        </div>
      </div>
      <div className="progress-text">
        {killCount} / {maxKills} kills ({Math.round(progressPercentage)}%)
      </div>
      <div className="milestones-list">
        {milestones.map((milestone, index) => (
          <div key={index} className={`milestone-item ${milestone.completed ? "achieved" : ""}`}>
            <span className="milestone-icon">{milestone.completed ? "✓" : "○"}</span>
            <span className="milestone-kills">{milestone.killCount}</span>
            <span className="milestone-reward">{milestone.reward}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreatureDetails: React.FC<{ creature: MonsterData; killCount: number }> = ({
  creature,
  killCount,
}) => {
  return (
    <div className="creature-details">
      <div className="creature-header">
        <div className="creature-image-large">
          <TintedImage creature={creature} />
        </div>
        <div className="creature-basic-info">
          <h2 className="creature-name">{creature.name}</h2>
          <div className="creature-category">{creature.category}</div>
          <div className="creature-stats">
            <div className="stat-row">
              <span className="stat-label">Health:</span>
              <span className="stat-value">{creature.health}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Damage:</span>
              <span className="stat-value">{creature.damage}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Armor:</span>
              <span className="stat-value">{creature.armor}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Speed:</span>
              <span className="stat-value">{creature.speed}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Experience:</span>
              <span className="stat-value">{creature.experience}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Times Killed:</span>
              <span className="stat-value">{killCount}</span>
            </div>
          </div>
        </div>
      </div>

      <LootTable creature={creature} />
      <ProgressBar creature={creature} killCount={killCount} />
    </div>
  );
};

const Creatures: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState<string>("");
  const emitEvent = useEmitEvent();

  // Subscribe to the actual store state
  const killedCreatures = useGameStore((state) => state.killedCreatures);
  const { getCreatureKillCount } = useGameStore();

  // Get creatures that have been killed at least once
  const availableCreatures = useMemo(() => {
    const killedCreaturesList = Object.values(killedCreatures).filter(
      (creature) => creature.timesKilled > 0
    );
    return killedCreaturesList
      .map((killedCreature) => MonsterDictionary.getMonster(killedCreature.monsterId))
      .filter((monster): monster is MonsterData => monster !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [killedCreatures]);

  // Set first available creature as selected when creatures list changes
  useEffect(() => {
    if (availableCreatures.length > 0 && !selectedCreature) {
      setSelectedCreature(availableCreatures[0].id);
    } else if (availableCreatures.length === 0) {
      setSelectedCreature("");
    } else if (selectedCreature && !availableCreatures.find((c) => c.id === selectedCreature)) {
      setSelectedCreature(availableCreatures[0].id);
    }
  }, [availableCreatures, selectedCreature]);

  // Listen for creatures toggle event
  useEventBus("creatures.toggle", (data: { visible: boolean }) => {
    setVisible(data.visible);
  });

  // Handle close
  const handleClose = () => {
    setVisible(false);
    emitEvent("creatures.visibility.changed", false);
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  if (!visible) {
    return null;
  }

  const currentCreature = selectedCreature ? MonsterDictionary.getMonster(selectedCreature) : null;
  const currentKillCount = selectedCreature ? getCreatureKillCount(selectedCreature) : 0;

  return (
    <div className="creatures-container">
      <div className="creatures-header">
        <h2>Creature Compendium</h2>
        <button className="creatures-close-button" onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className="creatures-content">
        <div className="creatures-navigation">
          <h3>Encountered Creatures</h3>
          <div className="creature-nav-list">
            {availableCreatures.length === 0 ? (
              <div className="no-creatures-message">
                <p>No creatures discovered yet.</p>
                <p>Defeat monsters to unlock entries!</p>
              </div>
            ) : (
              availableCreatures.map((creature) => (
                <CreatureNavigationItem
                  key={creature.id}
                  creature={creature}
                  killCount={getCreatureKillCount(creature.id)}
                  isSelected={selectedCreature === creature.id}
                  onClick={() => setSelectedCreature(creature.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="creatures-main">
          {currentCreature ? (
            <CreatureDetails creature={currentCreature} killCount={currentKillCount} />
          ) : (
            <div className="no-creature-selected">
              <p>Select a creature from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Creatures;
