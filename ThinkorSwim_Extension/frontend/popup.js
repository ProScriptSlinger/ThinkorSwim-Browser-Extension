try {
  let startBtn, stockQuote, waitingEle, moreButton;
  stockData = "__";
  function setStartBtnStyle(isActive) {
    startBtn.textContent = !isActive ? "Stop" : "Start";
    startBtn.style.backgroundColor = !isActive ? "#B22A3A" : "green";
  }
  document.addEventListener("DOMContentLoaded", function () {
    startBtn = document.getElementById("start-btn");
    stockQuote = document.getElementById("i-stock-info");
    loadingEle = document.getElementById("i-loading");
    waitingEle = document.getElementById("i-waiting");
    moreButton = document.getElementById("moreButton");

    const newsList = document.getElementById("newsList");

    moreButton.addEventListener("click", () => {
      const hiddenItems = newsList.querySelectorAll(
        'li[style*="display: none"]'
      );
      hiddenItems.forEach((item) => {
        item.style.display = "block"; // Show the hidden items
      });
      const hiddenSLs = newsList.querySelectorAll('hr[style*="display: none"]');
      hiddenSLs.forEach((item) => {
        item.style.display = "block"; // Show the hidden items
      });
      moreButton.style.display = "none"; // Hide the "More" button after showing all items
    });

    startBtn.addEventListener("click", async () => {
      const isActive = startBtn.textContent == "Start" ? false : true;
      setStartBtnStyle(isActive);
      startBtn.textContent = !isActive ? "Stop" : "Start";
      startBtn.style.backgroundColor = !isActive ? "#B22A3A" : "green";
      chrome.runtime.sendMessage({ action: "active", data: !isActive });
    });

    newsList.addEventListener("click", (e) => {
      const newsId = e.target.getAttribute("id");
      chrome.runtime.sendMessage({ action: "news-clicked", data: newsId });
    });
  });

  function formatCurrentDate() {
    // Create a new Date object for the current date and time
    const now = new Date();

    // Define an array of month names
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Get the components of the date
    const month = monthNames[now.getMonth()]; // Get month name
    const day = now.getDate(); // Get day of the month
    const year = now.getFullYear(); // Get full year
    const hours = now.getHours(); // Get hours
    const minutes = String(now.getMinutes()).padStart(2, "0"); // Get minutes
    const seconds = String(now.getSeconds()).padStart(2, "0"); // Get seconds

    // Determine if it's AM or PM
    const ampm = hours >= 12 ? "pm" : "am";

    // Convert hours to 12-hour format
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format

    // Format the final date string
    const formattedDate = `${month} ${day}, ${year} at ${formattedHours}:${minutes}:${seconds} ${ampm} ET`;

    return formattedDate;
  }

  function disableAllElements() {
    startBtn.style.display = "none";
    stockQuote.style.display = "none";
    loadingEle.style.display = "none";
    waitingEle.style.display = "none";
  }

  function formatNumber(num) {
    try {
      if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + "M";
      } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + "K";
      }
      return num?.toFixed(2);
    } catch (error) {
      console.log("formatNumber error:", error);
      return "";
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "update-stock") {
      const objectKeys = ["trendNum", "numVal", "percenVal"];
      const keys = Object.keys(message.data);
      console.log("message.data", message.data);
      keys.forEach((key) => {
        if (key == "floatData") {
          const floatEle = document.getElementById("publicFloat");
          const osEle = document.getElementById("outstandingShares");
          floatEle.textContent = message.data[key]?.latestPublicFloat?.value
            ? `${formatNumber(
                message.data[key]?.latestPublicFloat?.value || ""
              )} ${message.data.stockName},  ${
                message.data[key]?.latestPublicFloat?.period || ""
              }`
            : "---";
          osEle.textContent = message.data[key]?.latestOutstandingShares?.value
            ? `${formatNumber(
                message.data[key]?.latestOutstandingShares?.value || ""
              )} ${message.data.stockName}, ${
                message.data[key]?.latestOutstandingShares?.period || ""
              }`
            : "---";
        } else {
          const element = document.getElementById(key);
          if (element) {
            if (objectKeys.includes(key)) {
              element.textContent = message.data[key].val;
              element.style.color =
                message.data[key].type == "negative" ? "#FF3333" : "#40A829";
            } else {
              element.textContent = message.data[key];
            }
          }
        }
      });
      const newsList = document.getElementById("newsList");
      newsList.innerHTML = "No News";
      const currentDate = formatCurrentDate();
      document.getElementById("lastUpdated").textContent = currentDate;

      disableAllElements();
      stockQuote.style.display = "block";
    } else if (message.action == "news-loaded") {
      const newsItems = message.data;
      const newsList = document.getElementById("newsList");
      newsList.innerHTML = "";
      newsItems.forEach((item, index) => {
        const listItem = document.createElement("li"); // Create a new <li> element
        const newsLink = document.createElement("a");
        const hr = document.createElement("hr");
        // newsLink.href = "#";
        newsLink.id = index;
        newsLink.className = "news-link";
        newsLink.textContent = `${item.emojiToAdd} ${item.titleText} (${item.time})`;
        listItem.appendChild(newsLink);
        newsList.appendChild(listItem);
        newsList.appendChild(hr);
        if (index >= 3) {
          listItem.style.display = "none"; // Hide the item
          hr.style.display = "none";
        }
      });
      if (newsItems.length > 3) {
        moreButton.style.display = "block"; // Show the button
      }
    } else if (message.action === "extension-clicked") {
      disableAllElements();
      startBtn.style.display = "block";
    } else if (message.action === "is-loading") {
      // setStartBtnStyle(message.data);
      disableAllElements();
      loadingEle.style.display = "block";
    } else if (message.action == "is-waiting") {
      disableAllElements();
      waitingEle.style.display = "block";
    }
  });
} catch (error) {
  console.log("popup error: ", error);
}
