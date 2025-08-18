import React, { useState, useEffect, useMemo } from "react";
import { useEventBus, useEmitEvent } from "../../hooks/useEventBus";
import { MonsterDictionary } from "../../services/MonsterDictionaryService";
import { MonsterData } from "@/types";
import { useGameStore } from "@/stores/gameStore";

interface ProgressMilestone {
  kills: number;
  reward: string;
  achieved: boolean;
}

const CreatureNavigationItem: React.FC<{
  creature: MonsterData;
  killCount: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ creature, killCount, isSelected, onClick }) => {
  return (
    <div className={`creature-nav-item ${isSelected ? "selected" : ""}`} onClick={onClick}>
      <div className="creature-nav-image">
        <img
          src={`assets/outfit-preview/${creature.id}-preview.png`}
          alt={creature.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "assets/outfit-preview/placeholder.png";
          }}
        />
      </div>
      <div className="creature-nav-info">
        <div className="creature-nav-name">{creature.name}</div>
        <div className="creature-nav-category">{creature.category}</div>
      </div>
    </div>
  );
};

const LootTable: React.FC<{ creature: MonsterData }> = ({ creature }) => {
  const lootRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < creature.drops.length; i += 4) {
      rows.push(creature.drops.slice(i, i + 4));
    }
    return rows;
  }, [creature.drops]);

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
                    src={`assets/items/${drop.itemId}.png`}
                    alt={drop.itemId}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "assets/items/placeholder.png";
                    }}
                  />
                </div>
                <div className="loot-item-info">
                  <span className="loot-name">{drop.itemId}</span>
                  <span className="loot-chance">{Math.round(drop.chance * 100)}%</span>
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
  const milestones: ProgressMilestone[] = useMemo(() => {
    return [
      { kills: 250, reward: "1% Bonus Damage", achieved: killCount >= 250 },
      { kills: 500, reward: "1% Damage Reduction", achieved: killCount >= 500 },
      { kills: 1000, reward: "2% Bonus Damage & Reduction", achieved: killCount >= 1000 },
      { kills: 1250, reward: "1% Better Loot Chance", achieved: killCount >= 1250 },
    ];
  }, [killCount]);

  const maxKills = 1250;
  const progressPercentage = Math.min(100, (killCount / maxKills) * 100);

  return (
    <div className="creature-progress-section">
      <h4>Kill Progress</h4>
      <div className="progress-bar-container">
        <div className="progress-bar-background">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercentage}%`,
              minWidth: progressPercentage > 0 ? "4px" : "0px",
            }}
          />
          {milestones.map((milestone, index) => {
            const position = (milestone.kills / maxKills) * 100;
            const isLastMilestone = index === milestones.length - 1;
            const finalPosition = isLastMilestone ? 98 : position;

            return (
              <div
                key={index}
                className={`progress-milestone ${milestone.achieved ? "achieved" : ""} ${isLastMilestone ? "final-milestone" : ""}`}
                style={{ left: `${finalPosition}%` }}
                title={`${milestone.kills} kills: ${milestone.reward}`}
              >
                {milestone.achieved ? "✓" : "○"}
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
          <div key={index} className={`milestone-item ${milestone.achieved ? "achieved" : ""}`}>
            <span className="milestone-icon">{milestone.achieved ? "✓" : "○"}</span>
            <span className="milestone-kills">{milestone.kills}</span>
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
          <img
            src={`assets/outfit-preview/${creature.id}-preview.png`}
            alt={creature.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "assets/outfit-preview/placeholder.png";
            }}
          />
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

  const { getCreatureKillCount, getKilledCreaturesList } = useGameStore();

  // Get creatures that have been killed at least once
  const availableCreatures = useMemo(() => {
    const killedCreatures = getKilledCreaturesList();
    return killedCreatures
      .map((killedCreature) => MonsterDictionary.getMonster(killedCreature.monsterId))
      .filter((monster): monster is MonsterData => monster !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [getKilledCreaturesList]);

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
