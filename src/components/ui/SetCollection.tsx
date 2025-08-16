import React, { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useEventBus, useEmitEvent } from "../../hooks/useEventBus";
import { ItemSets, ItemData } from "@/types";
import { ItemDictionary } from "@/services/ItemDictionaryService";
import { SET_CONFIGURATIONS, SetConfigUtils } from "../../data/setConfig"; // CHANGED: Updated import path

interface SetSlot {
  slotType: string;
  name: string;
  position: string;
  weaponType?: string;
}

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
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="set-confirmation-overlay">
      <div className="set-confirmation-dialog">
        <div className="set-confirmation-title">Confirm Item Placement</div>
        <div className="set-confirmation-message">
          Warning, placing the item here will cause you to lose access to it.
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
  const {
    setCollections,
    updateSetCollections,
    playerCharacter,
    removeItemInstanceFromInventory, // ADD: For removing items from inventory
    unlockOutfit, // ADD: For unlocking outfits
    isOutfitUnlocked, // ADD: For checking outfit status
  } = useGameStore();

  const [visible, setVisible] = useState(false);
  const [currentSetView, setCurrentSetView] = useState<ItemSets>(ItemSets.SKELETAL_SET);
  const [highlightedSlot, setHighlightedSlot] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    slotType: "",
    itemId: "",
  });
  const emitEvent = useEmitEvent();

  useEventBus("setCollection.toggle", (data: { visible: boolean }) => {
    setVisible(data.visible);
  });

  // Toggle visibility when 'L' key is pressed
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "l") {
        setVisible((prev) => !prev);

        // Emit appropriate message
        emitEvent(
          "ui.message.show",
          !visible ? "Set Collection opened. Press L to close." : "Set Collection closed."
        );

        // Emit visibility change event
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

    // If valid, highlight the slot
    if (isValidForSlot) {
      setHighlightedSlot(slotType);
    }
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    setHighlightedSlot(null);
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

    if (isValidForSlot) {
      // Show confirmation dialog
      setConfirmDialog({
        isOpen: true,
        slotType,
        itemId: itemInstance.templateId,
      });
    } else {
      emitEvent("ui.message.show", `This item cannot be placed in the ${slotType} slot.`);
    }
  };

  // MODIFY: Handle confirm dialog confirm - Updated with outfit unlocking
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

    // ADD: Check if set is now complete and unlock outfit
    const progress = SetConfigUtils.calculateSetProgress(newCollections, currentSetView);
    const config = SetConfigUtils.getSetConfig(currentSetView);

    if (progress.isComplete && config?.unlockedOutfit) {
      // Check if outfit is not already unlocked
      if (!isOutfitUnlocked(config.unlockedOutfit)) {
        // Unlock the outfit
        unlockOutfit(config.unlockedOutfit);

        // Show special completion message
        emitEvent(
          "ui.message.show",
          `🎉 ${SetConfigUtils.formatSetName(currentSetView)} set completed! Unlocked ${config.name} outfit!`
        );
      } else {
        // Set already completed
        emitEvent(
          "ui.message.show",
          `✅ ${SetConfigUtils.formatSetName(currentSetView)} set completed!`
        );
      }
    }

    // Close dialog
    setConfirmDialog({
      isOpen: false,
      slotType: "",
      itemId: "",
    });
  };

  // Handle confirm dialog cancel
  const handleConfirmDialogCancel = () => {
    setConfirmDialog({
      isOpen: false,
      slotType: "",
      itemId: "",
    });
  };

  // MODIFY: Get set bonuses using config
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

  // MODIFY: Get current set configuration
  const currentConfig = SetConfigUtils.getSetConfig(currentSetView);
  if (!currentConfig) {
    return <div>Error: Set configuration not found</div>;
  }

  // Get data for current view
  const currentCollectionItems = setCollections[currentSetView] || {};
  const progress = SetConfigUtils.calculateSetProgress(setCollections, currentSetView);
  const setBonuses = getSetBonuses();

  // ADD: Check if outfit is unlocked
  const outfitUnlocked = currentConfig.unlockedOutfit
    ? isOutfitUnlocked(currentConfig.unlockedOutfit)
    : false;

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
            {currentConfig.slots.map((slot) => (
              <SetSlotComponent
                key={`${currentSetView}-${slot.slotType}-${slot.position}`}
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
            {progress.isComplete && outfitUnlocked ? "✅ " : ""}
            Complete Set Reward: {currentConfig.name} Outfit
          </div>
          <div className="set-reward-image">
            <img
              src={`assets/outfit-preview/${currentConfig.unlockedOutfit || "skeleton-outfit"}-preview.png`}
              alt={`${currentConfig.name} Outfit`}
            />
          </div>
          {progress.isComplete && outfitUnlocked && (
            <div className="set-completed-message">
              🎉 Set Complete! Outfit Unlocked!
              <div className="outfit-hint">
                Visit the Outfits panel (Press U) to equip this outfit!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onConfirm={handleConfirmDialogConfirm}
        onCancel={handleConfirmDialogCancel}
      />
    </div>
  );
};

export default SetCollection;
