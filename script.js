// script.js

// FUND DATA with 9 funds
const fundData = {
  bandhan: { scheme: "Bandhan Small Cap Fund Direct-Growth", schemeCode: "147944", investedAmount: 0, totalUnits: 0 },
  hdfc_balanced_advantage: { scheme: "HDFC Balanced Advantage Fund - Growth", schemeCode: "100119", investedAmount: 0, totalUnits: 0 },
  hdfc_gold: { scheme: "HDFC Gold Fund", schemeCode: "115934", investedAmount: 0, totalUnits: 0 },
  icici_large_mid: { scheme: "ICICI Prudential Large & Mid Cap Fund (G)", schemeCode: "100349", investedAmount: 0, totalUnits: 0 },
  icici_multi_asset: { scheme: "ICICI Prudential Multi-Asset Fund (G)", schemeCode: "101144", investedAmount: 0, totalUnits: 0 },
  invesco_flexi_cap: { scheme: "Invesco India Flexi Cap Fund - Regular Plan (G)", schemeCode: "149766", investedAmount: 0, totalUnits: 0 },
  motilal_large_mid: { scheme: "Motilal Oswal Large and Midcap Fund - Regular Plan (G)", schemeCode: "147701", investedAmount: 0, totalUnits: 0 },
  motilal_midcap: { scheme: "Motilal Oswal Midcap Fund - Regular Plan (G)", schemeCode: "127039", investedAmount: 0, totalUnits: 0 },
  tata_small_cap: { scheme: "Tata Small Cap Fund - Regular Plan (G)", schemeCode: "145208", investedAmount: 0, totalUnits: 0 }
};

const NAV_STORAGE_KEY_PREFIX = "navs_";
const TRANSACTION_STORAGE_KEY_PREFIX = "transactions_";

const SIP_STORAGE_KEY = "sipPlans";

// Elements
const fundSelect = document.getElementById('fundSelect');
const schemeSelect = document.getElementById('schemeSelect');
const schemeCodeInput = document.getElementById('schemeCode');
const purchaseDate = document.getElementById('purchaseDate');
const purchaseNAVInput = document.getElementById('purchaseNAV');
const unitsInput = document.getElementById('units');
const investedAmtInput = document.getElementById('investedAmt');
const transactionHistoryBody = document.querySelector('#transactionHistory tbody');
const addFundsForm = document.getElementById('addFundsForm');
const investedAmountSpan = document.getElementById('investedAmount');
const latestNavSpan = document.getElementById('latestNav');
const finalValueSpan = document.getElementById('finalValue');
const lastUpdatedLabel = document.getElementById('lastUpdated');
const fetchNavButtons = document.querySelectorAll('.fetch-button');
const sipForm = document.getElementById('sipForm');
const sipTableBody = document.querySelector('#sipTable tbody');

// --- LOGIN HANDLER ---
function handleLogin() {
  const user = document.getElementById("loginUsername").value.trim();
  const pass = document.getElementById("loginPassword").value;
  const error = document.getElementById("loginError");

  if (user === "tanav2003" && pass === "Ranisati2003@#$%") {
    document.getElementById("loginScreen").style.display = "none";
    document.querySelector(".container").style.display = "block";
  } else {
    error.textContent = "❌ Invalid username or password.";
  }
}

const fundColors = {
  bandhan:      "#ffd43b",
  hdfc_balanced_advantage: "#74b9ff",
  hdfc_gold:    "#ffe066",
  icici_large_mid: "#fab1a0",
  icici_multi_asset: "#00b894",
  invesco_flexi_cap: "#a29bfe",
  motilal_large_mid: "#e17055",
  motilal_midcap: "#fd79a8",
  tata_small_cap: "#55efc4"
};

// SIP helpers
function getSIPs() {
  const raw = localStorage.getItem(SIP_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveSIPs(sips) {
  localStorage.setItem(SIP_STORAGE_KEY, JSON.stringify(sips));
}

// Populate SIP fund dropdown
function populateSIPDropdown() {
  const sipFundSelect = document.getElementById('sipFundSelect');
  sipFundSelect.innerHTML = '';
  for (const key in fundData) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = fundData[key].scheme;
    sipFundSelect.appendChild(option);
  }
}

const chartCtx = document.getElementById('navChart').getContext('2d');
let navChart;
let currentFund = 'bandhan';

// --- Tabs Logic ---
const tabs = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const target = btn.getAttribute('data-tab');
    tabContents.forEach(tc => {
      tc.id === target ? tc.classList.add('active') : tc.classList.remove('active');
    });

    // Fix: Sync currentFund and schemeCodeInput on tab switch
    if (target === "manageTab") {
      currentFund = schemeSelect.value;              // Use the schemeSelect dropdown's current value
      schemeCodeInput.value = fundData[currentFund].schemeCode;
      renderTransactionHistory();
      updateChart(currentFund);
    } else if (target === "dashboardTab") {
      currentFund = fundSelect.value;                // Use the fundSelect dropdown's current value
      schemeCodeInput.value = fundData[currentFund].schemeCode;
      renderTransactionHistory();
      updateChart(currentFund);
    } else if (target === "totalTab") {
      updateTotalChart();               // <-- This is all you need!
    }
    else if (target === "sipTab") {
      populateSIPDropdown();
      renderSIPTable();
    }
  });
});

function renderSIPTable() {
  const sips = getSIPs();
  sipTableBody.innerHTML = '';
  if (!sips.length) {
    sipTableBody.innerHTML = "<tr><td colspan='6'>No SIPs yet.</td></tr>";
    return;
  }
  sips.forEach((sip, i) => {
    const tr = document.createElement('tr');
    tr.style.backgroundColor = fundColors[sip.fundKey] || "#fff";
    tr.innerHTML = `
      <td>${fundData[sip.fundKey].scheme}</td>
      <td>₹${sip.sipAmount}</td>
      <td>${sip.sipStart}</td>
      <td>${sip.sipEnd}</td>
      <td>${sip.sipDay}</td>
      <td><button class="remove-sip" data-i="${i}">Remove</button></td>
    `;
    sipTableBody.appendChild(tr);
  });
  document.querySelectorAll('.remove-sip').forEach(btn => {
    btn.onclick = () => {
      const sips = getSIPs();
      const idx = +btn.getAttribute('data-i');
      removeSIPTransactions(sips[idx]);
      sips.splice(idx, 1);
      saveSIPs(sips);
      renderSIPTable();
      generateSIPTransactions();
      updateChart(currentFund);
      updateTotalChart();
    }
  });
}

sipForm.addEventListener('submit', e => {
  e.preventDefault();
  const fundKey = document.getElementById('sipFundSelect').value;
  const sipAmount = Number(document.getElementById('sipAmount').value);
  const sipStart = document.getElementById('sipStart').value;
  const sipEnd = document.getElementById('sipEnd').value;
  const sipDay = Number(document.getElementById('sipDay').value);
  // Basic validation
  if (sipStart > sipEnd) return alert("End date must be after start date");
  const newSIP = { fundKey, sipAmount, sipStart, sipEnd, sipDay };
  const sips = getSIPs();
  sips.push(newSIP);
  saveSIPs(sips);
  renderSIPTable();
  generateSIPTransactions();
  updateChart(currentFund);
  updateTotalChart();
  sipForm.reset();
  alert("SIP added!");
});

function generateSIPTransactions() {
  const sips = getSIPs();
  sips.forEach(sip => {
    const fundKey = sip.fundKey;
    let current = new Date(sip.sipStart);
    const end = new Date(sip.sipEnd);
    while (current <= end) {
      // Set to desired SIP day
      const txDate = new Date(current.getFullYear(), current.getMonth(), sip.sipDay);
      if (txDate > end) break;
      const txDateStr = txDate.toISOString().split("T")[0];

      // Only if NAV exists for that date
      const navs = getStoredNAVs(fundKey);
      const nav = navs[txDateStr];
      if (!nav) {
        // Move to next month
        current.setMonth(current.getMonth() + 1);
        continue;
      }

      const txs = getTransactions(fundKey);
      // Skip if already a SIP entry for this fund/date
      if (!txs.some(tx => tx.date === txDateStr && tx.isSIP)) {
        const units = parseFloat((sip.sipAmount / nav).toFixed(4));
        txs.push({
          scheme: fundData[fundKey].scheme,
          schemeCode: fundData[fundKey].schemeCode,
          date: txDateStr,
          units,
          purchaseNAV: nav,
          investedAmount: sip.sipAmount,
          isSIP: true
        });
        saveTransactions(fundKey, txs);
      }
      // Next month
      current.setMonth(current.getMonth() + 1);
    }
  });
}

function removeSIPTransactions(sip) {
  const fundKey = sip.fundKey;
  let txs = getTransactions(fundKey);
  // Remove transactions that match the SIP: isSIP + date in SIP period + SIP day
  txs = txs.filter(tx => {
    if (!tx.isSIP) return true;
    // Only remove if in period AND it's the right day
    return !(tx.date >= sip.sipStart && tx.date <= sip.sipEnd && Number(tx.date.slice(8, 10)) === Number(sip.sipDay));
  });
  saveTransactions(fundKey, txs);
}

// Populate schemeSelect dropdown and sync fundSelect
function populateDropdowns() {
  schemeSelect.innerHTML = '';
  fundSelect.innerHTML = '';
  for (const key in fundData) {
    const opt1 = document.createElement('option');
    opt1.value = key;
    opt1.textContent = fundData[key].scheme;
    fundSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = key;
    opt2.textContent = fundData[key].scheme;
    schemeSelect.appendChild(opt2);
  }
}
populateDropdowns();

// LocalStorage helpers
function getTodayDateStr() {
  return new Date().toISOString().split('T')[0];
}

function getStoredNAVs(fundKey) {
  const raw = localStorage.getItem(NAV_STORAGE_KEY_PREFIX + fundKey);
  return raw ? JSON.parse(raw) : {};
}

function storeNAV(fundKey, date, nav) {
  const navs = getStoredNAVs(fundKey);
  navs[date] = nav;
  localStorage.setItem(NAV_STORAGE_KEY_PREFIX + fundKey, JSON.stringify(navs));
}

function getTransactions(fundKey) {
  const raw = localStorage.getItem(TRANSACTION_STORAGE_KEY_PREFIX + fundKey);
  return raw ? JSON.parse(raw) : [];
}

function saveTransactions(fundKey, transactions) {
  localStorage.setItem(TRANSACTION_STORAGE_KEY_PREFIX + fundKey, JSON.stringify(transactions));
}

// Update chart & summary display
function updateChart(fundKey) {
  currentFund = fundKey;
  const navs = getStoredNAVs(fundKey);
  const dates = Object.keys(navs).sort();

  const txs = getTransactions(fundKey).slice().sort((a,b) => new Date(a.date) - new Date(b.date));

  // Invested amount stepwise & total units cumulative
  const investedAmountsByDate = dates.map(date => txs.reduce((sum, tx) => (tx.date <= date ? sum + Number(tx.investedAmount) : sum), 0));
  const totalUnitsByDate = dates.map(date => txs.reduce((sum, tx) => (tx.date <= date ? sum + Number(tx.units) : sum), 0));

  // Final values = NAV * units
  const finalValues = dates.map((date, i) => navs[date] * totalUnitsByDate[i]);

  const latestNAV = dates.length ? navs[dates[dates.length - 1]] : 0;
  const finalValue = finalValues.length ? finalValues[finalValues.length - 1] : 0;
  const latestInvestedAmount = investedAmountsByDate.length ? investedAmountsByDate[investedAmountsByDate.length - 1] : 0;

  investedAmountSpan.textContent = latestInvestedAmount.toFixed(2);
  latestNavSpan.textContent = latestNAV.toFixed(2);
  finalValueSpan.textContent = finalValue.toFixed(2);
  lastUpdatedLabel.textContent = dates.length ? `Last updated on: ${dates[dates.length - 1]}` : "Last updated on: --";

  // Calculate and show overall gain for this fund on the dashboard tab
  const overallGain = finalValue - latestInvestedAmount;
  const overallGainElem = document.getElementById('dashboardOverallGain');
  if (overallGainElem) {
    if (overallGain > 0) {
      overallGainElem.innerHTML = `<span style="color:#00b894;font-weight:bold;">+${overallGain.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>`;
    } else if (overallGain < 0) {
      overallGainElem.innerHTML = `<span style="color:#d63031;font-weight:bold;">${overallGain.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>`;
    } else {
      overallGainElem.innerHTML = `<span style="color:#555;font-weight:bold;">0.00</span>`;
    }
  }

  // NAV day-change: rupee + percent (single span for NAV change)
  const navChangeSpan = document.getElementById("navChange");
  if (dates.length >= 2) {
    const latestDate = dates[dates.length - 1];
    const prevDate = dates[dates.length - 2];
    const prevNAV = navs[prevDate];
    const navDiff = latestNAV - prevNAV;
    const navPercent = prevNAV !== 0 ? (navDiff / prevNAV) * 100 : 0;
    const arrow = navDiff > 0 ? '▲' : navDiff < 0 ? '▼' : '';
    const arrowClass = navDiff > 0 ? 'final-arrow-up' : navDiff < 0 ? 'final-arrow-down' : '';
    navChangeSpan.innerHTML = `<span class="${arrowClass}" style="margin-left:8px">${arrow} ${navDiff.toFixed(2)}</span>`;
  } else {
    navChangeSpan.textContent = '';
  }

  // Final Value day-over-day absolute (₹) and % change, e.g. ▼ -966.88 (-0.43%)
  const finalValueDayChangeSpan = document.getElementById('finalValueDayChange');
  if (dates.length >= 2) {
    const latestDate = dates[dates.length - 1];
    const prevDate = dates[dates.length - 2];
    const totalUnitsOnPrevDay = txs.reduce((sum, tx) => (tx.date <= prevDate ? sum + Number(tx.units) : sum), 0);
    const totalUnitsOnLatestDay = txs.reduce((sum, tx) => (tx.date <= latestDate ? sum + Number(tx.units) : sum), 0);

    const finalPrev = navs[prevDate] * totalUnitsOnPrevDay;
    const finalLatest = navs[latestDate] * totalUnitsOnLatestDay;
    const dayValueDiff = finalLatest - finalPrev;
    const dayValuePercent = finalPrev !== 0 ? (dayValueDiff / finalPrev) * 100 : 0;
    const dayArrow = dayValueDiff > 0 ? '▲' : dayValueDiff < 0 ? '▼' : '';
    const dayArrowClass = dayValueDiff > 0 ? 'final-arrow-up' : dayValueDiff < 0 ? 'final-arrow-down' : '';
    finalValueDayChangeSpan.innerHTML =
      `${dayValueDiff.toFixed(2)} <span class="${dayArrowClass}">${dayArrow} ${dayValuePercent.toFixed(2)}%</span>`;
  } else {
    finalValueDayChangeSpan.textContent = "";
  }


  // Show arrow and percentage change
  const finalValueChangeSpan = document.getElementById('finalValueChange');
  let percentage_change = 0;
  let arrow = '';
  let arrowClass = '';
  if (latestInvestedAmount > 0) {
    percentage_change = ((finalValue - latestInvestedAmount) / latestInvestedAmount) * 100;
    if (percentage_change > 0) {
      arrow = '▲';
      arrowClass = 'final-arrow-up';
    } else if (percentage_change < 0) {
      arrow = '▼';
      arrowClass = 'final-arrow-down';
    } else {
      arrow = '';
      arrowClass = '';
    }
  }

  // Show arrow only if there is a change (positive or negative), otherwise leave blank
  if (arrow) {
    finalValueChangeSpan.innerHTML = `<span class="${arrowClass}">${arrow} ${percentage_change.toFixed(2)}%</span>`;
  } else {
    finalValueChangeSpan.textContent = '';
  }

if (navChart) navChart.destroy();

navChart = new Chart(chartCtx, {
  type: 'line',
  data: {
    labels: dates,
    datasets: [
      {
        label: "Invested Amount",
        data: investedAmountsByDate,
        borderColor: "#2980b9",
        backgroundColor: "rgba(41, 128, 185, 0.1)",
        fill: false,
        stepped: true,
        pointRadius: 0, // smoother appearance
        tension: 0 // no curve for stepped line
      },
      {
        label: "Final Value",
        data: finalValues,
        borderColor: "#74b9ff",
        backgroundColor: "rgba(116, 185, 255, 0.1)",
        fill: false,
        spanGaps: true,   // <-- connects gaps in data
        pointRadius: 2,   // minimal visible points
        tension: 0.3      // <--- adds smooth curves
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: false
      }
    },
    plugins: {
      legend: {
        position: "top"
      },
      tooltip: {
        mode: "index",
        intersect: false
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }
});
}

// Fetch latest NAV from AMFI India text file
async function fetchLatestNAVFromAMFI(fundKey) {
  try {
    // Using CORS proxy since AMFI doesn't have CORS enabled
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    const amfiUrl = "https://www.amfiindia.com/spages/NAVAll.txt";
    const response = await fetch(proxyUrl + amfiUrl);
    if (!response.ok) throw new Error("Network response not ok");

    const text = await response.text();
    const schemeCode = fundData[fundKey].schemeCode;
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith(schemeCode + ';')) {
        const parts = line.split(';');
        const navValue = parseFloat(parts[4]);
        const rawDate = parts[5].trim();
        const navDate = new Date(rawDate).toISOString().split('T')[0];

        if (isNaN(navValue)) {
          console.warn(`Invalid NAV for ${fundKey}`);
          return false;
        }

        const navs = getStoredNAVs(fundKey);
        if (navs[navDate]) return false; // Already have this date NAV

        storeNAV(fundKey, navDate, navValue);
        return true;
      }
    }
    console.warn(`Scheme code ${schemeCode} not found in AMFI data.`);
    return false;
  } catch (err) {
    console.error("Failed to fetch NAV:", err);
    alert("Failed to fetch NAV data. Check your internet or try later.");
    return false;
  }
}

// Fetch all NAVs for all funds
async function fetchAllNAVs() {
  const updatedFunds = [];
  for (const key in fundData) {
    const updated = await fetchLatestNAVFromAMFI(key);
    if (updated) updatedFunds.push(fundData[key].scheme);
  }
  if (updatedFunds.length) {
    alert(`✔️ Updated NAVs for: ${updatedFunds.join(', ')}`);
  } else {
    alert('✅ All NAVs are up to date.');
  }
  updateChart(currentFund);
}

// Populate transaction history table
function renderTransactionHistory() {
  const txs = getTransactions(currentFund);
  transactionHistoryBody.innerHTML = '';

  if (!txs.length) {
    transactionHistoryBody.innerHTML = '<tr><td colspan="6">No transactions yet.</td></tr>';
    return;
  }

  txs.forEach((tx, i) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${tx.scheme}</td>
      <td>${tx.date}</td>
      <td>${Number(tx.units).toFixed(3)}</td>
      <td>${Number(tx.purchaseNAV).toFixed(3)}</td>
      <td>${Number(tx.investedAmount).toFixed(2)}</td>
      <td><button class="remove-btn" data-index="${i}">Remove</button></td>
    `;
    transactionHistoryBody.appendChild(tr);
  });

  // Add remove listeners
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      if (confirm("Are you sure you want to remove this transaction?")) {
        const txs = getTransactions(currentFund);
        txs.splice(idx, 1);
        saveTransactions(currentFund, txs);
        recalcFundTotals(currentFund, txs);
        renderTransactionHistory();
        updateChart(currentFund);
      }
    };
  });
}

// Recalculate investedAmount and totalUnits
function recalcFundTotals(fundKey, transactions) {
  let totalInvested = 0;
  let totalUnits = 0;
  for (const tx of transactions) {
    totalInvested += Number(tx.investedAmount);
    totalUnits += Number(tx.units);
  }
  fundData[fundKey].investedAmount = totalInvested;
  fundData[fundKey].totalUnits = totalUnits;
}

// Sync fund select dropdown changes
fundSelect.addEventListener('change', () => {
  currentFund = fundSelect.value;
  schemeSelect.value = currentFund;
  schemeCodeInput.value = fundData[currentFund].schemeCode;
  clearFormInputs();
  renderTransactionHistory();
  updateChart(currentFund);
});

// Sync scheme select dropdown changes
schemeSelect.addEventListener('change', () => {
  currentFund = schemeSelect.value;
  fundSelect.value = currentFund;
  schemeCodeInput.value = fundData[currentFund].schemeCode;
  clearFormInputs();
  renderTransactionHistory();
  updateChart(currentFund);
});

// Clear form inputs
function clearFormInputs() {
  purchaseDate.value = '';
  purchaseNAVInput.value = '';
  unitsInput.value = '';
  investedAmtInput.value = '';
}

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

// When purchase date changes
purchaseDate.addEventListener('change', () => {
  const dateStr = purchaseDate.value;
  if (!dateStr) return;

  const date = parseLocalDate(dateStr);  // ✅ this is correct!
  const day = date.getDay();             // ✅ this now works properly

  if (day === 0 || day === 6) {
    alert("Market is closed on weekends. Please select a weekday.");
    purchaseNAVInput.value = '';
    investedAmtInput.value = '';
    return;
  }

  const navs = getStoredNAVs(currentFund);
  if (navs[dateStr]) {
    purchaseNAVInput.value = navs[dateStr].toFixed(3);
  } else {
    alert("No NAV data available for selected date. Please pick another date.");
    purchaseNAVInput.value = '';
  }

  updateInvestedAmount();
});

// Update invested amount when units or purchase NAV change
unitsInput.addEventListener('input', updateInvestedAmount);
purchaseNAVInput.addEventListener('input', updateInvestedAmount);

function updateInvestedAmount() {
  const nav = parseFloat(purchaseNAVInput.value);
  const units = parseFloat(unitsInput.value);
  if (nav > 0 && units > 0) {
    investedAmtInput.value = (nav * units).toFixed(2);
  } else {
    investedAmtInput.value = '';
  }
}

// Form submission - add purchase
addFundsForm.addEventListener('submit', e => {
  e.preventDefault();

  const scheme = fundData[currentFund].scheme;
  const schemeCode = fundData[currentFund].schemeCode;
  const date = purchaseDate.value;
  const units = parseFloat(unitsInput.value);
  const purchaseNAV = parseFloat(purchaseNAVInput.value);
  const investedAmount = parseFloat(investedAmtInput.value);

  if (!date) return alert("Please select purchase date.");
  if (!units || units <= 0) return alert("Please enter units > 0.");
  if (!purchaseNAV || purchaseNAV <= 0) return alert("Purchase NAV is invalid or missing.");
  if (!investedAmount || investedAmount <= 0) return alert("Invested amount is invalid.");

  if (date > getTodayDateStr()) {
    alert("Purchase date cannot be in the future.");
    return;
  }

  const txs = getTransactions(currentFund);
  txs.push({ scheme, schemeCode, date, units, purchaseNAV, investedAmount });

  saveTransactions(currentFund, txs);
  recalcFundTotals(currentFund, txs);
  renderTransactionHistory();
  updateChart(currentFund);
  clearFormInputs();

  alert("Purchase added successfully!");
});

function updateTotalChart() {
  // 1. Find all distinct dates across all funds
  let allDatesSet = new Set();
  for (const key in fundData) {
    Object.keys(getStoredNAVs(key)).forEach(date => allDatesSet.add(date));
  }
  const allDates = Array.from(allDatesSet).sort();

  // After allDates and before doing calculations:
  const latestDate = allDates[allDates.length - 1];
  const missingFunds = Object.keys(fundData).filter(key => !getStoredNAVs(key)[latestDate]);
  if (missingFunds.length > 0) {
    alert("Warning: The following funds do not have NAVs for the latest portfolio date (" + latestDate + "):\n" +
          missingFunds.map(k => fundData[k].scheme).join("\n") +
          "\n\nTotal Portfolio Value may be understated!");
  }

  // 2. Prepare invested and value series
  let investedAmountsByDate = [];
  let finalValuesByDate = [];
  let latestInvestedAmount = 0;
  let finalValue = 0;
  let latestNAV = 0;

  for (const date of allDates) {
    let dayInvested = 0;
    let dayValue = 0;
    let navSum = 0;
    let navCount = 0;
    for (const key in fundData) {
      const navs = getStoredNAVs(key);
      const txs = getTransactions(key);
      const nav = navs[date];
      const units = txs.reduce((sum, tx) => (tx.date <= date ? sum + Number(tx.units) : sum), 0);
      const invested = txs.reduce((sum, tx) => (tx.date <= date ? sum + Number(tx.investedAmount) : sum), 0);
      dayInvested += invested;
      if (nav !== undefined) {
        dayValue += nav * units;
        navSum += nav;
        navCount++;
      }
    }
    investedAmountsByDate.push(dayInvested);
    finalValuesByDate.push(dayValue);

    latestInvestedAmount = dayInvested;
    finalValue = dayValue;
    latestNAV = navCount ? (navSum / navCount) : 0;
  }
  //document.getElementById('totalInvestedAmount').textContent = latestInvestedAmount.toFixed(2);
  //document.getElementById('totalFinalValue').textContent = finalValue.toFixed(2);
  // === LAST KNOWN VALUE LOGIC START ===
  let lastKnownPortfolioValue = 0;
  let lastKnownInvestedAmount = 0;
  let previousPortfolioValue = 0;
  for (const key in fundData) {
    const navs = getStoredNAVs(key);
    const txs = getTransactions(key);
    if (!txs.length) continue;
    const navDates = Object.keys(navs).sort();
    if (!navDates.length) continue;
    const lastNavDate = navDates[navDates.length - 1];
    const nav = navs[lastNavDate];
    const units = txs.reduce((sum, tx) => (tx.date <= lastNavDate ? sum + Number(tx.units) : sum), 0);
    const invested = txs.reduce((sum, tx) => (tx.date <= lastNavDate ? sum + Number(tx.investedAmount) : sum), 0);
    lastKnownPortfolioValue += nav * units;
    lastKnownInvestedAmount += invested;

    // For day’s gain: get the previous NAV date if exists
    if (navDates.length >= 2) {
      const prevNavDate = navDates[navDates.length - 2];
      const prevUnits = txs.reduce((sum, tx) => (tx.date <= prevNavDate ? sum + Number(tx.units) : sum), 0);
      previousPortfolioValue += navs[prevNavDate] * prevUnits;
    } else {
      // If only one NAV date, treat previous as initial invested value for this fund
      previousPortfolioValue += invested;
    }
  }

  document.getElementById('totalInvestedAmount').textContent = lastKnownInvestedAmount.toFixed(2);
  document.getElementById('totalFinalValue').textContent = lastKnownPortfolioValue.toFixed(2);
  // === LAST KNOWN VALUE LOGIC END ===

  // Remove last date if not all funds have a NAV for it
  if (allDates.length > 0) {
    const lastDate = allDates[allDates.length - 1];
    const hasNavForAllFunds = Object.keys(fundData).every(key => {
      const navs = getStoredNAVs(key);
      return navs[lastDate] !== undefined && navs[lastDate] !== null;
    });
    if (!hasNavForAllFunds) {
      allDates.pop();
      investedAmountsByDate.pop();
      finalValuesByDate.pop();
    }
  }

  // ---- Determine intelligent label for chart's last point ----
  const allLastDates = [];
  for (const key in fundData) {
    const navs = getStoredNAVs(key);
    const navDates = Object.keys(navs).sort();
    if (navDates.length) allLastDates.push(navDates[navDates.length - 1]);
  }
  const allFundsLatestNAVDate = allLastDates.length > 0
    ? allLastDates.reduce((a, b) => a === b ? a : null)
    : null;
  let lastSnapshotLabel = "Latest";
  if (allFundsLatestNAVDate && allLastDates.every(date => date === allFundsLatestNAVDate)) {
    lastSnapshotLabel = allFundsLatestNAVDate;
    document.getElementById('totalLastUpdated').textContent = `Last updated on: ${allFundsLatestNAVDate}`;
  } else {
    document.getElementById('totalLastUpdated').textContent = `Last updated on: Latest for each fund`;
  }
  const chartLabels = [...allDates, lastSnapshotLabel];
  const investedAmountsWithLatest = [...investedAmountsByDate, lastKnownInvestedAmount];
  const finalValuesWithLatest = [...finalValuesByDate, lastKnownPortfolioValue];


  document.getElementById('totalLastUpdated').textContent =
    allDates.length ? `Last updated on: ${allDates[allDates.length - 1]}` : "Last updated on: --";

  // Show % change and arrow
  const totalFinalValueChangeSpan = document.getElementById('totalFinalValueChange');
  let percentage_change = 0;
  let arrow = '';
  let arrowClass = '';
  if (lastKnownInvestedAmount > 0) {
    percentage_change = ((lastKnownPortfolioValue - lastKnownInvestedAmount) / lastKnownInvestedAmount) * 100;
    if (percentage_change > 0) {
      arrow = '▲';
      arrowClass = 'final-arrow-up';
    } else if (percentage_change < 0) {
      arrow = '▼';
      arrowClass = 'final-arrow-down';
    }
  }
  if (arrow) {
    totalFinalValueChangeSpan.innerHTML = `<span class="${arrowClass}">${arrow} ${percentage_change.toFixed(2)}%</span>`;
  } else {
    totalFinalValueChangeSpan.textContent = '';
  }

  // --- 1. Overall Gain ---
  const overallGain = lastKnownPortfolioValue - lastKnownInvestedAmount;
  let overallArrow = '';
  let overallArrowClass = '';
  if (overallGain > 0) {
    overallArrow = '▲';
    overallArrowClass = 'final-arrow-up';
  } else if (overallGain < 0) {
    overallArrow = '▼';
    overallArrowClass = 'final-arrow-down';
  }
  const overallGainElem = document.getElementById('totalOverallGain');
  if (overallGainElem) {
    overallGainElem.innerHTML =
      `<span class="${overallArrowClass}">${overallArrow} ${(overallGain >= 0 ? '+' : '') + overallGain.toFixed(2)}</span>`;
  } 

  // --- 2. Day's Gain ---
  const totalDayGainSpan = document.getElementById('totalDayGain');
  const dayDiff = lastKnownPortfolioValue - previousPortfolioValue;
  const dayPercent = previousPortfolioValue > 0 ? (dayDiff / previousPortfolioValue) * 100 : 0;
  let dayArrow = '';
  let dayArrowClass = '';
  if (dayDiff > 0) {
    dayArrow = '▲';
    dayArrowClass = 'final-arrow-up';
  } else if (dayDiff < 0) {
    dayArrow = '▼';
    dayArrowClass = 'final-arrow-down';
  }
  if(totalDayGainSpan){
    totalDayGainSpan.innerHTML =
      `<span class="${dayArrowClass}">${(dayDiff >= 0 ? '+' : '') + dayDiff.toFixed(2)} ${dayArrow} ${dayPercent.toFixed(2)}%</span>`;
  }

  // --- 3. Funds-in-Profit vs. Loss Pie ---
  // === BEGIN FUNDS PROFIT/LOSS ANALYSIS AND PIE ===
  let fundsInProfit = [], fundsInLoss = [];
  for (const key in fundData) {
    const navs = getStoredNAVs(key);
    const txs = getTransactions(key);
    if (!txs.length) continue;
    const dates = Object.keys(navs).sort();
    if (!dates.length) continue;
    const invested = txs.reduce((sum, tx) => sum + Number(tx.investedAmount), 0);
    const units = txs.reduce((sum, tx) => sum + Number(tx.units), 0);
    const lastDate = dates[dates.length - 1];
    const latestNav = navs[lastDate];
    const latestValue = latestNav * units;
    const gain = latestValue - invested;
    const percent = invested > 0 ? (gain / invested) * 100 : 0;
    const fundObj = { key, name: fundData[key].scheme, invested, value: latestValue, gain, percent };
    if (gain >= 0) fundsInProfit.push(fundObj);
    else fundsInLoss.push(fundObj);
  }
  // Sorting for highest profit and loss
  fundsInProfit.sort((a, b) => b.gain - a.gain);
  fundsInLoss.sort((a, b) => a.gain - b.gain);

  const numFundsProfit = fundsInProfit.length;
  const numFundsLoss = fundsInLoss.length;
  const numFundsTotal = numFundsProfit + numFundsLoss;
  const profitNames = fundsInProfit.map(f => f.name).join(', ') || "None";
  const lossNames   = fundsInLoss.map(f => f.name).join(', ') || "None";

  // Summary stats
  const totalProfitAmount = fundsInProfit.reduce((sum, f) => sum + f.gain, 0);
  const totalProfitInvested = fundsInProfit.reduce((sum, f) => sum + f.invested, 0);
  const totalProfitPercent = totalProfitInvested ? (totalProfitAmount / totalProfitInvested) * 100 : 0;
  const totalLossAmount = fundsInLoss.reduce((sum, f) => sum + f.gain, 0);
  const totalLossInvested = fundsInLoss.reduce((sum, f) => sum + f.invested, 0);
  const totalLossPercent = totalLossInvested ? (totalLossAmount / totalLossInvested) * 100 : 0;

  // Highest profit/loss funds
  const hiProfit = fundsInProfit[0];
  const hiLoss = fundsInLoss[0];

  // Fill the HTML
  document.getElementById('fundsInProfit').textContent = numFundsProfit;
  document.getElementById('fundsInLoss').textContent = numFundsLoss;
  document.getElementById('numFundsProfit').textContent = numFundsProfit;
  document.getElementById('numFundsLoss').textContent = numFundsLoss;
  document.getElementById('numFundsTotal').textContent = numFundsTotal;
  document.getElementById('numFundsTotalB').textContent = numFundsTotal;
  document.getElementById('totalProfitAmount').textContent = totalProfitAmount.toLocaleString(undefined, {maximumFractionDigits: 2});
  document.getElementById('totalProfitPercent').innerHTML = `<span style="color:#00b894;font-weight:bold;">${(totalProfitPercent >= 0 ? "+" : "") + totalProfitPercent.toFixed(2)}%</span>`;
  document.getElementById('totalLossPercent').innerHTML = `<span style="color:#d63031;font-weight:bold;">${(totalLossPercent >= 0 ? "+" : "") + totalLossPercent.toFixed(2)}%</span>`;
  document.getElementById('totalLossAmount').textContent = totalLossAmount.toLocaleString(undefined, {maximumFractionDigits: 2});
  document.getElementById('highestProfitName').textContent  = hiProfit ? hiProfit.name + " " : "-";
  document.getElementById('highestProfitAmount').textContent = hiProfit ? "+" + hiProfit.gain.toLocaleString(undefined, {maximumFractionDigits: 2}) : "";
  document.getElementById('highestProfitPercent').textContent = hiProfit ? hiProfit.percent.toFixed(2) + "%" : "";
  document.getElementById('highestLossName').textContent = hiLoss ? hiLoss.name + " " : "-";
  document.getElementById('highestLossAmount').textContent = hiLoss ? hiLoss.gain.toLocaleString(undefined, {maximumFractionDigits: 2}) : "";
  document.getElementById('highestLossPercent').textContent = hiLoss ? hiLoss.percent.toFixed(2) + "%" : "";

  // Pie
  const pieLabels = [
    `Profit: ${numFundsProfit} (${profitNames})`,
    `Loss: ${numFundsLoss} (${lossNames})`
  ];
  const pieData = [numFundsProfit, numFundsLoss];
  const pieColors = ['#00b894', '#d63031'];
  const profitLossPieCtx = document.getElementById('profitLossPie').getContext('2d');
  if(window.profitLossPieChart && typeof window.profitLossPieChart.destroy === "function") window.profitLossPieChart.destroy();
  window.profitLossPieChart = new Chart(profitLossPieCtx, {
  type: 'pie',
  data: {
    labels: pieLabels,
    datasets: [{
      data: pieData,
      backgroundColor: pieColors
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataIndex === 0 && fundsInProfit.length > 0) {
              return ['Profit:', ...fundsInProfit.map(f => '• ' + f.name)];
            }
            if (context.dataIndex === 1 && fundsInLoss.length > 0) {
              return ['Loss:', ...fundsInLoss.map(f => '• ' + f.name)];
            }
            return '';
          }
        }
      }
    }
  }
});

  // Draw chart
  if (window.totalNavChart && typeof window.totalNavChart.destroy === "function") {
    window.totalNavChart.destroy();
  }
  const totalChartCtx = document.getElementById('totalNavChart').getContext('2d');
  window.totalNavChart = new Chart(totalChartCtx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: "Total Invested Amount",
          data: investedAmountsWithLatest,
          borderColor: "#2980b9",
          backgroundColor: "rgba(41, 128, 185, 0.1)",
          fill: false,
          stepped: true,
          pointRadius: 0,
          tension: 0
        },
        {
          label: "Total Final Value",
          data: finalValuesWithLatest,
          borderColor: "#74b9ff",
          backgroundColor: "rgba(116, 185, 255, 0.1)",
          fill: false,
          spanGaps: true,
          pointRadius: 2,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 0 } },
        y: { beginAtZero: false }
      },
      plugins: {
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  });
}

// NAV History Seeder for Bandhan fund (runs once)
(function preloadNAVHistory() {
  const navSeed = {
    "2025-06-27": 46.87,
    "2025-06-30": 47.168,
    "2025-07-01": 47.162,
    "2025-07-02": 47.135,
    "2025-07-03": 47.234,
    "2025-07-04": 47.249,
    "2025-07-07": 47.112,
    "2025-07-08": 47.092,
    "2025-07-09": 47.195,
    "2025-07-10": 47.4,
    "2025-07-11": 47.254,
    "2025-07-14": 47.519,
    "2025-07-15": 48.009,
    "2025-07-16": 48.209,
    "2025-07-17": 48.38,
  };
  const key = NAV_STORAGE_KEY_PREFIX + "bandhan";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(navSeed));
  }
})();

(function preloadICICIMultiAssetNavHistory() {
  const navSeed = {
    "2025-06-25": 757.3660,
    "2025-06-26": 761.0829,
    "2025-06-27": 762.4816,
    "2025-06-30": 761.0262,
    "2025-07-01": 761.2667,
    "2025-07-02": 760.7020,
    "2025-07-03": 760.6503,
    "2025-07-04": 761.3840,
    "2025-07-07": 761.4802,
    "2025-07-08": 762.1778,
    "2025-07-09": 761.3281,
    "2025-07-10": 760.4727,
    "2025-07-11": 759.5646,
    "2025-07-14": 759.8072,
    "2025-07-15": 760.9146,
    "2025-07-16": 761.7109,
    "2025-07-17": 760.8417
  };
  const key = NAV_STORAGE_KEY_PREFIX + "icici_multi_asset";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(navSeed));
  }
})();

// NAV History Seeder for HDFC Balanced Advantage Fund - Growth Plan (runs once)
(function preloadHDFCBalancedNAVHistory() {
  const navSeed = {
    "2025-06-25": 519.868,
    "2025-06-26": 523.115,
    "2025-06-27": 524.769,
    "2025-06-30": 524.463,
    "2025-07-01": 524.528,
    "2025-07-02": 523.452,
    "2025-07-03": 522.811,
    "2025-07-04": 523.836,
    "2025-07-07": 523.755,
    "2025-07-08": 524.391,
    "2025-07-09": 524.129,
    "2025-07-10": 522.8,
    "2025-07-11": 520.578,
    "2025-07-14": 520.433,
    "2025-07-15": 522.248,
    "2025-07-16": 522.749,
    "2025-07-17": 521.543
  };
  const key = NAV_STORAGE_KEY_PREFIX + "hdfc_balanced_advantage";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(navSeed));
  }
})();

(function preloadHDFCGoldETFNavHistory() {
  const navSeed = {
    "2025-06-25": 29.2377,
    "2025-06-26": 29.2618,
    "2025-06-27": 28.7863,
    "2025-06-30": 28.8411,
    "2025-07-01": 29.2355,
    "2025-07-02": 29.2736,
    "2025-07-03": 29.2173,
    "2025-07-04": 29.1645,
    "2025-07-07": 29.0445,
    "2025-07-08": 29.1280,
    "2025-07-09": 28.8622,
    "2025-07-10": 29.0993,
    "2025-07-11": 29.2771,
    "2025-07-14": 29.5658,
    "2025-07-15": 29.4467,
    "2025-07-16": 29.2996,
    "2025-07-17": 29.2468,
  };
  const key = NAV_STORAGE_KEY_PREFIX + "hdfc_gold";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(navSeed));
  }
})();

(function preloadMotilalLargeMidNavHistory() {
  const navSeed = {
    "2025-06-25": 33.5982,
    "2025-06-26": 33.8389,
    "2025-06-27": 34.0183,
    "2025-06-30": 34.4672,
    "2025-07-01": 34.3932,
    "2025-07-02": 34.1899,
    "2025-07-03": 34.1430,
    "2025-07-04": 34.0123,
    "2025-07-07": 33.8851,
    "2025-07-08": 33.9835,
    "2025-07-09": 34.1819,
    "2025-07-10": 34.1885,
    "2025-07-11": 33.8322,
    "2025-07-14": 33.9414,
    "2025-07-15": 34.0829,
    "2025-07-16": 34.0347,
    "2025-07-17": 33.9921
  };
  const key = NAV_STORAGE_KEY_PREFIX + "motilal_large_mid";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(navSeed));
  }
})();

(function preloadTataSmallCapNavHistory() {
  const navSeed = {
    "2025-06-25": 40.2783,
    "2025-06-26": 40.2527,
    "2025-06-27": 40.3944,
    "2025-06-30": 40.6483,
    "2025-07-01": 40.8443,
    "2025-07-02": 40.6608,
    "2025-07-03": 40.7537,
    "2025-07-04": 40.8432,
    "2025-07-07": 40.6664,
    "2025-07-08": 40.6773,
    "2025-07-09": 40.8413,
    "2025-07-10": 41.0400,
    "2025-07-11": 41.1100,
    "2025-07-14": 41.3744,
    "2025-07-15": 41.7042,
    "2025-07-16": 41.9343,
    "2025-07-17": 42.1737
  };
  const key = NAV_STORAGE_KEY_PREFIX + "tata_small_cap";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(navSeed));
  }
})();

(function preloadYourFundNavHistory() {
  const navSeed = {
    "2025-06-13": 992.07,
    "2025-06-16": 998.11,
    "2025-06-17": 993.02,
    "2025-06-18": 991.29,
    "2025-06-19": 983.25,
    "2025-06-20": 989.51,
    "2025-06-23": 989.31,
    "2025-06-24": 991.91,
    "2025-06-25": 999.69,
    "2025-06-26": 1006.05,
    "2025-06-27": 1012.61,
    "2025-06-30": 1010.15,
    "2025-07-01": 1007.77,
    "2025-07-02": 1006.98,
    "2025-07-03": 1006.43,
    "2025-07-04": 1007.28,
    "2025-07-07": 1006.88,
    "2025-07-08": 1007.95,
    "2025-07-09": 1008.21,
    "2025-07-10": 1006.63,
    "2025-07-11": 1001.02,
    "2025-07-14": 1000.94,
    "2025-07-15": 1006.04,
    "2025-07-16": 1006.38,
    "2025-07-17": 1008.43
  };
  const key = NAV_STORAGE_KEY_PREFIX + "icici_large_mid";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(navSeed));
  }
})();

(function preloadInvescoFlexiCapNavHistory() {
  const navSeed = {
    "2025-06-25": 18.98,
    "2025-06-26": 19.12,
    "2025-06-27": 19.27,
    "2025-06-30": 19.28,
    "2025-07-01": 19.21,
    "2025-07-02": 19.18,
    "2025-07-03": 19.14,
    "2025-07-04": 19.07,
    "2025-07-07": 19.06,
    "2025-07-08": 19.06,
    "2025-07-09": 19.12,
    "2025-07-10": 19.08,
    "2025-07-11": 18.94,
    "2025-07-14": 19.07,
    "2025-07-15": 19.19,
    "2025-07-16": 19.21,
    "2025-07-17": 19.18
  };
  const key = NAV_STORAGE_KEY_PREFIX + "invesco_flexi_cap";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(navSeed));
  }
})();

(function preloadMotilalMidcapNavHistory() {
  const navSeed = {
    "2024-09-16": 106.1222,
    "2024-09-17": 106.5078,
    "2024-09-18": 105.4424,
    "2024-09-19": 105.7283,
    "2024-09-20": 107.3725,
    "2024-09-23": 108.0283,
    "2024-09-24": 108.2477,
    "2024-09-25": 107.3943,
    "2024-09-26": 106.7341,
    "2024-09-27": 107.5545,
    "2024-09-30": 107.5437,
    "2024-10-01": 108.7021,
    "2024-10-03": 107.0324,
    "2024-10-04": 105.8450,
    "2024-10-07": 105.1393,
    "2024-10-08": 107.2399,
    "2024-10-09": 108.2063,
    "2024-10-10": 107.7789,
    "2024-10-11": 108.5217,
    "2024-10-14": 109.2957,
    "2024-10-15": 109.7683,
    "2024-10-16": 109.1487,
    "2024-10-17": 107.8546,
    "2024-10-18": 107.5250,
    "2024-10-21": 105.4805,
    "2024-10-22": 103.3106,
    "2024-10-23": 106.0341,
    "2024-10-24": 105.3958,
    "2024-10-25": 103.9477,
    "2024-10-28": 104.0685,
    "2024-10-29": 104.5112,
    "2024-10-30": 103.7875,
    "2024-10-31": 102.9680,
    "2024-11-04": 102.8911,
    "2024-11-05": 103.3903,
    "2024-11-06": 106.8895,
    "2024-11-07": 106.3261,
    "2024-11-08": 105.5398,
    "2024-11-11": 104.8835,
    "2024-11-12": 103.9441,
    "2024-11-13": 101.3851,
    "2024-11-14": 102.2904,
    "2024-11-18": 102.6115,
    "2024-11-19": 104.2025,
    "2024-11-21": 104.0467,
    "2024-11-22": 105.1041,
    "2024-11-25": 106.2317,
    "2024-11-26": 106.2173,
    "2024-11-27": 107.0893,
    "2024-11-28": 106.8188,
    "2024-11-29": 108.4242,
    "2024-12-02": 109.3996,
    "2024-12-03": 110.0776,
    "2024-12-04": 110.5955,
    "2024-12-05": 111.6714,
    "2024-12-06": 112.2966,
    "2024-12-09": 113.2076,
    "2024-12-10": 113.1392,
    "2024-12-11": 113.4644,
    "2024-12-12": 113.4315,
    "2024-12-13": 113.8696,
    "2024-12-16": 114.6954,
    "2024-12-17": 114.3892,
    "2024-12-18": 114.1804,
    "2024-12-19": 113.7292,
    "2024-12-20": 110.2629,
    "2024-12-23": 110.4446,
    "2024-12-24": 110.3554,
    "2024-12-26": 111.1752,
    "2024-12-27": 111.2401,
    "2024-12-30": 112.7913,
    "2024-12-31": 112.5509,
    "2025-01-01": 112.8177,
    "2025-01-02": 114.0577,
    "2025-01-03": 113.3000,
    "2025-01-06": 110.5746,
    "2025-01-07": 110.8756,
    "2025-01-08": 109.1078,
    "2025-01-09": 107.4554,
    "2025-01-10": 105.6227,
    "2025-01-13": 100.3627,
    "2025-01-14": 101.4832,
    "2025-01-15": 101.3873,
    "2025-01-16": 101.4292,
    "2025-01-17": 100.8133,
    "2025-01-20": 101.3740,
    "2025-01-21": 97.1193,
    "2025-01-22": 95.4596,
    "2025-01-23": 98.7327,
    "2025-01-24": 97.1149,
    "2025-01-27": 94.5602,
    "2025-01-28": 93.6567,
    "2025-01-29": 95.8659,
    "2025-01-30": 94.4756,
    "2025-01-31": 96.1371,
    "2025-02-03": 96.5540,
    "2025-02-04": 97.7195,
    "2025-02-05": 98.0120,
    "2025-02-06": 96.6454,
    "2025-02-07": 97.3959,
    "2025-02-10": 95.3392,
    "2025-02-11": 93.8302,
    "2025-02-12": 93.2289,
    "2025-02-13": 93.1750,
    "2025-02-14": 91.6804,
    "2025-02-17": 91.7145,
    "2025-02-18": 91.7949,
    "2025-02-19": 92.5028,
    "2025-02-20": 93.2566,
    "2025-02-21": 92.0867,
    "2025-02-24": 91.5979,
    "2025-02-25": 91.2872,
    "2025-02-27": 89.5685,
    "2025-02-28": 88.6747,
    "2025-03-03": 88.9186,
    "2025-03-04": 88.8571,
    "2025-03-05": 91.1663,
    "2025-03-06": 90.3949,
    "2025-03-07": 89.8222,
    "2025-03-10": 88.0516,
    "2025-03-11": 89.3449,
    "2025-03-12": 88.8442,
    "2025-03-13": 88.6047,
    "2025-03-17": 89.0108,
    "2025-03-18": 90.3501,
    "2025-03-19": 91.5646,
    "2025-03-20": 91.2240,
    "2025-03-21": 91.8589,
    "2025-03-24": 92.8023,
    "2025-03-25": 92.7646,
    "2025-03-26": 92.6503,
    "2025-03-27": 93.2765,
    "2025-03-28": 92.6273,
    "2025-03-31": 92.6243,
    "2025-04-01": 91.3432,
    "2025-04-02": 92.8778,
    "2025-04-03": 91.2153,
    "2025-04-04": 88.9378,
    "2025-04-07": 86.5428,
    "2025-04-08": 87.3589,
    "2025-04-09": 86.7492,
    "2025-04-11": 88.0095,
    "2025-04-15": 89.6185,
    "2025-04-16": 90.0680,
    "2025-04-17": 90.8845,
    "2025-04-21": 92.3787,
    "2025-04-22": 93.0829,
    "2025-04-23": 94.5278,
    "2025-04-24": 93.7774,
    "2025-04-25": 93.0542,
    "2025-04-28": 93.9671,
    "2025-04-29": 94.8983,
    "2025-04-30": 94.6147,
    "2025-05-02": 94.4274,
    "2025-05-05": 96.1199,
    "2025-05-06": 94.9081,
    "2025-05-07": 95.9514,
    "2025-05-08": 95.3796,
    "2025-05-09": 95.1462,
    "2025-05-12": 98.4799,
    "2025-05-13": 98.4594,
    "2025-05-14": 98.9159,
    "2025-05-15": 99.0248,
    "2025-05-16": 99.4291,
    "2025-05-19": 99.3442,
    "2025-05-20": 98.3751,
    "2025-05-21": 98.5875,
    "2025-05-22": 98.2634,
    "2025-05-23": 98.5690,
    "2025-05-26": 99.1519,
    "2025-05-27": 99.2548,
    "2025-05-28": 99.5533,
    "2025-05-29": 100.1358,
    "2025-05-30": 99.7102,
    "2025-06-02": 99.6461,
    "2025-06-03": 99.4343,
    "2025-06-04": 99.9087,
    "2025-06-05": 100.4369,
    "2025-06-06": 101.0350,
    "2025-06-09": 101.4332,
    "2025-06-10": 101.6375,
    "2025-06-11": 101.3615,
    "2025-06-12": 100.0764,
    "2025-06-13": 100.0642,
    "2025-06-16": 100.9352,
    "2025-06-17": 100.7907,
    "2025-06-18": 100.7369,
    "2025-06-19": 99.5741,
    "2025-06-20": 101.1025,
    "2025-06-23": 102.0678,
    "2025-06-24": 102.5320,
    "2025-06-25": 103.0927,
    "2025-06-26": 103.3036,
    "2025-06-27": 103.5165,
    "2025-06-30": 104.6415,
    "2025-07-01": 104.6514,
    "2025-07-02": 105.1597,
    "2025-07-03": 104.9397,
    "2025-07-04": 103.7359,
    "2025-07-07": 103.6136,
    "2025-07-08": 103.0673,
    "2025-07-09": 102.8250,
    "2025-07-10": 102.9257,
    "2025-07-11": 101.9561,
    "2025-07-14": 102.4591,
    "2025-07-15": 103.1160,
    "2025-07-16": 103.3945,
    "2025-07-17": 103.3994
  };
  const key = NAV_STORAGE_KEY_PREFIX + "motilal_midcap";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(navSeed));
  }
})();

window.onload = async () => {
  purchaseDate.max = getTodayDateStr();
  populateDropdowns();
  populateSIPDropdown();
  generateSIPTransactions();
  updateTotalChart();
};
