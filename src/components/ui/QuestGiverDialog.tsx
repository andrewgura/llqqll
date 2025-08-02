import React, { useState, useEffect } from "react";
import { questService, QuestDefinition } from "../../services/QuestService";
import { useGameStore } from "../../stores/gameStore";

interface QuestGiverDialogProps {
  npcId: string;
  npcName: string;
  availableQuests: string[];
  visible: boolean;
  onClose: () => void;
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
  const acceptQuest = useGameStore((state) => state.acceptQuest);

  const questDefinitions = availableQuests
    .map((questId) => questService.getQuestDefinition(questId))
    .filter(Boolean) as QuestDefinition[];

  const selectedQuestDef = selectedQuest ? questService.getQuestDefinition(selectedQuest) : null;

  const handleQuestSelect = (questId: string) => {
    setSelectedQuest(questId);
    setViewMode("details");
  };

  const handleAcceptQuest = () => {
    if (selectedQuest) {
      acceptQuest(selectedQuest);
      onClose();
    }
  };

  const handleBackToList = () => {
    setSelectedQuest(null);
    setViewMode("list");
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
            <p>I have some tasks that need doing. Are you interested?</p>
            <div className="quest-options">
              {questDefinitions.map((quest) => (
                <button
                  key={quest.id}
                  className="quest-option"
                  onClick={() => handleQuestSelect(quest.id)}
                >
                  {quest.title}
                </button>
              ))}
              <button className="quest-option decline" onClick={onClose}>
                Not right now
              </button>
            </div>
          </div>
        )}

        {viewMode === "details" && selectedQuestDef && (
          <div className="quest-details">
            <h4>{selectedQuestDef.title}</h4>
            <p className="quest-description">{selectedQuestDef.description}</p>

            <div className="quest-objectives">
              <h5>Objectives:</h5>
              <ul>
                {selectedQuestDef.objectives.map((objective) => (
                  <li key={objective.id}>{objective.description}</li>
                ))}
              </ul>
            </div>

            <div className="quest-actions">
              <button className="accept-button" onClick={handleAcceptQuest}>
                Accept Quest
              </button>
              <button className="back-button" onClick={handleBackToList}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestGiverDialog;
