// src/components/ui/QuestLog.tsx
import React, { useState, useEffect, useRef } from "react";
import { useEventBus, useEmitEvent } from "../../hooks/useEventBus";
import { useGameStore } from "../../stores/gameStore";
import { Quest } from "../../types";

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
  const [activeTab, setActiveTab] = useState<QuestTab>(QuestTab.MAIN);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);
  const questItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const emitEvent = useEmitEvent();

  // Get quests from game store
  const activeQuests = useGameStore((state) => state.quests.active);
  const completedQuests = useGameStore((state) => state.quests.completed);

  const maxPages = Math.max(1);

  // Calculate total quest points (from completed quests)
  const calculateTotalQuestPoints = (): number => {
    return completedQuests.length; // Simple calculation for now
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
    if (activeTab === QuestTab.SIDE && activeQuests.length > 0 && !selectedQuest) {
      setSelectedQuest(activeQuests[0].id);
    }
  }, [activeTab, activeQuests, selectedQuest]);

  const isStepCompleted = (step: number, page: number): boolean => {
    return true;
  };

  const isCurrentStep = (step: number, page: number): boolean => {
    return true;
  };

  const isRiddleCompleted = (name: string): boolean => {
    return true;
  };

  const getSideQuestProgress = (quest: SideQuest): number => {
    return 0;
  };

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

  const handleSelectQuest = (questId: string) => {
    setSelectedQuest(questId);
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
    if (activeQuests.length === 0) {
      return (
        <div className="side-quests-container">
          <div className="no-quests">
            <p>No active side quests</p>
            <p className="no-quests-hint">Find NPCs with quests to get started!</p>
          </div>
        </div>
      );
    }

    return (
      <div className="side-quests-container">
        {/* Navigation panel */}
        <div className="side-quest-navigation">
          {activeQuests.map((quest) => (
            <div
              key={quest.id}
              className={`side-quest-nav-item ${selectedQuest === quest.id ? "active" : ""}`}
              onClick={() => handleSelectQuest(quest.id)}
            >
              {quest.title}
            </div>
          ))}
        </div>

        {/* Content panel */}
        <div className="side-quest-content">
          {selectedQuest &&
            (() => {
              const quest = activeQuests.find((q) => q.id === selectedQuest);
              if (!quest) return null;

              const completedObjectives = quest.objectives.filter((obj) => obj.completed).length;
              const totalObjectives = quest.objectives.length;
              const progressPercentage =
                totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;
              const isComplete = quest.completed;

              return (
                <div
                  className={`side-quest-item ${isComplete ? "completed" : ""}`}
                  ref={(el) => (questItemRefs.current[quest.id] = el)}
                >
                  <div className="side-quest-header">
                    <div className="side-quest-name">{quest.title}</div>
                    <div className="side-quest-reward">Quest Points</div>
                  </div>
                  <div className="side-quest-description">{quest.description}</div>

                  {/* Objectives */}
                  <div className="quest-objectives">
                    <h5>Objectives:</h5>
                    {quest.objectives.map((objective) => (
                      <div
                        key={objective.id}
                        className={`objective ${objective.completed ? "completed" : ""}`}
                      >
                        <span className="objective-status">{objective.completed ? "✓" : "○"}</span>
                        <span className="objective-text">{objective.description}</span>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="side-quest-progress">
                    <div className="side-quest-progress-text">
                      Progress: {completedObjectives}/{totalObjectives} objectives
                    </div>
                    <div className="side-quest-progress-bar-container">
                      <div
                        className="side-quest-progress-bar-fill"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="side-quest-status">
                    {isComplete ? (
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
          Side ({activeQuests.length})
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
