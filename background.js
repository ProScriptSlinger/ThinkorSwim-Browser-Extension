function createOrFocusPopup() {
  const popupURL = chrome.runtime.getURL("frontend/popup.html");

  // Query current windows
  chrome.windows.getAll({ populate: true }, (windows) => {
    let popupWindow = null;

    // Check for a window with the specific URL
    for (let window of windows) {
      for (let tab of window.tabs) {
        if (tab.url === popupURL) {
          popupWindow = window;
          break;
        }
      }
      if (popupWindow) break;
    }

    if (popupWindow) {
      // If found, focus on the existing window
      chrome.windows.update(popupWindow.id, { focused: true });
    } else {
      // Otherwise, create a new window
      chrome.windows.create(
        {
          url: popupURL,
          type: "popup",
          width: 430,
          height: 540,
        },
        (newWindow) => {
          // Save window ID for future reference
          openedWindows[newWindow.id] = true;
        }
      );
    }
  });
}

let activeTabId;

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "clicked-stock") {
    createOrFocusPopup();
    await new Promise((resolve) => setTimeout(resolve, 10));
    chrome.runtime.sendMessage({
      action: "is-loading",
      data: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    chrome.runtime.sendMessage({
      action: "update-stock",
      data: message.data,
    });
  } else if (message.action == "active") {
    console.log("Action: ", message);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      activeTabId = tabs[0]?.id;
      chrome.tabs.sendMessage(tabs[0]?.id, message);
    });
  } else {
    chrome.tabs.sendMessage(activeTabId, message);
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (openedWindows[windowId]) {
    delete openedWindows[windowId];
  }
});
