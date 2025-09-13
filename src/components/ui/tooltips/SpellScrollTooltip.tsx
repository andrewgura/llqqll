import React, { useState, useEffect } from "react";
import { ItemData, ItemInstance, ItemType } from "../../../types";
import { ItemInstanceManager } from "../../../utils/ItemInstanceManager";
import { SpellDictionary } from "../../../services/SpellDictionaryService";

interface SpellScrollTooltipProps {
  itemInstance?: ItemInstance;
  visible: boolean;
}

const SpellScrollTooltip: React.FC<SpellScrollTooltipProps> = ({ itemInstance, visible }) => {
  const [itemData, setItemData] = useState<ItemData | null>(null);

  useEffect(() => {
    if (itemInstance) {
      const combinedData = ItemInstanceManager.getCombinedStats(itemInstance);
      setItemData(combinedData);
    } else {
      setItemData(null);
    }
  }, [itemInstance]);

  if (!visible || !itemData || itemData.type !== ItemType.SPELL_SCROLL) return null;

  // Get the spell this scroll teaches
  const spellData = itemData.teachesSpell ? SpellDictionary.getSpell(itemData.teachesSpell) : null;
  const alreadyLearned = true;

  const getTooltipStyle = () => {
    return {
      display: visible ? "block" : "none",
      position: "fixed" as const,
      zIndex: 2000,
      pointerEvents: "none" as const,
      right: 235,
      bottom: 30,
    };
  };

  return (
    <div className="game-item-tooltip spell-scroll-tooltip" style={getTooltipStyle()}>
      <div className="item-tooltip-header">
        <div className="item-tooltip-image-container">
          <img
            src="assets/equipment/general/spell-scroll.png"
            alt={itemData.name}
            className="item-tooltip-image"
          />
        </div>
        <div className="item-tooltip-title-section">
          <div
            className="item-name"
            style={{
              color: alreadyLearned ? "#888888" : "#ff9d5a", // Gray if already learned, orange if new
            }}
          >
            {itemData.name}
          </div>
          <div className="item-category">Spell Scroll</div>
        </div>
      </div>

      {/* Spell Information */}
      {spellData && (
        <div className="spell-scroll-spell-info">
          <div className="spell-scroll-spell-header">
            <img
              src={spellData.icon}
              alt={spellData.name}
              className="spell-scroll-spell-icon"
              style={{ width: "24px", height: "24px", marginRight: "8px" }}
            />
            <div>
              <div
                className="spell-scroll-spell-name"
                style={{ color: "#6ab5ff", fontWeight: "bold" }}
              >
                {spellData.name}
              </div>
              <div className="spell-scroll-spell-stats" style={{ fontSize: "11px", color: "#888" }}>
                {spellData.healing && `Healing: ${spellData.healing}`}
                {spellData.cooldown && ` • Cooldown: ${spellData.cooldown}s`}
              </div>
            </div>
          </div>
          <div
            className="spell-scroll-spell-description"
            style={{
              fontSize: "12px",
              color: "#b8c5d6",
              marginTop: "6px",
              fontStyle: "italic",
            }}
          >
            {spellData.description}
          </div>
        </div>
      )}

      {/* Description */}
      {itemData.description && (
        <div
          className="item-tooltip-description"
          style={{
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px solid rgba(61, 77, 107, 0.4)",
          }}
        >
          {itemData.description}
        </div>
      )}

      {/* Status and instructions */}
      <div
        className="spell-scroll-status"
        style={{
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid rgba(61, 77, 107, 0.4)",
        }}
      >
        {alreadyLearned ? (
          <div style={{ color: "#888888", fontSize: "12px" }}>✓ Spell already learned</div>
        ) : (
          <div style={{ color: "#00ff00", fontSize: "12px" }}>Right-click to learn this spell</div>
        )}
      </div>
    </div>
  );
};

export default SpellScrollTooltip;
