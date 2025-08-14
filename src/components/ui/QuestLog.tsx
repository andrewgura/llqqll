// src/components/ui/QuestLog.tsx
import React, { useState, useEffect, useRef } from "react";
import { useEventBus, useEmitEvent } from "../../hooks/useEventBus";
import { useGameStore } from "../../stores/gameStore";
import { Quest } from "../../types";
import { questService } from "../../services/QuestService";
import { ItemDictionary } from "../../services/ItemDictionaryService";

enum QuestTab {
  MAIN = "main",
  SIDE = "side",
  RIDDLES = "riddles",
}

interface MainQuestStep {
  page: number;
  step: number;
  task: string;
  img: string;
}

interface SideQuest {
  name: string;
  type: string;
  amount: number;
  reward: number;
  description: string;
  isRepeatable: boolean;
}

interface Riddle {
  name: string;
  img: string;
  reward: number;
}

const QuestLog: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<QuestTab>(QuestTab.SIDE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);
  const questItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const emitEvent = useEmitEvent();

  // Get quests from game store - include completionHistory
  const { activeQuests, completedQuests, questPoints, completionHistory } = useGameStore(
    (state) => ({
      activeQuests: state.quests.active,
      completedQuests: state.quests.completed,
      questPoints: state.playerCharacter.questPoints || 0,
      completionHistory: state.quests.completionHistory || {},
    })
  );

  // Combine active and completed quests for display
  const allQuests = [...activeQuests, ...completedQuests];

  const maxPages = Math.max(1);

  // Helper function to filter objectives based on completion status
  const getVisibleObjectives = (quest: Quest, questDefinition: any) => {
    const completionInfo = completionHistory[quest.id];
    const isFirstTime = !completionInfo || completionInfo.completionCount === 0;

    return quest.objectives.filter((objective) => {
      if (isFirstTime) {
        // First completion: show objectives that are NOT repeat-only
        return !objective.isRepeatObjective;
      } else {
        // Repeat completion: show objectives that ARE for repeats
        return objective.isRepeatObjective;
      }
    });
  };

  // Helper function to filter rewards based on completion status
  const getVisibleRewards = (questDefinition: any, quest: Quest) => {
    if (!questDefinition?.rewards) return [];

    const completionInfo = completionHistory[questDefinition.id];

    // For completed quests, always show first-time rewards
    if (quest.completed) {
      return questDefinition.rewards.filter((reward: any) => !reward.isRepeatableReward);
    }

    // For active quests, check if it's first time or repeat
    const isFirstTime = !completionInfo || completionInfo.completionCount === 0;

    return questDefinition.rewards.filter((reward: any) => {
      if (isFirstTime) {
        // First completion: show rewards that are NOT repeatable-only
        return !reward.isRepeatableReward;
      } else {
        // Repeat completion: show rewards that ARE for repeats
        return reward.isRepeatableReward || (!reward.isFirstTimeOnly && !reward.isRepeatableReward);
      }
    });
  };

  // Calculate total quest points (from player character)
  const calculateTotalQuestPoints = (): number => {
    return questPoints;
  };

  // Calculate quest progress based on visible objectives only
  const calculateQuestProgress = (
    quest: Quest,
    visibleObjectives: any[]
  ): { current: number; total: number; percentage: number } => {
    let totalCurrent = 0;
    let totalRequired = 0;

    visibleObjectives.forEach((objective) => {
      totalCurrent += objective.current;
      totalRequired += objective.amount;
    });

    const percentage = totalRequired > 0 ? Math.round((totalCurrent / totalRequired) * 100) : 0;
    return { current: totalCurrent, total: totalRequired, percentage };
  };

  // Helper functions for rewards display
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

  const handleSelectQuest = (questId: string) => {
    setSelectedQuest(questId);
  };

  useEventBus("quests.toggle", (data: { visible: boolean }) => {
    setVisible(data.visible);
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "p") {
        setVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    if (selectedQuest && questItemRefs.current[selectedQuest]) {
      questItemRefs.current[selectedQuest]?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedQuest]);

  // Auto-select first quest when switching to side quests tab
  useEffect(() => {
    if (activeTab === QuestTab.SIDE && allQuests.length > 0 && !selectedQuest) {
      setSelectedQuest(allQuests[0].id);
    }
  }, [activeTab, allQuests, selectedQuest]);

  const handleClose = () => {
    setVisible(false);
    emitEvent("ui.message.show", "Quest Log closed.");
  };

  const handleNextPage = () => {
    if (currentPage < maxPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderMainQuests = () => {
    return (
      <div className="quest-book">
        <div className="quest-book-left">
          <div className="quest-image-container">
            <img src={`placeholder.com/400x300"}`} alt="Quest" className="quest-image" />
          </div>
        </div>
        <div className="quest-book-right">
          <div className="quest-page-number">Page {currentPage}</div>
          <div className="quest-steps">
            <div className="quest-step current">
              <span className="quest-step-number">1.</span>
              <span className="quest-step-text">Main quest system coming soon...</span>
            </div>
          </div>
          <div className="quest-navigation">
            <button
              className={`quest-nav-button ${currentPage <= 1 ? "disabled" : ""}`}
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              ←
            </button>
            <button
              className={`quest-nav-button ${currentPage >= maxPages ? "disabled" : ""}`}
              onClick={handleNextPage}
              disabled={currentPage >= maxPages}
            >
              →
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSideQuests = () => {
    if (allQuests.length === 0) {
      return (
        <div className="side-quests-container">
          <div className="no-quests">
            <p>No side quests</p>
            <p className="no-quests-hint">Find NPCs with quests to get started!</p>
          </div>
        </div>
      );
    }

    return (
      <div className="side-quests-container">
        {/* Navigation panel - ORIGINAL STRUCTURE */}
        <div className="side-quest-navigation">
          {allQuests.map((quest) => (
            <div
              key={quest.id}
              className={`side-quest-nav-item ${selectedQuest === quest.id ? "active" : ""} ${quest.completed ? "completed" : ""}`}
              onClick={() => handleSelectQuest(quest.id)}
            >
              {quest.title}
              {quest.completed && <span className="completed-indicator"> ✓</span>}
              {completionHistory[quest.id]?.completionCount > 1 && (
                <span className="repeat-count">
                  {" "}
                  x{completionHistory[quest.id].completionCount}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Content panel - ORIGINAL STRUCTURE */}
        <div className="side-quest-content">
          {selectedQuest &&
            (() => {
              const quest = allQuests.find((q) => q.id === selectedQuest);
              if (!quest) return null;

              const questDefinition = questService.getQuestDefinition(quest.id);
              const visibleObjectives = getVisibleObjectives(quest, questDefinition);
              const visibleRewards = getVisibleRewards(questDefinition, quest);
              const completionInfo = completionHistory[quest.id];

              const questProgress = calculateQuestProgress(quest, visibleObjectives);
              const completedObjectives = visibleObjectives.filter((obj) => obj.completed).length;
              const totalObjectives = visibleObjectives.length;

              return (
                <div
                  className={`side-quest-item ${quest.completed ? "completed" : ""} ${quest.readyToTurnIn ? "ready-to-turn-in" : ""}`}
                  ref={(el) => (questItemRefs.current[quest.id] = el)}
                >
                  <div className="side-quest-header">
                    <div className="side-quest-name">
                      {quest.title}
                      {quest.completed && <span className="status-text"> (Completed)</span>}
                      {completionInfo?.completionCount > 0 && questDefinition?.isRepeatable && (
                        <span className="completion-info">
                          {" "}
                          - Repeatable (Completed {completionInfo.completionCount}x)
                        </span>
                      )}
                    </div>
                    <div className="side-quest-reward">Quest Points</div>
                  </div>
                  <div className="side-quest-description">{quest.description}</div>

                  {/* Objectives - use visible objectives */}
                  <div className="quest-objectives">
                    <h5>Objectives:</h5>
                    {visibleObjectives.map((objective, index) => (
                      <div
                        key={`${objective.id}-${index}`}
                        className={`objective ${objective.completed ? "completed" : ""}`}
                      >
                        <span className="objective-status">{objective.completed ? "✓" : "○"}</span>
                        <span className="objective-text">
                          {objective.description}
                          {objective.target && (
                            <span className="objective-progress">
                              {" "}
                              ({objective.current}/{objective.amount})
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progress - only show for non-completed quests */}
                  {!quest.completed && (
                    <div className="side-quest-progress">
                      <div className="side-quest-progress-text">
                        Progress: {questProgress.current}/{questProgress.total} kills (
                        {completedObjectives}/{totalObjectives} objectives)
                      </div>
                      <div className="side-quest-progress-bar-container">
                        <div
                          className="side-quest-progress-bar-fill"
                          style={{ width: `${questProgress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Rewards Section - use visible rewards */}
                  {visibleRewards && visibleRewards.length > 0 && (
                    <div className="quest-rewards">
                      <h5>
                        Rewards
                        {!quest.completed &&
                          completionInfo?.completionCount > 0 &&
                          questDefinition?.isRepeatable &&
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
                        {visibleRewards.map((reward: any, index: number) => {
                          // Handle special reward types
                          if (reward.name === "goldCoins") {
                            return (
                              <div key={index} className="reward-item">
                                <div className="reward-image">
                                  <img
                                    src="assets/equipment/valuables/gold-coins.png"
                                    alt="Gold Coins"
                                  />
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
                                  {reward.amount && (
                                    <span className="reward-amount">{reward.amount}</span>
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
                                {reward.amount && (
                                  <span className="reward-amount">{reward.amount}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="side-quest-status">
                    {quest.readyToTurnIn ? (
                      <span className="status-ready">Ready to Turn In</span>
                    ) : quest.completed ? (
                      <span className="status-complete">Completed</span>
                    ) : (
                      <span className="status-active">In Progress</span>
                    )}
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    );
  };

  const renderRiddles = () => {
    return (
      <div className="riddles-container">
        <div className="no-content">
          <p>Riddle system coming soon...</p>
        </div>
      </div>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="quest-log-container">
      <div className="quest-log-header">
        <h2>Quest Log</h2>
        <div className="total-quest-points">
          <span>{calculateTotalQuestPoints()} Quest Points</span>
        </div>
        <button className="close-button" onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className="quest-tabs">
        <div
          className={`quest-tab ${activeTab === QuestTab.MAIN ? "active" : ""}`}
          onClick={() => setActiveTab(QuestTab.MAIN)}
        >
          Main
        </div>
        <div
          className={`quest-tab ${activeTab === QuestTab.SIDE ? "active" : ""}`}
          onClick={() => setActiveTab(QuestTab.SIDE)}
        >
          Side ({activeQuests.length + completedQuests.length})
        </div>
        <div
          className={`quest-tab ${activeTab === QuestTab.RIDDLES ? "active" : ""}`}
          onClick={() => setActiveTab(QuestTab.RIDDLES)}
        >
          Riddles
        </div>
      </div>

      <div className="quest-content">
        {activeTab === QuestTab.MAIN && renderMainQuests()}
        {activeTab === QuestTab.SIDE && renderSideQuests()}
        {activeTab === QuestTab.RIDDLES && renderRiddles()}
      </div>
    </div>
  );
};

export default QuestLog;
