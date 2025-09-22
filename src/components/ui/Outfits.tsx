import React, { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useEventBus, useEmitEvent } from "../../hooks/useEventBus";
import { OutfitData } from "@/types/player/outfits";

const TINT_COLORS = [
  // Default/White
  { name: "Default", value: 0xffffff, color: "#ffffff" },

  // Red Family
  { name: "Light Red", value: 0xff8080, color: "#ff8080" },
  { name: "Pink Red", value: 0xff6666, color: "#ff6666" },
  { name: "Coral", value: 0xff7f7f, color: "#ff7f7f" },
  { name: "Red", value: 0xff0000, color: "#ff0000" },
  { name: "Crimson", value: 0xdc143c, color: "#dc143c" },
  { name: "Fire Red", value: 0xff4500, color: "#ff4500" },
  { name: "Dark Red", value: 0x8b0000, color: "#8b0000" },
  { name: "Blood Red", value: 0x660000, color: "#660000" },
  { name: "Maroon", value: 0x800000, color: "#800000" },

  // Blue Family
  { name: "Light Blue", value: 0x87ceeb, color: "#87ceeb" },
  { name: "Ice Blue", value: 0xb0e0e6, color: "#b0e0e6" },
  { name: "Cyan", value: 0x00ffff, color: "#00ffff" },
  { name: "Blue", value: 0x0000ff, color: "#0000ff" },
  { name: "Royal Blue", value: 0x4169e1, color: "#4169e1" },
  { name: "Steel Blue", value: 0x4682b4, color: "#4682b4" },
  { name: "Dark Blue", value: 0x000080, color: "#000080" },
  { name: "Midnight Blue", value: 0x191970, color: "#191970" },
  { name: "Deep Blue", value: 0x003366, color: "#003366" },

  // Green Family
  { name: "Light Green", value: 0x90ee90, color: "#90ee90" },
  { name: "Mint", value: 0x98fb98, color: "#98fb98" },
  { name: "Lime", value: 0x00ff00, color: "#00ff00" },
  { name: "Green", value: 0x008000, color: "#008000" },
  { name: "Poison Green", value: 0x32cd32, color: "#32cd32" },
  { name: "Emerald", value: 0x50c878, color: "#50c878" },
  { name: "Dark Green", value: 0x006400, color: "#006400" },
  { name: "Forest Green", value: 0x228b22, color: "#228b22" },
  { name: "Swamp Green", value: 0x2e4d2e, color: "#2e4d2e" },

  // Purple Family
  { name: "Lavender", value: 0xe6e6fa, color: "#e6e6fa" },
  { name: "Light Purple", value: 0xdda0dd, color: "#dda0dd" },
  { name: "Magenta", value: 0xff00ff, color: "#ff00ff" },
  { name: "Purple", value: 0x800080, color: "#800080" },
  { name: "Violet", value: 0x9400d3, color: "#9400d3" },
  { name: "Magic Purple", value: 0x8a2be2, color: "#8a2be2" },
  { name: "Dark Purple", value: 0x4b0082, color: "#4b0082" },
  { name: "Shadow Purple", value: 0x301934, color: "#301934" },
  { name: "Void Purple", value: 0x2d1b3d, color: "#2d1b3d" },

  // Yellow/Orange Family
  { name: "Light Yellow", value: 0xffffe0, color: "#ffffe0" },
  { name: "Cream", value: 0xfffdd0, color: "#fffdd0" },
  { name: "Gold", value: 0xffd700, color: "#ffd700" },
  { name: "Yellow", value: 0xffff00, color: "#ffff00" },
  { name: "Orange", value: 0xffa500, color: "#ffa500" },
  { name: "Amber", value: 0xffbf00, color: "#ffbf00" },
  { name: "Dark Orange", value: 0xff8c00, color: "#ff8c00" },
  { name: "Bronze", value: 0xcd7f32, color: "#cd7f32" },
  { name: "Burnt Orange", value: 0xcc5500, color: "#cc5500" },

  // Gray/Black Family
  { name: "Ghost White", value: 0xf8f8ff, color: "#f8f8ff" },
  { name: "Light Gray", value: 0xd3d3d3, color: "#d3d3d3" },
  { name: "Silver", value: 0xc0c0c0, color: "#c0c0c0" },
  { name: "Gray", value: 0x808080, color: "#808080" },
  { name: "Slate Gray", value: 0x708090, color: "#708090" },
  { name: "Steel Gray", value: 0x71797e, color: "#71797e" },
  { name: "Dark Gray", value: 0x404040, color: "#404040" },
  { name: "Charcoal", value: 0x36454f, color: "#36454f" },
  { name: "Black", value: 0x000000, color: "#000000" },

  // Special Effect Colors
  { name: "Frost", value: 0x6faadb, color: "#6faadb" },
  { name: "Toxic", value: 0x7fff00, color: "#7fff00" },
  { name: "Electric", value: 0x00bfff, color: "#00bfff" },
  { name: "Holy", value: 0xffefd5, color: "#ffefd5" },
  { name: "Shadow", value: 0x2f2f2f, color: "#2f2f2f" },
  { name: "Necro", value: 0x4a4a4a, color: "#4a4a4a" },
  { name: "Chaos", value: 0x8b008b, color: "#8b008b" },
  { name: "Nature", value: 0x228b22, color: "#228b22" },
  { name: "Infernal", value: 0xff6347, color: "#ff6347" },
  { name: "Celestial", value: 0xffd700, color: "#ffd700" },
  { name: "Spectral", value: 0x9932cc, color: "#9932cc" },
  { name: "Elemental", value: 0x4682b4, color: "#4682b4" },
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
        <span>
          ({unlockedOutfits.length} / {allOutfits.length} unlocked)
        </span>
        <button className="outfits-close-button" onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className="outfits-content">
        {/* Outfit Selection */}
        <div className="outfit-selection-section">
          <div className="outfits-grid">
            {unlockedOutfits.map((outfit) => (
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
