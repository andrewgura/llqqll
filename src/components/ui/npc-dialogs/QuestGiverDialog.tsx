import { ItemDictionary } from "@/services/ItemDictionaryService";
import { QuestDefinition, questService } from "@/services/QuestService";
import { useGameStore } from "@/stores/gameStore";
import { Quest } from "@/types";
import React, { useState, useEffect } from "react";
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
  completionCount: number;
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
  const { acceptQuest, turnInQuest, quests, canRepeatQuest } = useGameStore((state) => ({
    acceptQuest: state.acceptQuest,
    turnInQuest: state.turnInQuest,
    quests: state.quests,
    canRepeatQuest: state.canRepeatQuest,
  }));

  const activeQuests = quests.active;
  const completedQuests = quests.completed;
  const completionHistory = quests.completionHistory || {};

  // Reset view mode when dialog opens
  useEffect(() => {
    if (visible) {
      setViewMode("list");
      setSelectedQuest(null);
    }
  }, [visible]);

  // Determine quest statuses with repeatable logic
  const questStatuses: QuestStatus[] = availableQuests
    .map((questId) => {
      const definition = questService.getQuestDefinition(questId);
      if (!definition) return null;

      const activeQuest = activeQuests.find((q) => q.id === questId);
      const completedQuest = completedQuests.find((q) => q.id === questId);
      const completion = completionHistory[questId];

      let status: QuestStatus["status"] = "available";

      if (activeQuest) {
        if (activeQuest.readyToTurnIn) {
          status = "ready-to-turn-in";
        } else {
          status = "in-progress";
        }
      } else if (completedQuest) {
        if (definition.isRepeatable) {
          // For repeatable quests, show as available if can be repeated
          status = canRepeatQuest && canRepeatQuest(questId) ? "available" : "completed";
        } else {
          status = "completed";
        }
      }

      return {
        id: questId,
        status,
        quest: activeQuest,
        definition,
        completionCount: completion?.completionCount || 0,
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

  const getQuestStatusText = (questStatus: QuestStatus) => {
    const { status, completionCount } = questStatus;

    switch (status) {
      case "available":
        return completionCount > 0 ? "Repeatable" : "Available";
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

  // Helper function to get visible objectives based on completion status
  const getVisibleObjectives = (definition: QuestDefinition, completionCount: number) => {
    if (!definition?.objectives) return [];

    const isFirstTime = completionCount === 0;

    return definition.objectives.filter((objective: any) => {
      if (isFirstTime) {
        // First completion: show objectives that are NOT repeat-only
        return !objective.isRepeatObjective;
      } else {
        // Repeat completion: show objectives that ARE for repeats
        return objective.isRepeatObjective;
      }
    });
  };

  // Helper function to get visible rewards based on completion status
  const getVisibleRewards = (definition: QuestDefinition, completionCount: number) => {
    if (!definition?.rewards) return [];

    const isFirstTime = completionCount === 0;

    return definition.rewards.filter((reward: any) => {
      if (isFirstTime) {
        // First completion: show rewards that are NOT repeatable-only
        return !reward.isRepeatableReward;
      } else {
        // Repeat completion: show rewards that ARE for repeats
        return reward.isRepeatableReward || (!reward.isFirstTimeOnly && !reward.isRepeatableReward);
      }
    });
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
                    <span className="quest-title">
                      {questStatus.definition.title}
                      {questStatus.completionCount > 0 && (
                        <span> (x{questStatus.completionCount})</span>
                      )}
                    </span>
                    <span
                      className="quest-status"
                      style={{ color: getQuestStatusColor(questStatus.status) }}
                    >
                      {getQuestStatusText(questStatus)}
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
                {getQuestStatusText(selectedQuestStatus)}
              </span>
            </div>

            <div className="quest-content">
              <h4>
                {selectedQuestStatus.definition.title}
                {selectedQuestStatus.completionCount > 0 && (
                  <span> (Completed {selectedQuestStatus.completionCount}x)</span>
                )}
              </h4>
              <p className="quest-description">{selectedQuestStatus.definition.description}</p>

              {/* Objectives - use filtered objectives */}
              <div className="quest-objectives">
                <h5>Objectives:</h5>
                {getVisibleObjectives(
                  selectedQuestStatus.definition,
                  selectedQuestStatus.completionCount
                ).map((objective, index) => {
                  const activeObjective = selectedQuestStatus.quest?.objectives?.find(
                    (obj) => obj.id === objective.id
                  );
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

              {/* Rewards Section - use filtered rewards */}
              <div className="quest-rewards">
                <h5>
                  Rewards
                  {selectedQuestStatus.completionCount > 0 &&
                    selectedQuestStatus.definition.isRepeatable &&
                    " (for next completion)"}
                  :
                </h5>
                <div
                  className="rewards-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "8px",
                    maxWidth: "720px",
                  }}
                >
                  {getVisibleRewards(
                    selectedQuestStatus.definition,
                    selectedQuestStatus.completionCount
                  ).map((reward, index) => {
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
                              <span className="reward-amount">{reward.amount}</span>
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
                              <span className="reward-amount">{reward.amount}</span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    if (reward.name === "experience") {
                      return (
                        <div key={index} className="reward-item">
                          <div className="reward-image">
                            <img src="assets/inventory/exp-icon.png" alt="Experience" />
                          </div>
                          <div className="reward-info">
                            <span className="reward-name">Experience</span>
                            <span className="reward-amount">{reward.amount}</span>
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
                          {reward.amount && <span className="reward-amount">{reward.amount}</span>}
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
