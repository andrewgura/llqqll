// Instead of:
eventBus.emit("ui.message.show", "Message");

// Consider direct call:
messageService.show("Message");
