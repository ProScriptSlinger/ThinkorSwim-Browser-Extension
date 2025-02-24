let isActive = false;
const apiKey =
  "115b6d3609620195269ad7073eab1984f6085725649952361f7bc55fc12d340f";

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

function getLatestSharesWithPeriod(data) {
  let latestOutstandingShares = null;
  let latestPublicFloat = null;

  data.forEach((record) => {
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
  try {
    const res = await fetch(`https://api.sec-api.io/float?ticker=${ticker}`, {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    }).then((res) => res.json());
    // console.log(res.data[0].float, res.data[1].float);
    const float = getLatestSharesWithPeriod(res.data);
    return float;
  } catch (error) {
    console.error("Error fetching float data:", error);
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
          console.log(event.target.classList);
          if (event.target.classList.contains("symbol-label")) {
            const stockName = event.target.getAttribute("data-symbol");
            const floatData = await getFloatData(stockName);
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
            console.log("stockData:", stockData);
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
            console.log("newsItems:", newsItems);
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
