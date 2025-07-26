const fs = require('fs');
const path = require('path');

const fundKeys = Object.keys(fundData); // or your fund keys array

fundKeys.forEach(fundKey => {
  const filePath = path.join(__dirname, `navs_${fundKey}.json`);

  if (!fs.existsSync(filePath)) {
    console.log(`${filePath} not found`);
    return;
  }

  let navs = {};
  try {
    navs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Error parsing ${filePath}`, err);
    return;
  }

  let updated = false;
  for (const date in navs) {
    const oldValue = navs[date];
    const roundedValue = Number(oldValue.toFixed(3)); // or parseFloat(...).toFixed(3)
    if (roundedValue !== oldValue) {
      navs[date] = roundedValue;
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(navs, null, 2));
    console.log(`Updated NAV values rounded to 3 decimals for fund: ${fundKey}`);
  } else {
    console.log(`No change needed for fund: ${fundKey}`);
  }
});

console.log("NAV JSON files update complete.");
