let isActive = false;
let keyIndex = 0;
const freekeys = [
  "115b6d3609620195269ad7073eab1984f6085725649952361f7bc55fc12d340f",
  "012e9d5ed95e4a49d2f41f1c39b419c930603ee22629a37c5e0e9695ee3bc7ac",
  "8e9502223f09a852a5bc3b16ddc61cbe6639bb4f09abd4919b8312c1b4b5d5d4",
  "14bfb6c0a03a5a61885ad1cc5aaf2345e5c513033a0c4e1d4b844abf419ad082",
  "aaced2d11dff7fa8e723bf2c75a4a5796ddc63dbfe445d9234505cc6bb406a56",
  "f318012c66d52c549cfb4dba8067d9385506485563588f11b14ede93dda09ec4",
  "d04ffc0dbd24389ab038b7548812cfbc0646d9f56f25f71cbe8058fc7baf7c4e",
  "6ab4cd48247f04a66a0ebb926ec4c2d6d7647ffe2e425520505596d757611f74",
  "0ec5db2283e03269213bddfa1326ba90367f590ec85d9f8f25d4f083c861c871",
  "c999be08de72530033ba658b32fb81c597efa96ca1e56421861b478c1acd258a",
  "654ba440e470063f5f67c3bd58d720e15faa84e7a2d34ad84479a5b9efd1bb34",
  "07de4332f31691e1cbd051d36bf59613ee64bf611d9f345ea4a6711f9df6d72d",
];

const impactLevels = {
  high: {
    keywords: [
      "Earnings Beat",
      "Revenue Growth",
      "EPS Growth",
      "Guidance Upward Revision",
      "Acquisition",
      "Merger",
      "FDA Approval",
      "Breakthrough Technology",
    ],
    emoji: "🔥🔥🔥",
  },
  moderate: {
    keywords: [
      "Strategic Partnership",
      "Patent Approval",
      "Analyst Upgrade",
      "Price Target Increase",
      "Restructuring",
      "Share Buyback",
      "Revenue Growth",
    ],
    emoji: "🔥🔥",
  },
  low: {
    keywords: ["Dividend Increase", "Cost Cutting", "International Expansion"],
    emoji: "🔥",
  },
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content Action: ", message);
  if (message.action === "active") {
    console.log("Active Action: ", message.data);
    isActive = message.data;
  } else if (message.action == "news-clicked") {
    console.log("News Clicked Action: ", message.action);
    const newsCards = document.querySelectorAll('[data-testid^="news-card"]');
    const clickedNews = newsCards[message.data];
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    clickedNews.dispatchEvent(clickEvent);
    // await new Promise((resolve) => setTimeout(resolve, 300));
    const tradePage = document.getElementById("trade-page");
    tradePage.scrollTo({
      top: tradePage.scrollHeight,
      behavior: "smooth", // This enables smooth scrolling
    });
  }
});

const elementExists = async (selector, type) => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      let element;
      if (type === "news") {
        element = document.querySelectorAll(selector);
      } else {
        element = document.querySelector(selector);
      }
      if (element) {
        clearInterval(interval);
        resolve(element);
      }
    }, 100); // Check every 100 milliseconds
  });
};

// get float

function getLatestSharesWithPeriod({ data }) {
  let latestOutstandingShares = null;
  let latestPublicFloat = null;

  data?.forEach((record) => {
    const outstandingShares = record.float.outstandingShares[0];
    const publicFloat = record.float.publicFloat[0];

    if (
      outstandingShares &&
      (!latestOutstandingShares ||
        new Date(outstandingShares.period) >
          new Date(latestOutstandingShares.period))
    ) {
      latestOutstandingShares = outstandingShares;
    }

    if (
      publicFloat &&
      (!latestPublicFloat ||
        new Date(publicFloat.period) > new Date(latestPublicFloat.period))
    ) {
      latestPublicFloat = publicFloat;
    }
  });
  console.log("latestOutstandingShares", latestOutstandingShares);
  return {
    latestOutstandingShares: latestOutstandingShares
      ? {
          value: latestOutstandingShares.value,
          period: latestOutstandingShares.period,
        }
      : null,
    latestPublicFloat: latestPublicFloat
      ? {
          value: latestPublicFloat.value,
          period: latestPublicFloat.period,
        }
      : null,
  };
}

async function getFloatData(ticker) {
  let attempt = 0;
  const maxAttempts = freekeys.length;
  while (attempt < maxAttempts) {
    try {
      const apiKey = freekeys[keyIndex];
      const response = await fetch(
        `https://api.sec-api.io/float?ticker=${ticker}`,
        {
          method: "GET",
          headers: {
            Authorization: apiKey,
          },
        }
      );
      if (response.status === 429) {
        console.warn("Received 429 status, switching API key");
        keyIndex = (keyIndex + 1) % freekeys.length;
        attempt++;
        continue;
      }
      const floatData = getLatestSharesWithPeriod(await response.json());
      return floatData;
    } catch (error) {
      console.error("Error fetching float data:", error);
      return null;
    }
  }
}

function addTableClickListener() {
  if (isActive == true) {
    const tableStocks = document.querySelectorAll(
      "section[data-testid='left-pane']"
    );
    if (tableStocks.length > 0) {
      tableStocks.forEach((tableStock) => {
        tableStock.addEventListener("click", async (event) => {
          if (event.target.classList.contains("symbol-label")) {
            const stockName = event.target.getAttribute("data-symbol");
            const floatData = await getFloatData(stockName);
            console.log("floatData ----->", floatData);
            const trendNumEle = await elementExists(
              '.mark__amount [data-testid="trending-number"] > span'
            );
            const trendNum = trendNumEle?.textContent || trendNumEle?.innerText;
            const trendType = document
              .querySelector('.mark__amount [data-testid="trending-number"]')
              ?.getAttribute("class");
            const numValEle = document.querySelector(
              'span.mark__change [data-testid="sign-color-value"] [data-testid="num-val"]'
            );
            const numVal = numValEle?.textContent || numValEle?.innerText;
            const numType = numValEle?.getAttribute("class");
            const percentValEle = document.querySelector(
              'span.mark__change [data-testid="sign-color-value"] [data-testid="percent-value"]'
            );

            const percentVal =
              percentValEle?.textContent || percentValEle?.innerText;
            const percentValType = percentValEle?.getAttribute("class");

            const companyEle = document.querySelector(
              ".description-wrapper > p"
            );
            const companyName =
              companyEle?.textContent || companyEle?.innerText;
            const industryEle = document.querySelector(
              'h2[data-testid="watchlists-initial-dropdown"]'
            );
            const industryName =
              industryEle?.textContent || industryEle?.innerText;

            const stockEle = document.querySelector(".stock_field .value");
            const stockPrice = stockEle?.textContent || stockEle?.innerText;

            const stockData = {
              stockName: stockName,
              trendNum: { val: trendNum, type: trendType },
              numVal: { val: numVal, type: numType },
              percenVal: { val: percentVal, type: percentValType },
              companyName: companyName,
              industryName: industryName,
              stockPrice: stockPrice,
              floatData: floatData,
            };
            chrome.runtime.sendMessage({
              action: "clicked-stock",
              data: stockData,
            });

            await elementExists('span[data-testid="loading-symbol-news"]');
            await new Promise((resolve) => setTimeout(resolve, 2500));
            const newsCards = document.querySelectorAll(
              '[data-testid^="news-card"]'
            );
            const newsItems = [];
            newsCards?.forEach((card) => {
              try {
                let emojiToAdd = "";
                // await new Promise((resolve) => setTimeout(resolve, 100));
                const titleElement = card.querySelector("h4");
                const titleText = titleElement ? titleElement.textContent : "";
                for (const keyword of impactLevels.high.keywords) {
                  if (titleText.includes(keyword)) {
                    emojiToAdd = impactLevels.high.emoji;
                    break;
                  }
                }
                if (!emojiToAdd) {
                  for (const keyword of impactLevels.moderate.keywords) {
                    if (titleText.includes(keyword)) {
                      emojiToAdd = impactLevels.moderate.emoji;
                      break;
                    }
                  }
                }
                if (!emojiToAdd) {
                  for (const keyword of impactLevels.low.keywords) {
                    if (titleText.includes(keyword)) {
                      emojiToAdd = impactLevels.low.emoji;
                      break;
                    }
                  }
                }
                const timeElement = card.querySelector("time");
                const time = timeElement
                  ? timeElement.getAttribute("datetime")
                  : "";
                newsItems.push({ titleText, time, emojiToAdd });
              } catch (error) {
                console.log("news error: ", error);
              }
            });
            chrome.runtime.sendMessage({
              action: "news-loaded",
              data: newsItems,
            });
          }
        });
      });

      observer.disconnect();
    }
  }
}

const observer = new MutationObserver(addTableClickListener);

observer.observe(document.body, { childList: true, subtree: true });

addTableClickListener();
