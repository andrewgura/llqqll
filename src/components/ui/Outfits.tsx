import React, { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useEventBus, useEmitEvent } from "../../hooks/useEventBus";
import { OutfitData } from "../../stores/components/outfitStore";

const TINT_COLORS = [
  { name: "Default", value: 0xffffff, color: "#ffffff" },
  { name: "Red", value: 0xff6b6b, color: "#ff6b6b" },
  { name: "Blue", value: 0x4ecdc4, color: "#4ecdc4" },
  { name: "Green", value: 0x95e1d3, color: "#95e1d3" },
  { name: "Purple", value: 0xd63384, color: "#d63384" },
  { name: "Orange", value: 0xfd7e14, color: "#fd7e14" },
  { name: "Yellow", value: 0xffc107, color: "#ffc107" },
  { name: "Pink", value: 0xe83e8c, color: "#e83e8c" },
  { name: "Dark", value: 0x495057, color: "#495057" },
  { name: "Gold", value: 0xffd700, color: "#ffd700" },
  { name: "Silver", value: 0xc0c0c0, color: "#c0c0c0" },
  { name: "Bronze", value: 0xcd7f32, color: "#cd7f32" },
];

interface OutfitCardProps {
  outfit: OutfitData;
  isSelected: boolean;
  isUnlocked: boolean;
  onClick: () => void;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, isSelected, isUnlocked, onClick }) => {
  const cardClass = `outfit-card ${isSelected ? "selected" : ""} ${!isUnlocked ? "locked" : ""}`;

  return (
    <div className={cardClass} onClick={isUnlocked ? onClick : undefined}>
      <div className="outfit-preview">
        {outfit.previewImage ? (
          <img src={outfit.previewImage} alt={outfit.name} />
        ) : (
          <div className="outfit-placeholder">
            <span>?</span>
          </div>
        )}
        {!isUnlocked && <div className="outfit-lock-overlay">🔒</div>}
        {isSelected && <div className="outfit-selected-indicator">✓</div>}
      </div>
      <div className="outfit-info">
        <div className="outfit-name">{outfit.name}</div>
        {outfit.description && <div className="outfit-description">{outfit.description}</div>}
        {!isUnlocked && (
          <div className="outfit-unlock-hint">
            {outfit.unlockSource === "skeletal_set" && "Complete Skeletal Set"}
            {outfit.unlockSource === "default" && "Default"}
          </div>
        )}
      </div>
    </div>
  );
};

interface ColorSwatchProps {
  color: { name: string; value: number; color: string };
  isSelected: boolean;
  onClick: () => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, isSelected, onClick }) => {
  return (
    <div
      className={`color-swatch ${isSelected ? "selected" : ""}`}
      style={{ backgroundColor: color.color }}
      onClick={onClick}
      title={color.name}
    >
      {isSelected && <div className="color-swatch-check">✓</div>}
    </div>
  );
};

const Outfits: React.FC = () => {
  const { outfitState, setCurrentOutfit, setCurrentTint, getUnlockedOutfits, isOutfitUnlocked } =
    useGameStore();

  const [visible, setVisible] = useState(false);
  const emitEvent = useEmitEvent();

  // Listen for outfit toggle event
  useEventBus("outfits.toggle", (data: { visible: boolean }) => {
    setVisible(data.visible);
  });

  // Handle close
  const handleClose = () => {
    setVisible(false);
    emitEvent("outfits.visibility.changed", false);
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

  // Handle outfit selection
  const handleOutfitSelect = (outfitId: string) => {
    if (isOutfitUnlocked(outfitId)) {
      setCurrentOutfit(outfitId);
    }
  };

  // Handle tint color selection
  const handleTintSelect = (tintValue: number) => {
    setCurrentTint(tintValue);
  };

  if (!visible) {
    return null;
  }

  const unlockedOutfits = getUnlockedOutfits();
  const allOutfits = Object.values(outfitState.availableOutfits);

  return (
    <div className="outfits-container">
      <div className="outfits-header">
        <h2>Outfits</h2>
        <button className="outfits-close-button" onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className="outfits-content">
        {/* Outfit Selection */}
        <div className="outfit-selection-section">
          <h3>
            Available Outfits ({unlockedOutfits.length}/{allOutfits.length})
          </h3>
          <div className="outfits-grid">
            {allOutfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                isSelected={outfitState.currentOutfit === outfit.id}
                isUnlocked={isOutfitUnlocked(outfit.id)}
                onClick={() => handleOutfitSelect(outfit.id)}
              />
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div className="color-selection-section">
          <h3>Outfit Colors</h3>
          <div className="color-grid">
            {TINT_COLORS.map((color) => (
              <ColorSwatch
                key={color.value}
                color={color}
                isSelected={outfitState.currentTint === color.value}
                onClick={() => handleTintSelect(color.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Outfits;
