import React, { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useEventBus, useEmitEvent } from "../../hooks/useEventBus";
import { ItemSets, ItemData } from "@/types";
import { ItemDictionary } from "@/services/ItemDictionaryService";
import { SetSlot, SetConfigUtils } from "@/data/setConfig";

interface SetSlotProps {
  setType: ItemSets;
  slotInfo: SetSlot;
  itemId: string;
  isHighlighted: boolean;
  onDrop: (e: React.DragEvent, slotType: string) => void;
  onDragOver: (e: React.DragEvent, slotType: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
}

const SetSlotComponent: React.FC<SetSlotProps> = ({
  setType,
  slotInfo,
  itemId,
  isHighlighted,
  onDrop,
  onDragOver,
  onDragLeave,
}) => {
  const isEmpty = !itemId;

  // Get item data and image if not empty
  let itemImageUrl = "";
  if (!isEmpty) {
    const itemData = ItemDictionary.getItem(itemId);
    if (itemData?.texture) {
      const folder = ItemDictionary.getItemFolder(itemData);
      itemImageUrl = `assets/equipment/${folder}/${itemData.texture}.png`;
    }
  }

  const slotClasses = `set-slot ${isEmpty ? "empty" : ""} ${isHighlighted ? "highlight-slot" : ""}`;

  return (
    <div className="set-slot-container" style={{ gridArea: slotInfo.position }}>
      <div
        className={slotClasses}
        data-set-type={setType}
        data-slot-type={slotInfo.slotType}
        data-weapon-type={slotInfo.weaponType || ""}
        data-item-id={itemId}
        onDragOver={(e) => onDragOver(e, slotInfo.slotType)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, slotInfo.slotType)}
        style={{
          backgroundImage: itemImageUrl ? `url(${itemImageUrl})` : "none",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />
      <div className="set-slot-name">{slotInfo.name}</div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemName?: string;
  slotName?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  itemName = "",
  slotName = "",
}) => {
  if (!isOpen) return null;

  return (
    <div className="set-confirmation-overlay">
      <div className="set-confirmation-dialog">
        <div className="set-confirmation-title">Confirm Item Placement</div>
        <div className="set-confirmation-message">
          Place <strong>{itemName}</strong> in the <strong>{slotName}</strong> slot?
          <br />
          <em>Warning: This will permanently remove the item from your inventory.</em>
        </div>
        <div className="set-confirmation-buttons">
          <button className="set-confirm-button" onClick={onConfirm}>
            Confirm
          </button>
          <button className="set-cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const SetCollection: React.FC = () => {
  const { setCollections, updateSetCollections, playerCharacter, removeItemInstanceFromInventory } =
    useGameStore();

  const [visible, setVisible] = useState(false);
  const [currentSetView, setCurrentSetView] = useState<ItemSets>(ItemSets.SKELETAL_SET);
  const [highlightedSlot, setHighlightedSlot] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    slotType: "",
    itemId: "",
    itemName: "",
    slotName: "",
  });
  const emitEvent = useEmitEvent();

  // Listen for toggle events
  useEventBus("setCollection.toggle", (data: { visible: boolean }) => {
    setVisible(data.visible);
  });

  // Toggle visibility when 'L' key is pressed
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "l") {
        setVisible((prev) => !prev);
        emitEvent(
          "ui.message.show",
          !visible ? "Set Collection opened. Press L to close." : "Set Collection closed."
        );
        emitEvent("setCollection.visibility.changed", !visible);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [visible, emitEvent]);

  // Close the collection
  const handleClose = () => {
    setVisible(false);
    emitEvent("ui.message.show", "Set Collection closed.");
    emitEvent("setCollection.visibility.changed", false);
  };

  // Change the current set view
  const handleSetChange = (setType: ItemSets) => {
    setCurrentSetView(setType);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, slotType: string) => {
    e.preventDefault();

    // Get item data from dataTransfer
    const itemInstanceId = e.dataTransfer.getData("text/plain");
    if (!itemInstanceId) return;

    // Get the item instance and its template data
    const itemInstance = playerCharacter.inventory.find(
      (item) => item.instanceId === itemInstanceId
    );
    if (!itemInstance) return;

    const itemData = ItemDictionary.getItem(itemInstance.templateId);
    if (!itemData) return;

    // Check if the item is valid for this slot using the config
    const isValidForSlot = SetConfigUtils.canItemGoInSlot(
      itemInstance.templateId,
      slotType,
      currentSetView,
      itemData
    );

    // Also check if this specific slot type and weapon type match (for weapon slots)
    let isValidWeaponType = true;
    if (slotType === "weapon") {
      const config = SetConfigUtils.getSetConfig(currentSetView);
      const slot = config?.slots.find(
        (s) => s.slotType === slotType && s.weaponType === itemData.weaponType
      );
      isValidWeaponType = !!slot;
    }

    // If valid, highlight the slot
    if (isValidForSlot && isValidWeaponType) {
      setHighlightedSlot(slotType);
    }
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear highlight if we're actually leaving the slot
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setHighlightedSlot(null);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, slotType: string) => {
    e.preventDefault();
    setHighlightedSlot(null);

    // Get item data from dataTransfer
    const itemInstanceId = e.dataTransfer.getData("text/plain");
    if (!itemInstanceId) return;

    // Get the item instance and its template data
    const itemInstance = playerCharacter.inventory.find(
      (item) => item.instanceId === itemInstanceId
    );
    if (!itemInstance) {
      emitEvent("ui.message.show", "Item not found in inventory.");
      return;
    }

    const itemData = ItemDictionary.getItem(itemInstance.templateId);
    if (!itemData) {
      emitEvent("ui.message.show", "Invalid item data.");
      return;
    }

    // Check if the item is valid for this slot using the config
    const isValidForSlot = SetConfigUtils.canItemGoInSlot(
      itemInstance.templateId,
      slotType,
      currentSetView,
      itemData
    );

    if (!isValidForSlot) {
      emitEvent("ui.message.show", `${itemData.name} cannot be placed in the ${slotType} slot.`);
      return;
    }

    // For weapon slots, check weapon type compatibility
    if (slotType === "weapon") {
      const config = SetConfigUtils.getSetConfig(currentSetView);
      const slot = config?.slots.find(
        (s) => s.slotType === slotType && s.weaponType === itemData.weaponType
      );

      if (!slot) {
        emitEvent(
          "ui.message.show",
          `${itemData.name} (${itemData.weaponType}) doesn't match any available weapon slots.`
        );
        return;
      }
    }

    // Check if slot is already occupied
    const currentCollectionItems = setCollections[currentSetView] || {};
    if (currentCollectionItems[slotType] && currentCollectionItems[slotType] !== "") {
      emitEvent("ui.message.show", `The ${slotType} slot is already occupied.`);
      return;
    }

    // Show confirmation dialog
    const config = SetConfigUtils.getSetConfig(currentSetView);
    const slotInfo = config?.slots.find((s) => s.slotType === slotType);

    setConfirmDialog({
      isOpen: true,
      slotType,
      itemId: itemInstance.templateId,
      itemName: itemData.name,
      slotName: slotInfo?.name || slotType,
    });
  };

  // Handle confirm dialog confirm
  const handleConfirmDialogConfirm = () => {
    const { slotType, itemId } = confirmDialog;

    // Find the item instance in inventory
    const itemInstance = playerCharacter.inventory.find((item) => item.templateId === itemId);
    if (!itemInstance) {
      emitEvent("ui.message.show", "Item no longer found in inventory.");
      handleConfirmDialogCancel();
      return;
    }

    // Remove item from inventory first
    const removalSuccess = removeItemInstanceFromInventory(itemInstance.instanceId);
    if (!removalSuccess) {
      emitEvent("ui.message.show", "Failed to remove item from inventory.");
      handleConfirmDialogCancel();
      return;
    }

    // Add item to set collection
    const newCollections = { ...setCollections };
    if (!newCollections[currentSetView]) {
      newCollections[currentSetView] = {};
    }

    newCollections[currentSetView][slotType] = itemId;
    updateSetCollections(newCollections);

    // Get item name for message
    const item = ItemDictionary.getItem(itemId);
    if (item) {
      emitEvent(
        "ui.message.show",
        `Added ${item.name} to ${SetConfigUtils.formatSetName(currentSetView)} collection.`
      );
    }

    // Check if set is now complete
    const progress = SetConfigUtils.calculateSetProgress(newCollections, currentSetView);
    if (progress.isComplete) {
      emitEvent(
        "ui.message.show",
        `🎉 ${SetConfigUtils.formatSetName(currentSetView)} set completed!`
      );
      // TODO: Unlock outfit when outfit system is implemented
    }

    // Close dialog
    setConfirmDialog({
      isOpen: false,
      slotType: "",
      itemId: "",
      itemName: "",
      slotName: "",
    });
  };

  // Handle confirm dialog cancel
  const handleConfirmDialogCancel = () => {
    setConfirmDialog({
      isOpen: false,
      slotType: "",
      itemId: "",
      itemName: "",
      slotName: "",
    });
  };

  // Get set bonuses with activation status
  const getSetBonuses = () => {
    const config = SetConfigUtils.getSetConfig(currentSetView);
    if (!config) return [];

    const progress = SetConfigUtils.calculateSetProgress(setCollections, currentSetView);

    return config.setBonuses.map((bonusInfo) => {
      const isActive = progress.collectedCount >= bonusInfo.items;
      return {
        ...bonusInfo,
        isActive,
      };
    });
  };

  if (!visible) {
    return null;
  }

  // Get current set configuration
  const currentConfig = SetConfigUtils.getSetConfig(currentSetView);
  if (!currentConfig) {
    return <div>Error: Set configuration not found</div>;
  }

  // Get data for current view
  const currentCollectionItems = setCollections[currentSetView] || {};
  const progress = SetConfigUtils.calculateSetProgress(setCollections, currentSetView);
  const setBonuses = getSetBonuses();

  return (
    <div className="set-collection-container">
      <div className="set-collection-header">
        <h2>Set Collection</h2>
        <button className="close-button" onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className="set-tabs">
        {Object.values(ItemSets).map((setType) => (
          <div
            key={setType}
            className={`set-tab ${setType === currentSetView ? "active" : ""}`}
            data-set-type={setType}
            onClick={() => handleSetChange(setType as ItemSets)}
          >
            {SetConfigUtils.formatSetName(setType)}
          </div>
        ))}
      </div>

      <div className="set-content">
        <div className="set-slots-panel">
          <div className="set-slots-grid">
            {currentConfig.slots.map((slot, index) => (
              <SetSlotComponent
                key={`${currentSetView}-${slot.slotType}-${slot.position}-${index}`}
                setType={currentSetView}
                slotInfo={slot}
                itemId={currentCollectionItems[slot.slotType] || ""}
                isHighlighted={highlightedSlot === slot.slotType}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="set-bonuses-panel">
        <div className="set-bonuses-header">
          <div className="set-progress">
            Set Progress: {progress.collectedCount}/{progress.totalSlots}
            {progress.requiredForCompletion < progress.totalSlots && (
              <span className="completion-requirement">
                {" "}
                (Need {progress.requiredForCompletion} to complete)
              </span>
            )}
          </div>
        </div>

        <div className="set-bonuses-content">
          <div className="item-bonuses-list">
            {Object.entries(currentConfig.itemBonuses).map(([itemId, bonusInfo], index) => {
              const itemData = ItemDictionary.getItem(itemId);
              const isCollected = Object.values(currentCollectionItems).includes(itemId);

              return (
                <div
                  key={index}
                  className={`item-bonus ${isCollected ? "collected" : "not-collected"}`}
                >
                  <div className="item-bonus-icon">{isCollected ? "✓" : "○"}</div>
                  <div className="item-bonus-text">
                    {itemData?.name}: +{bonusInfo.value}{" "}
                    {SetConfigUtils.formatBonusType(bonusInfo.bonus)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="set-reward-section">
          <div className="set-reward-title">
            {progress.isComplete ? "✅ " : ""}
            Complete Set Reward: {currentConfig.name} Outfit
          </div>
          <div className="set-reward-image">
            <img
              src={`assets/outfit-preview/${currentConfig.unlockedOutfit || "skeleton-outfit"}-preview.png`}
              alt={`${currentConfig.name} Outfit`}
            />
          </div>
          {progress.isComplete && (
            <div className="set-completed-message">🎉 Set Complete! Outfit Unlocked!</div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onConfirm={handleConfirmDialogConfirm}
        onCancel={handleConfirmDialogCancel}
        itemName={confirmDialog.itemName}
        slotName={confirmDialog.slotName}
      />
    </div>
  );
};

export default SetCollection;
