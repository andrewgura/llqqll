import React, { useState, useEffect } from "react";
import { questService, QuestDefinition } from "../../services/QuestService";
import { useGameStore } from "../../stores/gameStore";
import { Quest } from "../../types";
import { ItemDictionary } from "../../services/ItemDictionaryService";

interface QuestGiverDialogProps {
  npcId: string;
  npcName: string;
  availableQuests: string[];
  visible: boolean;
  onClose: () => void;
}

interface QuestStatus {
  id: string;
  status: "available" | "in-progress" | "ready-to-turn-in" | "completed";
  quest?: Quest;
  definition: QuestDefinition;
}

const QuestGiverDialog: React.FC<QuestGiverDialogProps> = ({
  npcId,
  npcName,
  availableQuests,
  visible,
  onClose,
}) => {
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "details">("list");

  // Get quest-related actions from store
  const { acceptQuest, turnInQuest, quests } = useGameStore((state) => ({
    acceptQuest: state.acceptQuest,
    turnInQuest: state.turnInQuest,
    quests: state.quests,
  }));

  const activeQuests = quests.active;
  const completedQuests = quests.completed;

  // Reset view mode when dialog opens
  useEffect(() => {
    if (visible) {
      setViewMode("list");
      setSelectedQuest(null);
    }
  }, [visible]);

  // Determine quest statuses
  const questStatuses: QuestStatus[] = availableQuests
    .map((questId) => {
      const definition = questService.getQuestDefinition(questId);
      if (!definition) return null;

      const activeQuest = activeQuests.find((q) => q.id === questId);
      const completedQuest = completedQuests.find((q) => q.id === questId);

      let status: QuestStatus["status"] = "available";

      if (activeQuest) {
        if (activeQuest.readyToTurnIn) {
          status = "ready-to-turn-in";
        } else {
          status = "in-progress";
        }
      } else if (completedQuest && !definition.isRepeatable) {
        status = "completed";
      }

      return {
        id: questId,
        status,
        quest: activeQuest,
        definition,
      };
    })
    .filter(Boolean) as QuestStatus[];

  const selectedQuestStatus = selectedQuest
    ? questStatuses.find((qs) => qs.id === selectedQuest)
    : null;

  const handleQuestSelect = (questId: string) => {
    setSelectedQuest(questId);
    setViewMode("details");
  };

  const handleAcceptQuest = () => {
    if (selectedQuest && selectedQuestStatus?.status === "available") {
      acceptQuest(selectedQuest);
      onClose();
    }
  };

  const handleTurnInQuest = () => {
    if (selectedQuest && selectedQuestStatus?.status === "ready-to-turn-in") {
      turnInQuest(selectedQuest);
      onClose();
    }
  };

  const handleBackToList = () => {
    setSelectedQuest(null);
    setViewMode("list");
  };

  const getQuestStatusText = (status: QuestStatus["status"]) => {
    switch (status) {
      case "available":
        return "Available";
      case "in-progress":
        return "In Progress";
      case "ready-to-turn-in":
        return "Ready to Turn In";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const getQuestStatusColor = (status: QuestStatus["status"]) => {
    switch (status) {
      case "available":
        return "#ffd280";
      case "in-progress":
        return "#6ab5ff";
      case "ready-to-turn-in":
        return "#2ecc71";
      case "completed":
        return "#95a5a6";
      default:
        return "#ffffff";
    }
  };

  const getItemImage = (itemName: string): string => {
    const item = ItemDictionary.getItem(itemName);
    if (!item?.texture) return "";

    const folder = ItemDictionary.getItemFolder(item);
    return `assets/equipment/${folder}/${item.texture}.png`;
  };

  const getItemDisplayName = (itemName: string): string => {
    const item = ItemDictionary.getItem(itemName);
    return item?.name || itemName;
  };

  const calculateQuestProgress = (
    quest: Quest
  ): { current: number; total: number; percentage: number } => {
    let totalCurrent = 0;
    let totalRequired = 0;

    quest.objectives.forEach((objective) => {
      totalCurrent += objective.current;
      totalRequired += objective.amount;
    });

    const percentage = totalRequired > 0 ? Math.round((totalCurrent / totalRequired) * 100) : 0;

    return { current: totalCurrent, total: totalRequired, percentage };
  };

  if (!visible) return null;

  return (
    <div className="quest-giver-dialog-overlay" onClick={onClose}>
      <div className="quest-giver-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="quest-giver-header">
          <h3>{npcName}</h3>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {viewMode === "list" && (
          <div className="quest-list">
            <p>I have some tasks that need doing. Can you help?</p>
            <div className="quest-options">
              {questStatuses.map((questStatus) => (
                <div
                  key={questStatus.id}
                  className={`quest-option ${questStatus.status}`}
                  onClick={() => handleQuestSelect(questStatus.id)}
                >
                  <div className="quest-option-header">
                    <span className="quest-title">{questStatus.definition.title}</span>
                    <span
                      className="quest-status"
                      style={{ color: getQuestStatusColor(questStatus.status) }}
                    >
                      {getQuestStatusText(questStatus.status)}
                    </span>
                  </div>
                  <div className="quest-description-preview">
                    {questStatus.definition.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === "details" && selectedQuestStatus && (
          <div className="quest-details">
            <div className="quest-details-header">
              <button className="back-button" onClick={handleBackToList}>
                ← Back
              </button>
              <span
                className="quest-status-badge"
                style={{ color: getQuestStatusColor(selectedQuestStatus.status) }}
              >
                {getQuestStatusText(selectedQuestStatus.status)}
              </span>
            </div>

            <div className="quest-content">
              <h4>{selectedQuestStatus.definition.title}</h4>
              <p className="quest-description">{selectedQuestStatus.definition.description}</p>

              {/* Objectives */}
              <div className="quest-objectives">
                <h5>Objectives:</h5>
                {selectedQuestStatus.definition.objectives.map((objective, index) => {
                  const activeObjective = selectedQuestStatus.quest?.objectives[index];
                  const isCompleted = activeObjective?.completed || false;
                  const current = activeObjective?.current || 0;

                  return (
                    <div
                      key={objective.id}
                      className={`objective ${isCompleted ? "completed" : ""}`}
                    >
                      <span className="objective-status">{isCompleted ? "✓" : "○"}</span>
                      <span className="objective-text">
                        {objective.description}
                        {selectedQuestStatus.status !== "available" && (
                          <span className="objective-progress">
                            {" "}
                            ({current}/{objective.amount})
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar for In-Progress Quests */}
              {selectedQuestStatus.status === "in-progress" && selectedQuestStatus.quest && (
                <div className="quest-progress">
                  <div className="quest-progress-text">
                    {(() => {
                      const progress = calculateQuestProgress(selectedQuestStatus.quest);
                      return `Progress: ${progress.current}/${progress.total} (${progress.percentage}%)`;
                    })()}
                  </div>
                  <div className="quest-progress-bar-container">
                    <div
                      className="quest-progress-bar-fill"
                      style={{
                        width: `${calculateQuestProgress(selectedQuestStatus.quest).percentage}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Rewards Section */}
              <div className="quest-rewards">
                <h5>Rewards:</h5>
                <div className="rewards-list">
                  {selectedQuestStatus.definition.rewards.map((reward, index) => {
                    // Handle special reward types
                    if (reward.name === "goldCoins") {
                      return (
                        <div key={index} className="reward-item">
                          <div className="reward-image">
                            <img src="assets/equipment/valuables/gold-coins.png" alt="Gold Coins" />
                          </div>
                          <div className="reward-info">
                            <span className="reward-name">Gold Coins</span>
                            {reward.amount && (
                              <span className="reward-amount">x{reward.amount}</span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    if (reward.name === "questPoints") {
                      return (
                        <div key={index} className="reward-item">
                          <div className="reward-image quest-points">
                            <span className="quest-points-icon">★</span>
                          </div>
                          <div className="reward-info">
                            <span className="reward-name">Quest Points</span>
                            {reward.amount && (
                              <span className="reward-amount">x{reward.amount}</span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Handle item rewards
                    const itemImage = getItemImage(reward.name);
                    const itemName = getItemDisplayName(reward.name);

                    return (
                      <div key={index} className="reward-item">
                        <div className="reward-image">
                          {itemImage ? (
                            <img src={itemImage} alt={itemName} />
                          ) : (
                            <div className="placeholder-image">?</div>
                          )}
                        </div>
                        <div className="reward-info">
                          <span className="reward-name">{itemName}</span>
                          {reward.amount && <span className="reward-amount">x{reward.amount}</span>}
                          {reward.isFirstTimeOnly && (
                            <span className="reward-note">(First time only)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="quest-actions">
              {selectedQuestStatus.status === "available" && (
                <button className="accept-button" onClick={handleAcceptQuest}>
                  Accept Quest
                </button>
              )}

              {selectedQuestStatus.status === "in-progress" && (
                <button className="in-progress-button" disabled>
                  Quest In Progress
                </button>
              )}

              {selectedQuestStatus.status === "ready-to-turn-in" && (
                <button className="turn-in-button" onClick={handleTurnInQuest}>
                  Turn In Quest
                </button>
              )}

              {selectedQuestStatus.status === "completed" &&
                !selectedQuestStatus.definition.isRepeatable && (
                  <button className="completed-button" disabled>
                    Quest Completed
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestGiverDialog;
