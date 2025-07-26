// script.js

// FUND DATA with 9 funds
const fundData = {
  bandhan: { scheme: "Bandhan Small Cap Fund Direct-Growth", schemeCode: "147944", investedAmount: 0, totalUnits: 0 },
  hdfc_balanced_advantage: { scheme: "HDFC Balanced Advantage Fund - Growth", schemeCode: "100119", investedAmount: 0, totalUnits: 0 },
  hdfc_gold: { scheme: "HDFC Gold Fund", schemeCode: "115934", investedAmount: 0, totalUnits: 0 },
  hdfc_small: { scheme: "HDFC Small Cap Fund - Growth Option", schemeCode: "130502", investedAmount: 0, totalUnits: 0 },
  icici_large_mid: { scheme: "ICICI Prudential Large & Mid Cap Fund (G)", schemeCode: "100349", investedAmount: 0, totalUnits: 0 },
  icici_multi_asset: { scheme: "ICICI Prudential Multi-Asset Fund (G)", schemeCode: "101144", investedAmount: 0, totalUnits: 0 },
  invesco_flexi_cap: { scheme: "Invesco India Flexi Cap Fund - Regular Plan (G)", schemeCode: "149766", investedAmount: 0, totalUnits: 0 },
  motilal_large_mid: { scheme: "Motilal Oswal Large and Midcap Fund - Regular Plan (G)", schemeCode: "147701", investedAmount: 0, totalUnits: 0 },
  motilal_midcap: { scheme: "Motilal Oswal Midcap Fund - Regular Plan (G)", schemeCode: "127039", investedAmount: 0, totalUnits: 0 },
  tata_small_cap: { scheme: "Tata Small Cap Fund - Regular Plan (G)", schemeCode: "145208", investedAmount: 0, totalUnits: 0 }
};

const NAV_STORAGE_KEY_PREFIX = "navs_";
const TRANSACTION_STORAGE_KEY_PREFIX = "transactions_";

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

const chartCtx = document.getElementById('navChart').getContext('2d');
let navChart;
let currentFund = 'bandhan';
let totalChartMode = 'focus';  // default set to focus mode

async function loadNAVJsonForFund(fundKey) {
  try {
    const response = await fetch(`navs_${fundKey}.json`);
    if (!response.ok) throw new Error(`Failed to fetch navs_${fundKey}.json`);
    const navJson = await response.json();
    localStorage.setItem(NAV_STORAGE_KEY_PREFIX + fundKey, JSON.stringify(navJson));
    console.log(`Loaded NAV JSON for ${fundKey}`);
  } catch (err) {
    console.error(`Error loading NAV JSON for ${fundKey}:`, err);
  }
}

async function loadAllNAVs() {
  for (const fundKey in fundData) {
    await loadNAVJsonForFund(fundKey);
  }
  // Wait for the next tick (optional but can help)
  await new Promise(resolve => setTimeout(resolve, 0));

  // Removed generateSIPTransactions();

  // After transactions generated, update charts
  updateChart(currentFund);
  updateTotalChart();
}

function formatIndianCurrency(amount) {
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNAVValue(nav) {
  return nav.toLocaleString('en-IN'); // No fixed decimal places, full precision
}

// --- LOGIN HANDLER ---
function handleLogin() {
  const user = document.getElementById("loginUsername").value.trim();
  const pass = document.getElementById("loginPassword").value;
  const error = document.getElementById("loginError");

  if (user === "tanav2003" && pass === "Ranisati2003@#$%") {
    document.getElementById("loginScreen").style.display = "none";
    document.querySelector(".container").style.display = "block";

    // Load NAV JSON files after successful login
    loadAllNAVs();

  } else {
    error.textContent = "❌ Invalid username or password.";
  }
}

const fundColors = {
  bandhan: "#ffd43b",
  hdfc_balanced_advantage: "#74b9ff",
  hdfc_gold: "#ffe066",
  hdfc_small: "#ffb6c1",
  icici_large_mid: "#fab1a0",
  icici_multi_asset: "#00b894",
  invesco_flexi_cap: "#a29bfe",
  motilal_large_mid: "#e17055",
  motilal_midcap: "#fd79a8",
  tata_small_cap: "#55efc4"
};

// Removed all SIP helper functions and variables

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

  const totalUnits = txs.reduce((sum, tx) => sum + Number(tx.units), 0);

  const dashboardTotalUnitsSpan = document.getElementById('dashboardTotalUnits');
  if (dashboardTotalUnitsSpan) {
    dashboardTotalUnitsSpan.textContent = totalUnits.toFixed(4);
  }

  const investedAmountsByDate = dates.map(date => txs.reduce((sum, tx) => (tx.date <= date ? sum + Number(tx.investedAmount) : sum), 0));
  const totalUnitsByDate = dates.map(date => txs.reduce((sum, tx) => (tx.date <= date ? sum + Number(tx.units) : sum), 0));

  const finalValues = dates.map((date, i) => Number((navs[date] * totalUnitsByDate[i]).toFixed(2)));

  const latestNAV = dates.length ? navs[dates[dates.length - 1]] : 0;
  const finalValue = finalValues.length ? finalValues[finalValues.length - 1] : 0;
  const latestInvestedAmount = investedAmountsByDate.length ? investedAmountsByDate[investedAmountsByDate.length - 1] : 0;

  investedAmountSpan.textContent = formatIndianCurrency(latestInvestedAmount);
  latestNavSpan.textContent = formatNAVValue(latestNAV);
  finalValueSpan.textContent = formatIndianCurrency(finalValue);
  lastUpdatedLabel.textContent = dates.length ? `Last updated on: ${dates[dates.length - 1]}` : "Last updated on: --";

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

  const navChangeSpan = document.getElementById("navChange");
  if (dates.length >= 2) {
    const latestDate = dates[dates.length - 1];
    const prevDate = dates[dates.length - 2];
    const prevNAV = navs[prevDate];
    const navDiff = latestNAV - prevNAV;
    const navPercent = prevNAV !== 0 ? (navDiff / prevNAV) * 100 : 0;
    const arrow = navDiff > 0 ? '▲' : navDiff < 0 ? '▼' : '';
    const arrowClass = navDiff > 0 ? 'final-arrow-up' : navDiff < 0 ? 'final-arrow-down' : '';
    navChangeSpan.innerHTML = `<span class="${arrowClass}" style="margin-left:8px">${arrow} ${formatNAVValue(navDiff)}</span>`;
  } else {
    navChangeSpan.textContent = '';
  }

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
    finalValueDayChangeSpan.innerHTML = `${formatIndianCurrency(dayValueDiff)} <span class="${dayArrowClass}">${dayArrow} ${dayValuePercent.toFixed(2)}%</span>`;
  } else {
    finalValueDayChangeSpan.textContent = "";
  }

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
          pointRadius: 0,
          tension: 0
        },
        {
          label: "Final Value",
          data: finalValues,
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
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
          }
        }
      },
      plugins: {
        legend: {
          position: "top"
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
          }
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
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    const amfiUrl = "https://www.amfiindia.com/spages/NAVAll.txt";
    const response = await fetch(proxyUrl + amfiUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error("Network response not ok");

    const text = await response.text();
    const schemeCode = fundData[fundKey].schemeCode;
    const lines = text.split('\n');

    const matchedLines = lines.filter(line => line.startsWith(schemeCode + ';'));
    if (matchedLines.length === 0) {
      console.warn(`Scheme code ${schemeCode} not found in AMFI data.`);
      return false;
    }

    const navEntries = matchedLines.map(line => {
      const parts = line.split(';');
      return {
        navValue: parseFloat(parts[4]),
        navDateRaw: parts[5].trim(),
        navDate: new Date(parts[5].trim())
      };
    }).filter(entry => !isNaN(entry.navValue));

    if (navEntries.length === 0) {
      console.warn(`No valid NAV entries for scheme code ${schemeCode}.`);
      return false;
    }

    navEntries.sort((a, b) => b.navDate - a.navDate);

    const latestEntry = navEntries[0];

    const navDate = latestEntry.navDate.toISOString().split('T')[0];

    const navs = getStoredNAVs(fundKey);
    if (navs[navDate]) {
      return false;
    }

    storeNAV(fundKey, navDate, latestEntry.navValue);
    return true;

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
      <td>${formatNAVValue(Number(tx.purchaseNAV))}</td>
      <td>${formatIndianCurrency(Number(tx.investedAmount))}</td>
      <td><button class="remove-btn" data-index="${i}">Remove</button></td>
    `;
    transactionHistoryBody.appendChild(tr);
  });

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
  return new Date(year, month - 1, day);
}

// When purchase date changes
purchaseDate.addEventListener('change', () => {
  const dateStr = purchaseDate.value;
  if (!dateStr) return;

  const date = parseLocalDate(dateStr);
  const day = date.getDay();

  if (day === 0 || day === 6) {
    alert("Market is closed on weekends. Please select a weekday.");
    purchaseNAVInput.value = '';
    investedAmtInput.value = '';
    return;
  }

  const navs = getStoredNAVs(currentFund);
  if (navs[dateStr]) {
    purchaseNAVInput.value = navs[dateStr];
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
    overallGainElem.innerHTML = `<span style="color:#00b894;font-weight:bold;">+${formatIndianCurrency(overallGain)}</span>`;
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
    totalDayGainSpan.innerHTML = `<span class="${dayArrowClass}">${(dayDiff >= 0 ? '+' : '') + formatIndianCurrency(dayDiff)} ${dayArrow} ${dayPercent.toFixed(2)}%</span>`;
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
  document.getElementById('totalProfitAmount').textContent = formatIndianCurrency(totalProfitAmount);
  document.getElementById('totalProfitPercent').innerHTML = `<span style="color:#00b894;font-weight:bold;">${(totalProfitPercent >= 0 ? "+" : "") + totalProfitPercent.toFixed(2)}%</span>`;
  document.getElementById('totalLossPercent').innerHTML = `<span style="color:#d63031;font-weight:bold;">${(totalLossPercent >= 0 ? "+" : "") + totalLossPercent.toFixed(2)}%</span>`;
  document.getElementById('totalLossAmount').textContent = formatIndianCurrency(totalLossAmount);
  // Fill the HTML securely, with checks for undefined
  document.getElementById('highestProfitName').textContent  = hiProfit ? hiProfit.name + " " : "-";
  document.getElementById('highestProfitAmount').textContent = hiProfit ? "+" + formatIndianCurrency(hiProfit.gain) : "-";
  document.getElementById('highestProfitPercent').textContent = hiProfit ? hiProfit.percent.toFixed(2) + "%" : "-";
  document.getElementById('highestLossName').textContent = hiLoss ? hiLoss.name + " " : "-";
  document.getElementById('highestLossAmount').textContent = hiLoss ? formatIndianCurrency(hiLoss.gain) : "-";
  document.getElementById('highestLossPercent').textContent = hiLoss ? hiLoss.percent.toFixed(2) + "%" : "-";

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

  console.log('updateTotalChart');
  console.log('Chart labels:', chartLabels);
  console.log('Invested amounts with latest:', investedAmountsWithLatest);
  console.log('Final values with latest:', finalValuesWithLatest);
  
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
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: false,
          ticks: {
            // Format y-axis ticks as Indian number with 2 decimals
            callback: function(value) {
              return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
          }
        }
      },
      plugins: {
        legend: {
          position: "top"
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
          }
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

window.onload = async () => {
  purchaseDate.max = getTodayDateStr();
  populateDropdowns();
  // Removed SIP related calls:
  // populateSIPDropdown();
  // generateSIPTransactions();

  updateChart(currentFund);
  updateTotalChart();

  const originalBtn = document.getElementById('originalModeBtn');
  const focusBtn = document.getElementById('focusModeBtn');

  // Add event listeners
  originalBtn.addEventListener('click', () => {
    if (totalChartMode !== 'original') {
      totalChartMode = 'original';
      updateTotalChart();
      originalBtn.classList.add('selected');
      focusBtn.classList.remove('selected');
    }
  });

  focusBtn.addEventListener('click', () => {
    if (totalChartMode !== 'focus') {
      totalChartMode = 'focus';
      updateTotalChart();
      focusBtn.classList.add('selected');
      originalBtn.classList.remove('selected');
    }
  });

  // Set initial button selected state based on totalChartMode
  if (totalChartMode === 'focus') {
    originalBtn.classList.remove('selected');
    focusBtn.classList.add('selected');
  } else {
    focusBtn.classList.remove('selected');
    originalBtn.classList.add('selected');
  }
};
