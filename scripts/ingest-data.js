import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import fs from "fs";

async function fetchRSS() {
  const url = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US";

  try {
    const response = await fetch(url);
    const xmlText = await response.text();

    const parser = new XMLParser();
    const data = parser.parse(xmlText);

    console.log("RSS Data Loaded!");
    return data;
  } catch (err) {
    console.error("RSS fetch error:", err);
  }
}

async function main() {
  const rssData = await fetchRSS();

  // List of known US states with abbreviations
  const US_STATES = [
    { name: 'Alabama', code: 'AL' }, { name: 'Alaska', code: 'AK' }, { name: 'Arizona', code: 'AZ' },
    { name: 'Arkansas', code: 'AR' }, { name: 'California', code: 'CA' }, { name: 'Colorado', code: 'CO' },
    { name: 'Connecticut', code: 'CT' }, { name: 'Delaware', code: 'DE' }, { name: 'Florida', code: 'FL' },
    { name: 'Georgia', code: 'GA' }, { name: 'Hawaii', code: 'HI' }, { name: 'Idaho', code: 'ID' },
    { name: 'Illinois', code: 'IL' }, { name: 'Indiana', code: 'IN' }, { name: 'Iowa', code: 'IA' },
    { name: 'Kansas', code: 'KS' }, { name: 'Kentucky', code: 'KY' }, { name: 'Louisiana', code: 'LA' },
    { name: 'Maine', code: 'ME' }, { name: 'Maryland', code: 'MD' }, { name: 'Massachusetts', code: 'MA' },
    { name: 'Michigan', code: 'MI' }, { name: 'Minnesota', code: 'MN' }, { name: 'Mississippi', code: 'MS' },
    { name: 'Missouri', code: 'MO' }, { name: 'Montana', code: 'MT' }, { name: 'Nebraska', code: 'NE' },
    { name: 'Nevada', code: 'NV' }, { name: 'New Hampshire', code: 'NH' }, { name: 'New Jersey', code: 'NJ' },
    { name: 'New Mexico', code: 'NM' }, { name: 'New York', code: 'NY' }, { name: 'North Carolina', code: 'NC' },
    { name: 'North Dakota', code: 'ND' }, { name: 'Ohio', code: 'OH' }, { name: 'Oklahoma', code: 'OK' },
    { name: 'Oregon', code: 'OR' }, { name: 'Pennsylvania', code: 'PA' }, { name: 'Rhode Island', code: 'RI' },
    { name: 'South Carolina', code: 'SC' }, { name: 'South Dakota', code: 'SD' }, { name: 'Tennessee', code: 'TN' },
    { name: 'Texas', code: 'TX' }, { name: 'Utah', code: 'UT' }, { name: 'Vermont', code: 'VT' },
    { name: 'Virginia', code: 'VA' }, { name: 'Washington', code: 'WA' }, { name: 'West Virginia', code: 'WV' },
    { name: 'Wisconsin', code: 'WI' }, { name: 'Wyoming', code: 'WY' }
  ];

  // Helper: Law/Gov keywords to identify/score topics (expandable)
  const LAW_GOV_KEYWORDS = [
    "law", "government", "politics", "election", "congress", "supreme court",
    "senate", "house", "governor", "mayor", "vote", "voting", "constitution",
    "legislation", "bill", "policy", "reform", "court", "legal", "rights"
  ];

  // Helper: Map state names and codes to lowercase for matching
  const STATE_NAME_CODE_MAP = US_STATES.map(({ name, code }) => {
    return {
      name, code,
      nameLower: name.toLowerCase(),
      codeLower: code.toLowerCase()
    }
  });

  // Ensure output directory exists
  const DATA_DIR = "public/data/states";
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Flatten items (Google RSS format might vary)
  // Expected path: rssData.rss.channel.item
  const items = (rssData && rssData.rss && rssData.rss.channel && rssData.rss.channel.item)
    ? rssData.rss.channel.item
    : [];

  // Convert single item to array if necessary
  const topicItems = Array.isArray(items) ? items : items ? [items] : [];

  // Prepare per-state topic dictionary
  const statesData = {};
  US_STATES.forEach(({ name, code }) => {
    statesData[code] = {
      name,
      code,
      category: "Law and Government",
      topics: []
    }
  });

  // Helper for estimating topic relevance (score out of 100)
  function estimateRelevance(item, now = Date.now()) {
    // Recency: Newer = higher score
    let date = Date.parse(item.pubDate);
    if (isNaN(date)) date = now;
    const hoursSince = (now - date) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 100 - Math.floor(hoursSince * 2)); // lose 2pts per hour

    // Keyword frequency in title + description
    const txt = `${item.title ?? ""} ${(item.description ?? "")}`.toLowerCase();
    let freq = 0;
    LAW_GOV_KEYWORDS.forEach(kw => {
      if (txt.includes(kw)) freq += 1;
    });
    const keywordScore = Math.min(100, freq * 12); // cap at 100

    // Weighted relevance: 70% recency, 30% keyword
    return Math.round(recencyScore * 0.7 + keywordScore * 0.3);
  }

  // Helper: Guess state(s) by matching state names/codes in title/desc (could be improved)
  function guessStates(item) {
    const txt = `${item.title ?? ""} ${(item.description ?? "")}`.toLowerCase();
    // Look for explicit state mention
    const matched = STATE_NAME_CODE_MAP.filter(({ nameLower, codeLower }) =>
      txt.includes(nameLower) || txt.includes(codeLower)
    );
    if (matched.length > 0) return matched.map(s => s.code);

    // Fallback: If no state matched, assign to all (for natl. topics)
    return US_STATES.map(s => s.code);
  }

  // Filter, process, and group topics by state
  const now = Date.now();
  // Accept if topic is "Law and Government" — if not available, use keyword search
  function isLawAndGov(item) {
    if (item.category) {
      if (typeof item.category === 'string') {
        return item.category.toLowerCase().includes('law') || item.category.toLowerCase().includes('government');
      }
      if (Array.isArray(item.category)) {
        return item.category.some(cat =>
          cat.toLowerCase().includes('law') || cat.toLowerCase().includes('government')
        );
      }
    }
    // Fallback: keyword check in title/desc
    const txt = `${item.title ?? ""} ${(item.description ?? "")}`.toLowerCase();
    return LAW_GOV_KEYWORDS.some(kw => txt.includes(kw));
  }

  for (const item of topicItems) {
    if (!isLawAndGov(item)) continue;

    const title = item.title || "";
    const relevanceScore = estimateRelevance(item, now);

    // Only include highly relevant topics
    if (relevanceScore < 40) continue;

    const topic = {
      name: title,
      relevanceScore,
      category: "Law and Government"
    };

    // Assign to one or more states
    const stateCodes = guessStates(item);

    for (const code of stateCodes) {
      statesData[code].topics.push({ ...topic });
    }
  }

  // Normalize and sort topics, pick top topic for each state
  const timestamp = new Date().toISOString();
  for (const { code } of US_STATES) {
    let topics = statesData[code].topics;
    // Sort topics descending relevance, dedupe by name
    topics = topics
      .reduce((acc, curr) => {
        if (!acc.find(t => t.name === curr.name)) acc.push(curr);
        return acc;
      }, [])
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Cap at top 10 topics
    statesData[code].topics = topics.slice(0, 10);

    // Top topic
    const topTopicObj = statesData[code].topics[0];
    statesData[code].topTopic = topTopicObj ? topTopicObj.name : "";
    statesData[code].trendingScore = topTopicObj ? topTopicObj.relevanceScore : 0;
    statesData[code].timestamp = timestamp;
  }

  // Save one JSON file per state, matching required structure
  for (const { code } of US_STATES) {
    const out = {
      timestamp: statesData[code].timestamp,
      states: [statesData[code]]
    };
    fs.writeFileSync(
      `${DATA_DIR}/${code}.json`,
      JSON.stringify(out, null, 2)
    );
    console.log(`Wrote ${DATA_DIR}/${code}.json`);
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
