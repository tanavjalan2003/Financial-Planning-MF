const fs = require('fs');
const path = require('path');

const fundData = {
  bandhan: "147944",
  hdfc_balanced_advantage: "100119",
  hdfc_gold: "115934",
  hdfc_nifty_50_index: "101525",
  hdfc_small: "130502",
  icici_multi_asset: "101144",
  invesco_flexi_cap: "149766",
  kotak_nifty_next_50: "148743",
  motilal_large_mid: "147701",
  tata_small_cap: "145208"
};

// Map for converting month abbreviations to two-digit month numbers
const monthMap = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12'
};

function parseNAVAllText(text) {
  // Normalize line endings (\r\n or \r → \n) and split
  const lines = text.replace(/\r/g, '').split('\n');
  const navsByFund = {};
  for (const fundKey in fundData) {
    navsByFund[fundKey] = {};
  }

  lines.forEach(line => {
    const parts = line.split(';');
    if (parts.length < 6) return;

    const schemeCode = parts[0].trim();
    const navStr = parts[4].trim();
    const dateStrRaw = parts[5].trim();

    const fundKey = Object.keys(fundData).find(k => fundData[k] === schemeCode);
    if (!fundKey) return;

    const nav = parseFloat(navStr);
    if (isNaN(nav)) return;

    // Handle both dd-MMM-yyyy and dd/mm/yyyy, trim parts
    let [ddRaw, mmRaw, yyyyRaw] = dateStrRaw.includes('-')
      ? dateStrRaw.split('-')
      : dateStrRaw.split('/');

    if (!ddRaw || !mmRaw || !yyyyRaw) return;

    const dd = ddRaw.trim().padStart(2, '0');
    const mm = (monthMap[mmRaw.trim()] || mmRaw.trim().padStart(2, '0'));
    const yyyy = yyyyRaw.trim();

    const dateISO = `${yyyy}-${mm}-${dd}`;

    // Save in the simple format: { "YYYY-MM-DD": NAV }
    navsByFund[fundKey][dateISO] = nav;
    console.log(`Parsed ${fundKey}: ${dateISO} -> ${nav}`);
  });

  return navsByFund;
}

(async () => {
  try {
    const navDataPath = path.join(__dirname, 'navData.txt');
    if (!fs.existsSync(navDataPath)) {
      console.error('navData.txt not found. Please download it first.');
      process.exit(1);
    }

    // Read new NAV data from the latest NAVAll.txt
    const text = fs.readFileSync(navDataPath, 'utf8');
    const newNavsByFund = parseNAVAllText(text);

    for (const fundKey in newNavsByFund) {
      const fileName = `navs_${fundKey}.json`;
      const filePath = path.join(__dirname, fileName);

      // Read existing NAV JSON if exists
      let existingNavs = {};
      if (fs.existsSync(filePath)) {
        try {
          const existingData = fs.readFileSync(filePath, 'utf8');
          existingNavs = JSON.parse(existingData);
        } catch (err) {
          console.warn(`Warning: Could not parse existing ${fileName}, overwriting it.`);
          existingNavs = {};
        }
      }

      // Merge new NAV data into existing NAVs (overwrites by date if conflict)
      const mergedNavs = { ...existingNavs, ...newNavsByFund[fundKey] };

      // Write merged data back to JSON file
      // Round all merged NAV values to 3 decimals before writing
      //for (const date in mergedNavs) {
        //mergedNavs[date] = Number(mergedNavs[date].toFixed(3));
      //}
      
      fs.writeFileSync(filePath, JSON.stringify(mergedNavs, null, 2));
      console.log(`Updated NAV JSON for ${fundKey}: ${fileName}`);
    }

    console.log('NAV parsing and JSON files update complete.');
  } catch (err) {
    console.error('Error processing NAV data:', err);
  }
})();
