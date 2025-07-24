// ====== processNavs.js ======

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

    const [dd, mm, yyyy] = dateStrRaw.split('-');
    if (!dd || !mm || !yyyy) return;
    const dateISO = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;

    navsByFund[fundKey][dateISO] = nav;
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

    const text = fs.readFileSync(navDataPath, 'utf8');
    const navsByFund = parseNAVAllText(text);

    for (const fundKey in navsByFund) {
      const fileName = `navs_${fundKey}.json`;
      fs.writeFileSync(path.join(__dirname, fileName), JSON.stringify(navsByFund[fundKey], null, 2));
      console.log(`Saved NAV JSON for ${fundKey}: ${fileName}`);
    }

    console.log('NAV parsing and JSON files generation complete.');
  } catch (err) {
    console.error('Error processing NAV data:', err);
  }
})();
