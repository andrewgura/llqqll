import React, { useState, useEffect, useRef } from "react";
import { useEventBus, useEmitEvent } from "../../hooks/useEventBus";

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

  const maxPages = Math.max(1);

  // Calculate total quest points (from completed quests)
  const calculateTotalQuestPoints = (): number => {
    return 1;
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

  const handleSelectQuest = (questName: string) => {
    setSelectedQuest(questName);
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
            {/* const completed = isStepCompleted(quest.step, quest.page);
              const current = isCurrentStep(quest.step, quest.page);


              if (!completed && !current) return null;

              return (
                <div
                  key={`${quest.page}-${quest.step}`}
                  className={`quest-step ${completed ? "completed" : ""} ${current ? "current" : ""}`}
                >
                  <span className="quest-step-number">{quest.step}.</span>
                  <span className="quest-step-text">{quest.task}</span>
                </div>
              ); */}
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
    return (
      <div className="side-quests-container">
        {/* Navigation panel */}
        <div className="side-quest-navigation">
          {/* <div
              key={quest.name}
              className={`side-quest-nav-item ${selectedQuest === quest.name ? "active" : ""}`}
              onClick={() => handleSelectQuest(quest.name)}
            >
              {quest.name}
            </div> */}
        </div>

        {/* Content panel */}
        <div className="side-quest-content">
          {/* const progress = getSideQuestProgress(quest);
            const progressPercentage = Math.min(100, (progress / quest.amount) * 100);
            const isComplete = progress >= quest.amount;

            return (
              <div
                key={quest.name}
                className={`side-quest-item ${isComplete ? "completed" : ""}`}
                ref={(el) => (questItemRefs.current[quest.name] = el)}
              >
                <div className="side-quest-header">
                  <div className="side-quest-name">{quest.name}</div>
                  <div className="side-quest-reward"> Quest Point</div>
                </div>
                <div className="side-quest-description">{quest.description}</div>
                <div className="side-quest-progress">
                  <div className="side-quest-progress-text">
                    Progress: {progress}/{quest.amount}
                  </div>
                  <div className="side-quest-progress-bar-container">
                    <div
                      className="side-quest-progress-bar-fill"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="side-quest-type-tag"></div>
              </div>
            ); */}
        </div>
      </div>
    );
  };

  const renderRiddles = () => {
    return (
      <div className="riddles-container">
        {/* 
          const completed = isRiddleCompleted(riddle.name);

          return (
            <div key={riddle.name} className={`riddle-card ${completed ? "completed" : "hidden"}`}>
              <div className="riddle-image-container">
                {completed ? (
                  <img
                    src={`assets/quests/${riddle.img}`}
                    alt={riddle.name}
                    className="riddle-image"
                  />
                ) : (
                  <div className="riddle-unknown">?</div>
                )}
              </div>
              <div className="riddle-info">
                <div className="riddle-name">{completed ? riddle.name : "???"}</div>
                {completed && <div className="riddle-reward">{riddle.reward} Quest Points</div>}
              </div>
            </div>
          ); */}
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
          Side
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
