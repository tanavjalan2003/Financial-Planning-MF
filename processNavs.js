const fs = require('fs');
const path = require('path');

const fundData = {
  bandhan: "147944",
  hdfc_balanced_advantage: "100119",
  hdfc_gold: "115934",
  hdfc_small: "130502",
  icici_large_mid: "100349",
  icici_multi_asset: "101144",
  invesco_flexi_cap: "149766",
  motilal_large_mid: "147701",
  motilal_midcap: "127039",
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
  const lines = text.split('\n');
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

    // Parse a date string of format "dd-MMM-yyyy" or "dd-mm-yyyy"
    const [dd, mmRaw, yyyy] = dateStrRaw.split('-');
    if (!dd || !mmRaw || !yyyy) return;

    // Convert month abbreviation (e.g., "Jul") to month number or keep numeric month as is
    const mm = monthMap[mmRaw] || mmRaw.padStart(2, '0');

    const dateISO = `${yyyy}-${mm}-${dd.padStart(2,'0')}`;
    navsByFund[fundKey][dateISO] = nav;  // full precision float, no rounding here
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
