// scripts/ingest-trends.js

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const STATE_CODES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

// Matching your app's data folder
const OUTPUT_DIR = "public/data/states";

// Make sure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeState(page, stateCode) {
  const url = `https://trends.google.com/trending?geo=US-${stateCode}&hl=en-US&category=10`;

  console.log(`\n=== Scraping ${stateCode} ===`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

  // Wait for the main Trending container
  try {
    await page.waitForSelector("div.trending-item", { timeout: 8000 });
  } catch {
    console.warn(`No trending items found for ${stateCode}`);
    return null;
  }

  // Extract trending items
  const items = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("div.trending-item"));
    return nodes.map(node => {
      const title = node.querySelector(".title")?.innerText || "";

      const searchVolume =
        node.querySelector(".search-count-title")?.innerText.trim() || "";

      const started =
        node.querySelector(".trend-time")?.innerText.trim() || "";

      const relatedQueries = Array.from(
        node.querySelectorAll(".related-queries .related-query")
      ).map(el => el.innerText.trim());

      return {
        name: title,
        searchVolume,
        started,
        relatedQueries,
        relevanceScore: 0, // computed later
        category: "Law and Government",
      };
    });
  });

  return items;
}

function computeRelevanceScore(item) {
  // Convert “5 hours ago”, “1 day ago”
  let started = item.started.toLowerCase();
  let hoursScore = 0;

  if (started.includes("hour")) {
    const num = parseInt(started);
    hoursScore = Math.max(0, 100 - num * 4);
  } else if (started.includes("day")) {
    const num = parseInt(started);
    hoursScore = Math.max(0, 100 - num * 25);
  } else {
    hoursScore = 40; // fallback for unknown formats
  }

  // Search volume score (“1K+” → 100, “200+” → 20)
  let volScore = 0;
  const vol = item.searchVolume.replace("+", "");
  if (vol.toLowerCase().includes("k")) {
    volScore = parseInt(vol) * 10;
  } else if (!isNaN(parseInt(vol))) {
    volScore = parseInt(vol);
  }

  volScore = Math.min(volScore, 100);

  return Math.round(hoursScore * 0.7 + volScore * 0.3);
}

async function main() {
  console.log("Launching browser…");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const timestamp = new Date().toISOString();

  for (const code of STATE_CODES) {
    try {
      const results = await scrapeState(page, code);

      if (!results || results.length === 0) {
        console.warn(`No data for ${code}`);
        continue;
      }

      // Compute relevance score + pick top 10
      const enriched = results.map(item => ({
        ...item,
        relevanceScore: computeRelevanceScore(item),
      }));

      const sorted = enriched
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10);

      const topTopic = sorted[0]?.name || "";

      const out = {
        timestamp,
        states: [
          {
            name: code,      // frontend matches this against GeoJSON name
            code,
            category: "Law and Government",
            topTopic,
            trendingScore: sorted[0]?.relevanceScore || 0,
            topics: sorted,
          },
        ],
      };

      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${code}.json`),
        JSON.stringify(out, null, 2)
      );

      console.log(`Saved → ${OUTPUT_DIR}/${code}.json`);
    } catch (err) {
      console.error(`Error scraping ${code}:`, err);
    }

    // Delay between states to avoid rate limits
    await delay(5000);
  }

  console.log("\nDone. Closing browser.");
  await browser.close();
}

main();
