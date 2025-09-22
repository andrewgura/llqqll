import React, { useState, useEffect, useRef } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useEventBus, useEmitEvent } from "../../hooks/useEventBus";
import { Ability, SpellCategory, SpellData } from "../../types";
import { AbilityDictionary } from "../../services/AbilityDictionaryService";
import { ItemDictionary } from "../../services/ItemDictionaryService";
import { SpellDictionary } from "../../services/SpellDictionaryService";

interface AbilitySlotProps {
  ability: Ability;
  number: number;
  isOnActionBar: boolean;
  onDragStart: (e: React.DragEvent, ability: Ability) => void;
}

const AbilitySlot: React.FC<AbilitySlotProps> = ({
  ability,
  number,
  isOnActionBar,
  onDragStart,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX + 10, y: e.clientY - 10 });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Check if this is a spell (has healing property) for tooltip display
  const isSpell = (ability as any).healing !== undefined || (ability as any).isSpell;

  return (
    <div
      className={`ability-slot ${isOnActionBar ? "on-action-bar" : ""}`}
      data-ability-id={ability.id}
      draggable
      onDragStart={(e) => onDragStart(e, ability)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="ability-icon" style={{ backgroundImage: `url('${ability.icon}')` }} />
      <div className="ability-number">{number}</div>

      {showTooltip && (
        <div
          className="ability-tooltip"
          style={{
            display: "block",
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <div className="ability-tooltip-title">{ability.name}</div>
          <div className="ability-tooltip-desc">{ability.description}</div>
          <div className="ability-tooltip-stats">
            {isSpell && (ability as any).healing && `Healing: ${(ability as any).healing} | `}
            {ability.damage && `Damage: ${ability.damage} | `}
            Cooldown: {ability.cooldown}s
            {(ability as any).manaCost && ` | Mana: ${(ability as any).manaCost}`}
          </div>
        </div>
      )}
    </div>
  );
};

interface AbilityCategoryProps {
  categoryName: string;
  abilities: Ability[];
  actionBarAbilities: Record<number, string>;
  onDragStart: (e: React.DragEvent, ability: Ability) => void;
}

const AbilityCategory: React.FC<AbilityCategoryProps> = ({
  categoryName,
  abilities,
  actionBarAbilities,
  onDragStart,
}) => {
  return (
    <div className="ability-category">
      <div className="category-header">{categoryName}</div>
      <div className="ability-slots">
        {abilities.map((ability, index) => (
          <AbilitySlot
            key={ability.id}
            ability={ability}
            number={index + 1}
            isOnActionBar={Object.values(actionBarAbilities).includes(ability.id)}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
};

const AbilityInterface: React.FC = () => {
  const { playerCharacter, getLearnedAbilities } = useGameStore();

  const [visible, setVisible] = useState(false);
  const [actionBarAbilities, setActionBarAbilities] = useState<Record<number, string>>({});
  const [lastWeaponType, setLastWeaponType] = useState<string | null>(null);
  const emitEvent = useEmitEvent();

  // Toggle visibility when 'O' key is pressed
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "o") {
        toggleInterface();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Listen for ability activation events
  useEventBus("ability.activated", (data) => {
    if (data && data.slotIndex !== undefined && data.abilityId) {
      setActionBarAbilities((prev) => ({
        ...prev,
        [data.slotIndex - 1]: data.abilityId,
      }));
    }
  });

  // Listen for ability removal events
  useEventBus("ability.removeFromSlot", (data) => {
    if (data && data.slotIndex !== undefined) {
      setActionBarAbilities((prev) => {
        const newAbilities = { ...prev };
        delete newAbilities[data.slotIndex - 1];
        return newAbilities;
      });
    }
  });

  // Listen for equipment changes
  useEventBus("equipment.changed", (data) => {
    if (data && data.equipment) {
      updateAbilitiesForEquipment(data.equipment);
    }
  });

  useEventBus("abilities.toggle", (data: { visible: boolean }) => {
    setVisible(data.visible);
  });

  const toggleInterface = () => {
    setVisible((prev) => !prev);

    if (!visible) {
      updateAbilitiesForEquipment(playerCharacter.equipment);
      updateActionBarAbilities();
      emitEvent(
        "ui.message.show",
        "Drag abilities and spells to action bar slots. Press O to close."
      );
    }

    emitEvent("abilities.visibility.changed", !visible);
  };

  const updateAbilitiesForEquipment = (equipment: any) => {
    // Determine weapon type from equipment
    let weaponType = "none";

    // Check if user has any weapon equipped
    const hasWeaponEquipped = equipment && equipment.weapon && equipment.weapon.templateId;

    if (hasWeaponEquipped) {
      // Get weapon type using templateId
      const itemWeaponType = ItemDictionary.getWeaponType(equipment.weapon.templateId);
      if (itemWeaponType) {
        weaponType = itemWeaponType;
      }
    }

    // Check if weapon type has changed
    if (lastWeaponType !== null && lastWeaponType !== weaponType) {
      // Notify of weapon type change
      emitEvent("weaponType.changed", {
        oldType: lastWeaponType,
        newType: weaponType,
      });
    }

    // Update last weapon type
    setLastWeaponType(weaponType);
  };

  const updateActionBarAbilities = () => {
    // Get current abilities from the system
    const testAbilities: Record<number, string> = {
      0: "swordSlash",
      1: "fireball",
      2: "powerShot",
    };

    setActionBarAbilities(testAbilities);
  };

  const handleAbilityDragStart = (e: React.DragEvent, ability: Ability) => {
    // Fix drag image - create image element but don't append it to DOM
    const img = new Image();
    img.src = ability.icon;

    // Set fixed size for the drag image
    img.width = 40;
    img.height = 40;

    // Set data transfer
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/ability-id", ability.id);

    // Use a small timeout to ensure image is loaded
    setTimeout(() => {
      try {
        e.dataTransfer.setDragImage(img, 20, 20);
      } catch (error) {
        console.error("Failed to set drag image:", error);
      }
    }, 10);
  };

  // Get learned spells organized by category - UPDATED to use store directly
  const getLearnedSpells = (): Record<string, Ability[]> => {
    const spellCategories: Record<string, Ability[]> = {};

    // Get learned abilities from store
    const learnedAbilityIds = getLearnedAbilities();
    const learnedAbilities = learnedAbilityIds
      .map((abilityId) => AbilityDictionary.getAbility(abilityId))
      .filter((ability): ability is Ability => ability !== null);

    if (learnedAbilities.length > 0) {
      spellCategories["Learned Abilities"] = learnedAbilities;
    }

    return spellCategories;
  };

  // Get mock abilities for a weapon type
  const getMockAbilities = (weaponType: string): Ability[] => {
    const abilityMapping: Record<string, string[]> = {
      melee: ["swordSlash", "whirlwind", "bash"],
      magic: ["fireball", "energyWave", "fireWall"],
      archery: ["powerShot", "focus", "rainOfArrows"],
    };

    const abilityIds = abilityMapping[weaponType] || [];
    return abilityIds
      .map((id) => AbilityDictionary.getAbility(id))
      .filter((ability) => ability !== null) as Ability[];
  };

  // Get weapon type from equipment
  const getWeaponType = (): string => {
    const equipment = playerCharacter.equipment;

    if (equipment.weapon) {
      // Use templateId instead of id
      if (equipment.weapon.templateId) {
        const weaponType = ItemDictionary.getWeaponType(equipment.weapon.templateId);
        if (weaponType) return weaponType;
      }
    }

    return "none";
  };

  // Get bonus abilities from equipment
  const getBonusAbilities = (): Record<string, Ability[]> => {
    const bonusAbilities: Record<string, Ability[]> = {};
    const equipment = playerCharacter.equipment;

    // Check equipment for items with bonusSkills
    Object.entries(equipment).forEach(([slot, itemInstance]) => {
      if (!itemInstance) return;

      // Get template data using templateId
      const itemData = ItemDictionary.getItem(itemInstance.templateId);

      // Check for bonusSkills on the template data
      if (itemData && itemData.bonusSkills && Array.isArray(itemData.bonusSkills)) {
        // For each bonus skill, try to get the ability
        itemData.bonusSkills.forEach((abilityId: string) => {
          const ability = AbilityDictionary.getAbility(abilityId);
          if (ability) {
            // Use the item name as the key
            const itemName = itemData.name || "Unknown Item";

            // Initialize array if it doesn't exist
            if (!bonusAbilities[itemName]) {
              bonusAbilities[itemName] = [];
            }

            // Add the ability to the array
            bonusAbilities[itemName].push(ability);
          }
        });
      }
    });

    return bonusAbilities;
  };

  if (!visible) {
    return null;
  }

  const weaponType = getWeaponType();
  const weaponAbilities = getMockAbilities(weaponType);
  const bonusAbilities = getBonusAbilities();
  const learnedSpells = getLearnedSpells();

  // Check if we have any content to show
  const hasWeaponAbilities = weaponType !== "none" && weaponAbilities.length > 0;
  const hasBonusAbilities = Object.keys(bonusAbilities).length > 0;
  const hasSpells = Object.keys(learnedSpells).length > 0;
  const hasAnyContent = hasWeaponAbilities || hasBonusAbilities || hasSpells;

  return (
    <div className="abilities-interface-container">
      <div className="abilities-header">Abilities & Spells</div>
      <div className="abilities-content">
        {/* Weapon Abilities */}
        {hasWeaponAbilities && (
          <AbilityCategory
            categoryName={`${weaponType.charAt(0).toUpperCase() + weaponType.slice(1)} Abilities`}
            abilities={weaponAbilities}
            actionBarAbilities={actionBarAbilities}
            onDragStart={handleAbilityDragStart}
          />
        )}

        {/* Bonus Abilities from Items */}
        {Object.entries(bonusAbilities).map(([itemName, abilities]) => (
          <AbilityCategory
            key={itemName}
            categoryName={`${itemName} Abilities`}
            abilities={abilities}
            actionBarAbilities={actionBarAbilities}
            onDragStart={handleAbilityDragStart}
          />
        ))}

        {/* Spell Categories */}
        {Object.entries(learnedSpells).map(([categoryName, spells]) => (
          <AbilityCategory
            key={categoryName}
            categoryName={categoryName}
            abilities={spells}
            actionBarAbilities={actionBarAbilities}
            onDragStart={handleAbilityDragStart}
          />
        ))}

        {/* No abilities/spells message */}
        {!hasAnyContent && (
          <div className="no-abilities-message">
            No abilities or spells available. Equip a weapon, items that grant abilities, or learn
            some spells.
          </div>
        )}
      </div>
    </div>
  );
};

export default AbilityInterface;
