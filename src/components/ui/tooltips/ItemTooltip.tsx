import React, { useState, useEffect } from "react";
import { ItemData, ItemInstance, ItemType, PlayerAttackType } from "../../../types";
import { ItemInstanceManager } from "../../../utils/ItemInstanceManager";
import { useGameStore } from "../../../stores/gameStore";
import { SET_CONFIGURATIONS } from "../../../data/setConfig";

interface ItemTooltipProps {
  itemInstance?: ItemInstance;
  visible: boolean;
}

const ItemTooltip: React.FC<ItemTooltipProps> = ({ itemInstance, visible }) => {
  const [itemData, setItemData] = useState<ItemData | null>(null);
  const { playerCharacter } = useGameStore();

  useEffect(() => {
    if (itemInstance) {
      const combinedData = ItemInstanceManager.getCombinedStats(itemInstance);
      setItemData(combinedData);
    } else {
      setItemData(null);
    }
  }, [itemInstance]);

  if (!visible || !itemData) return null;

  const getItemFolder = (item: ItemData): string => {
    const categoryToFolderMap: Record<string, string> = {
      weapon_melee: "melee-weapons",
      weapon_magic: "magic",
      weapon_ranged: "ranged",
      armor: "chest",
      shield: "offhand",
      helmet: "helmet",
      amulet: "necklace",
      trinket: "trinket",
      food: "food",
      product: "products",
      currency: "valuables",
      material: "valuables",
      consumable: "valuables",
      quest: "valuables",
    };

    return item.category ? categoryToFolderMap[item.category] || "valuables" : "valuables";
  };

  const getImageUrl = (): string => {
    if (!itemData?.texture) return "";
    const folder = getItemFolder(itemData);
    return `assets/equipment/${folder}/${itemData.texture}.png`;
  };

  const hasBonuses = itemInstance?.bonusStats && Object.keys(itemInstance.bonusStats).length > 0;
  const isSetItem = !!itemData.set;
  const isFood = itemData.type === ItemType.FOOD;
  const isProduct = itemData.type === ItemType.PRODUCT;
  const isWeapon = itemData.type === ItemType.WEAPON;

  const quantity = itemInstance?.quantity || 1;

  const getItemNameColor = () => {
    if (isSetItem) return "#2ecc71";
    if (hasBonuses) return "#6ab5ff";
    if (isFood) return "#ffd280";
    if (isProduct) return "#ff9d5a";
    return "#d0e0ff";
  };

  const getCategoryDisplayName = (category?: string) => {
    if (!category) return "Unknown";

    const categoryNames: Record<string, string> = {
      weapon_melee: "Melee Weapon",
      weapon_magic: "Magic Weapon",
      weapon_ranged: "Ranged Weapon",
      armor: "Armor",
      shield: "Shield",
      helmet: "Helmet",
      amulet: "Amulet",
      trinket: "Trinket",
      consumable: "Consumable",
      food: "Food",
      material: "Material",
      product: "Product",
      currency: "Currency",
      quest: "Quest Item",
    };

    return categoryNames[category] || category;
  };

  const getInstructionText = () => {
    if (isFood) return "Right-click to consume";
    if (isProduct) return "Right-click for options • Used for trading and crafting";
    return "Drag to equip or right-click for actions";
  };

  const getMainStats = () => {
    const stats: Array<{ key: string; value: number; label: string; icon: string }> = [];

    if (itemData.power && itemData.power > 0) {
      stats.push({ key: "power", value: itemData.power, label: "Power", icon: "⚔️" });
    }
    if (itemData.armor && itemData.armor > 0) {
      stats.push({ key: "armor", value: itemData.armor, label: "Armor", icon: "🛡️" });
    }

    return stats;
  };

  const getSecondaryStats = () => {
    const stats: Array<{ key: string; value: number; label: string; icon: string }> = [];

    if (itemData.melee && itemData.melee > 0) {
      stats.push({ key: "melee", value: itemData.melee, label: "Melee", icon: "⚔️" });
    }
    if (itemData.magic && itemData.magic > 0) {
      stats.push({ key: "magic", value: itemData.magic, label: "Magic", icon: "🔮" });
    }
    if (itemData.health && itemData.health > 0) {
      stats.push({ key: "health", value: itemData.health, label: "Health", icon: "❤️" });
    }
    if (itemData.mana && itemData.mana > 0) {
      stats.push({ key: "mana", value: itemData.mana, label: "Mana", icon: "💙" });
    }
    if (itemData.hpRegen && itemData.hpRegen > 0) {
      stats.push({ key: "hpRegen", value: itemData.hpRegen, label: "HP Regen", icon: "💗" });
    }
    if (itemData.mpRegen && itemData.mpRegen > 0) {
      stats.push({ key: "mpRegen", value: itemData.mpRegen, label: "MP Regen", icon: "💙" });
    }
    if (itemData.capacity && itemData.capacity > 0) {
      stats.push({ key: "capacity", value: itemData.capacity, label: "Capacity", icon: "🎒" });
    }
    if (itemData.attackSpeed && itemData.attackSpeed > 0) {
      stats.push({
        key: "attackSpeed",
        value: itemData.attackSpeed,
        label: "Attack Speed",
        icon: "⚡",
      });
    }
    if (itemData.moveSpeed && itemData.moveSpeed > 0) {
      stats.push({ key: "moveSpeed", value: itemData.moveSpeed, label: "Move Speed", icon: "👟" });
    }

    return stats;
  };

  const getSecondaryAttackTypeDisplay = () => {
    if (!itemData.secondaryAttackType) return null;

    const attackTypeLabels: Record<
      PlayerAttackType,
      { label: string; icon: string; color: string }
    > = {
      [PlayerAttackType.Melee]: { label: "Melee", icon: "⚔️", color: "#ff6b6b" },
      [PlayerAttackType.Magic]: { label: "Magic", icon: "🔮", color: "#4ecdc4" },
      [PlayerAttackType.Ranged]: { label: "Ranged", icon: "🏹", color: "#45b7d1" },
    };

    return attackTypeLabels[itemData.secondaryAttackType];
  };

  // Count equipped set pieces
  const countEquippedSetPieces = (setName: string) => {
    let count = 0;
    Object.values(playerCharacter.equipment).forEach((equipmentItem) => {
      if (equipmentItem) {
        const equipmentData = ItemInstanceManager.getCombinedStats(equipmentItem);
        if (equipmentData?.set === setName) {
          count++;
        }
      }
    });
    return count;
  };

  const mainStats = getMainStats();
  const secondaryStats = getSecondaryStats();
  const hasMainStats = mainStats.length > 0;
  const hasSecondaryStats = secondaryStats.length > 0;
  const secondaryAttackInfo = getSecondaryAttackTypeDisplay();

  const getTooltipStyle = () => {
    return {
      display: visible ? "block" : "none",
      position: "fixed" as const,
      zIndex: 2000,
      pointerEvents: "none" as const,
      maxWidth: "320px",
      width: "auto",
      right: 235,
      bottom: 30,
    };
  };

  return (
    <div className="game-item-tooltip" style={getTooltipStyle()}>
      <div className={`item-tooltip-content ${isProduct ? "product-tooltip" : ""}`}>
        <div className="item-tooltip-header">
          <div className="item-tooltip-image-container">
            <img src={getImageUrl()} alt={itemData.name} className="item-tooltip-image" />
          </div>
          <div className="item-tooltip-title-section">
            <span className="item-name" style={{ color: getItemNameColor() }}>
              {itemData.name}
              {quantity > 1 && (
                <span
                  style={{
                    color: "#ffd280",
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginLeft: "4px",
                  }}
                >
                  {" "}
                  ×{quantity}
                </span>
              )}
            </span>
            {itemData.category && (
              <div
                className={`item-category ${isProduct ? "product-category" : ""}`}
                style={{
                  fontSize: "10px",
                  color: isProduct ? "#cc7a00" : "#7e91b5",
                  fontWeight: "500",
                  marginTop: "3px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {getCategoryDisplayName(itemData.category)}
              </div>
            )}
          </div>
        </div>

        <div className="item-tooltip-divider"></div>

        <div className="item-tooltip-stats">
          {isFood && (
            <React.Fragment>
              {itemData.hpRegen && (
                <div className="stat-row">
                  <span className="stat-icon">💗</span>
                  <span className="stat-label">HP Regen:</span>
                  <span className="stat-value positive">+{itemData.hpRegen}</span>
                </div>
              )}
              {itemData.mpRegen && (
                <div className="stat-row">
                  <span className="stat-icon">💙</span>
                  <span className="stat-label">MP Regen:</span>
                  <span className="stat-value positive">+{itemData.mpRegen}</span>
                </div>
              )}
            </React.Fragment>
          )}

          {isProduct && (
            <React.Fragment>
              <div className="stat-row">
                <span className="stat-icon">💰</span>
                <span className="stat-label">Value:</span>
                <span className="stat-value neutral">{itemData.sellValue || 0}g</span>
              </div>
            </React.Fragment>
          )}

          {!isFood && !isProduct && (
            <React.Fragment>
              {hasMainStats && (
                <React.Fragment>
                  {mainStats.map((stat) => (
                    <div key={stat.key} className="stat-row">
                      <span className="stat-icon">{stat.icon}</span>
                      <span className="stat-label">{stat.label}:</span>
                      <span className="stat-value positive">+{stat.value}</span>
                    </div>
                  ))}
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </div>

        {isWeapon && secondaryAttackInfo && (
          <React.Fragment>
            <div className="item-tooltip-divider"></div>
            <div
              style={{
                background: `linear-gradient(135deg, ${secondaryAttackInfo.color}15 0%, ${secondaryAttackInfo.color}08 100%)`,
                border: `1px solid ${secondaryAttackInfo.color}40`,
                borderRadius: "8px",
                padding: "12px 16px",
                margin: "10px 0",
                minHeight: "60px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  color: secondaryAttackInfo.color,
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                🔥 Secondary Attack
              </div>
              <div
                style={{
                  color: secondaryAttackInfo.color,
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "500",
                }}
              >
                <span style={{ fontSize: "16px" }}>{secondaryAttackInfo.icon}</span>
                <span>{secondaryAttackInfo.label} Damage</span>
              </div>
            </div>
          </React.Fragment>
        )}

        {isWeapon && hasSecondaryStats && (
          <React.Fragment>
            <div className="item-tooltip-divider"></div>
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(106, 181, 255, 0.08) 0%, rgba(106, 181, 255, 0.03) 100%)",
                borderRadius: "6px",
                padding: "8px 0",
                margin: "6px 0",
              }}
            >
              <div
                style={{
                  color: "#6ab5ff",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                  paddingLeft: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>⚡</span>
                <span>Additional Stats</span>
              </div>
              {secondaryStats.map((stat) => (
                <div key={stat.key} className="stat-row">
                  <span className="stat-icon">{stat.icon}</span>
                  <span className="stat-label">{stat.label}:</span>
                  <span className="stat-value positive">+{stat.value}</span>
                </div>
              ))}
            </div>
          </React.Fragment>
        )}

        {hasBonuses && !isSetItem && (
          <React.Fragment>
            <div className="item-tooltip-divider"></div>
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, rgba(46, 204, 113, 0.03) 100%)",
                borderRadius: "6px",
                padding: "8px 0",
                margin: "6px 0",
              }}
            >
              <div
                style={{
                  color: "#2ecc71",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                  paddingLeft: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>⭐</span>
                <span>Item Bonuses</span>
              </div>
              {itemInstance?.bonusStats &&
                Object.entries(itemInstance.bonusStats).map(([stat, value]) => (
                  <div key={stat} className="stat-row">
                    <span className="stat-icon">⭐</span>
                    <span className="stat-label">
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}:
                    </span>
                    <span className="stat-value positive">+{value}</span>
                  </div>
                ))}
            </div>
          </React.Fragment>
        )}

        {isSetItem && (
          <React.Fragment>
            <div className="item-tooltip-divider"></div>
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, rgba(46, 204, 113, 0.03) 100%)",
                borderRadius: "6px",
                padding: "8px 0",
                margin: "6px 0",
              }}
            >
              <div
                style={{
                  color: "#2ecc71",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                  paddingLeft: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>⚔️</span>
                <span>Set: {itemData.set}</span>
              </div>
              <div
                style={{
                  color: "#7e91b5",
                  fontSize: "10px",
                  marginBottom: "8px",
                  paddingLeft: "12px",
                }}
              >
                {itemData.set ? countEquippedSetPieces(itemData.set) : 0} of{" "}
                {itemData.set && SET_CONFIGURATIONS[itemData.set]
                  ? SET_CONFIGURATIONS[itemData.set].totalSlots
                  : 0}{" "}
                pieces equipped
              </div>
              {itemData.setBonus && (
                <React.Fragment>
                  <div
                    style={{
                      color: "#2ecc71",
                      fontSize: "11px",
                      fontWeight: "bold",
                      marginBottom: "6px",
                      paddingLeft: "12px",
                    }}
                  >
                    Set Bonuses:
                  </div>
                  {Object.entries(itemData.setBonus).map(([stat, value]) => (
                    <div key={stat} className="stat-row">
                      <span className="stat-icon">🔗</span>
                      <span className="stat-label">
                        {stat.charAt(0).toUpperCase() + stat.slice(1)}:
                      </span>
                      <span className="stat-value positive">+{value}</span>
                    </div>
                  ))}
                </React.Fragment>
              )}
            </div>
          </React.Fragment>
        )}

        {itemData.description && (
          <div className={`item-tooltip-description ${isProduct ? "product-description" : ""}`}>
            {itemData.description}
          </div>
        )}

        {isProduct && (
          <div className="product-info-section">
            <div className="product-info-title">📦 Trade Goods</div>
            <div className="product-info-text">
              This item is valuable for trading with merchants and may be used in crafting recipes.
            </div>
          </div>
        )}

        <div className={`item-tooltip-instruction ${isProduct ? "product-instruction" : ""}`}>
          {getInstructionText()}
        </div>
      </div>
    </div>
  );
};

export default ItemTooltip;
