// src/components/ui/tooltips/SpellScrollTooltip.tsx
import React, { useState, useEffect } from "react";
import { ItemData, ItemInstance, ItemType } from "../../../types";
import { ItemInstanceManager } from "../../../utils/ItemInstanceManager";
import { AbilityDictionary } from "../../../services/AbilityDictionaryService";
import { abilitySystem } from "../../../services/AbilitySystem";

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

  // Get the ability this scroll teaches (formerly spell)
  const abilityData = itemData.teachesSpell
    ? AbilityDictionary.getAbility(itemData.teachesSpell)
    : null;
  const alreadyLearned = abilityData ? abilitySystem.isAbilityLearned(abilityData.id) : false;

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

      {/* Ability Information */}
      {abilityData && (
        <div className="spell-scroll-spell-info">
          <div className="spell-scroll-spell-header">
            <img
              src={abilityData.icon}
              alt={abilityData.name}
              className="spell-scroll-spell-icon"
              style={{ width: "24px", height: "24px", marginRight: "8px" }}
            />
            <div>
              <div
                className="spell-scroll-spell-name"
                style={{ color: "#6ab5ff", fontWeight: "bold" }}
              >
                {abilityData.name}
              </div>
              <div className="spell-scroll-spell-stats" style={{ fontSize: "11px", color: "#888" }}>
                {(abilityData as any).healing && `Healing: ${(abilityData as any).healing}`}
                {abilityData.damage > 0 && `Damage: ${abilityData.damage}`}
                {abilityData.cooldown && ` • Cooldown: ${abilityData.cooldown}s`}
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
            {abilityData.description}
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
          <div style={{ color: "#888888", fontSize: "12px" }}>✓ Ability already learned</div>
        ) : (
          <div style={{ color: "#00ff00", fontSize: "12px" }}>
            Right-click to learn this ability
          </div>
        )}
      </div>
    </div>
  );
};

export default SpellScrollTooltip;
