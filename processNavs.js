const fs = require("fs");
const path = require("path");

// AMFI month mapping
const monthMap = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04",
  May: "05", Jun: "06", Jul: "07", Aug: "08",
  Sep: "09", Oct: "10", Nov: "11", Dec: "12"
};

/**
 * Parse AMFI NAVAll.txt
 * Builds:
 * 1. fundRegistry (schemeCode → fundName)
 * 2. navData (schemeCode → {date → nav})
 */
function parseNAVAllText(text) {
  const lines = text.replace(/\r/g, "").split("\n");

  const fundRegistry = {};
  const navData = {};

  for (const line of lines) {
    const parts = line.split(";");

    // AMFI format sanity check
    if (parts.length < 6) continue;

    const schemeCode = parts[0].trim();
    const fundName = parts[1].trim();
    const navStr = parts[4].trim();
    const dateStrRaw = parts[5].trim();

    const nav = parseFloat(navStr);
    if (isNaN(nav)) continue;

    // Register fund dynamically
    if (!fundRegistry[schemeCode]) {
      fundRegistry[schemeCode] = fundName;
    }

    // Parse date
    let [ddRaw, mmRaw, yyyyRaw] = dateStrRaw.includes("-")
      ? dateStrRaw.split("-")
      : dateStrRaw.split("/");

    if (!ddRaw || !mmRaw || !yyyyRaw) continue;

    const dd = ddRaw.trim().padStart(2, "0");
    const mm = (monthMap[mmRaw.trim()] || mmRaw.trim().padStart(2, "0"));
    const yyyy = yyyyRaw.trim();

    const dateISO = `${yyyy}-${mm}-${dd}`;

    // Initialize fund bucket if not exists
    if (!navData[schemeCode]) {
      navData[schemeCode] = {};
    }

    // Store NAV
    navData[schemeCode][dateISO] = nav;

    console.log(`${schemeCode} → ${dateISO} = ${nav}`);
  }

  return { fundRegistry, navData };
}

(async () => {
  try {
    const navDataPath = path.join(__dirname, "navData.txt");

    if (!fs.existsSync(navDataPath)) {
      console.error("navData.txt not found.");
      process.exit(1);
    }

    const text = fs.readFileSync(navDataPath, "utf8");
    const { fundRegistry, navData } = parseNAVAllText(text);

    // OUTPUT FILES
    const registryPath = path.join(__dirname, "fund_registry.json");
    const historyPath = path.join(__dirname, "funds_history.json");

    // Save fund registry (schemeCode → name)
    fs.writeFileSync(
      registryPath,
      JSON.stringify(fundRegistry, null, 2)
    );

    // Save NAV history (schemeCode → {date → nav})
    fs.writeFileSync(
      historyPath,
      JSON.stringify(navData, null, 2)
    );

    console.log("✅ Fund registry saved:", registryPath);
    console.log("✅ NAV history saved:", historyPath);
    console.log("🚀 AMFI processing complete.");
  } catch (err) {
    console.error("Error processing NAV data:", err);
  }
})();
