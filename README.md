# 📊 Investment Data Analyzer  
A data-driven mutual fund portfolio analyzer that tracks NAV trends, calculates profit/loss, and provides actionable financial insights through interactive visualizations.

---

## 🚀 Overview  
**Investment Data Analyzer** is a browser-based financial analytics dashboard that helps users understand mutual fund performance over time. It aggregates NAV data from multiple funds and visualizes investment growth, returns, and comparisons in an intuitive UI.

Built as a **fully static web application**, it is deployed via GitHub Pages with automated data updates using GitHub Actions.

---

## 📌 Table of Contents
- [✨ Features](#-features)
  - [📈 Portfolio Analytics](#-portfolio-analytics)
  - [💰 Profit & Loss Insights](#-profit--loss-insights)
  - [📊 Interactive Dashboard](#-interactive-dashboard)
  - [⚙️ Automated Data Pipeline](#-automated-data-pipeline)
- [🧠 Key Capabilities](#-key-capabilities)
- [🛠️ Technologies Used](#-technologies-used)
- [📂 Project Structure](#-project-structure)
- [🌐 Live Demo](#-live-demo)
- [⚙️ Setup Instructions](#-setup-instructions)
  - [Clone the Repository](#1-clone-the-repository)
  - [Run Locally](#2-run-locally)
- [🔄 Data Pipeline (Automation)](#-data-pipeline-automation)
- [📊 How It Works](#-how-it-works)
- [🎯 Use Cases](#-use-cases)
- [🔮 Future Improvements](#-future-improvements)
- [🙌 Acknowledgments](#-acknowledgments)
- [📬 Contact](#-contact)

## ✨ Features  

### 📈 Portfolio Analytics  
- Track mutual fund NAV performance over time  
- Compare multiple funds side-by-side  
- Visualize growth trends and returns  

### 💰 Profit & Loss Insights  
- Calculate investment performance  
- Show absolute and percentage returns  
- Identify best and worst performing funds  

### 📊 Interactive Dashboard  
- Dynamic charts and graphs  
- Smooth UI with responsive layout  
- Filter-based fund selection  

### ⚙️ Automated Data Pipeline  
- GitHub Actions workflow for NAV updates  
- Daily/periodic data processing  
- Automatic JSON refresh and deployment  

---

## 🧠 Key Capabilities  
- Multi-fund data aggregation  
- Time-series NAV analysis  
- Client-side computation (no backend required)  
- Lightweight and fast static deployment  

---

## 🛠️ Technologies Used  

- HTML5  
- CSS3  
- JavaScript (Vanilla)  
- GitHub Actions (CI/CD automation)  
- GitHub Pages (hosting)  

---

## 📂 Project Structure  

```bash
Investment-Data-Analyzer/
│
├── index.html                          # Main dashboard UI
├── script.js                           # Core logic & visualization handling
├── style.css                           # Styling and responsive design
│
├── processNavs.js                      # NAV data processing script
├── fetch-nav.yml                       # GitHub Actions workflow
│
├── navs_*.json                         # Mutual fund NAV datasets
│
└── .github/workflows/
    └── fetch-nav.yml                   # Automation pipeline
````

---

## 🌐 Live Demo

🔗 GitHub Pages:
[https://tanavjalan2003.github.io/Investment-Data-Analyzer/](https://tanavjalan2003.github.io/Investment-Data-Analyzer/)

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Investment-Data-Analyzer
```

---

### 2. Run Locally

Since this is a **static project**, no installation is required.

Simply open:
```bash
index.html
```

OR use a local server:
```bash
npx serve
```

---

## 🔄 Data Pipeline (Automation)

This project uses **GitHub Actions** to:

* Fetch updated NAV data
* Process and clean datasets
* Regenerate JSON files
* Auto-deploy changes to GitHub Pages

Workflow file:

```bash
.github/workflows/fetch-nav.yml
```

---

## 📊 How It Works

1. NAV data is collected and stored in JSON files
2. `processNavs.js` processes and standardizes the data
3. `script.js` renders charts and analytics
4. `index.html` displays the interactive dashboard
5. GitHub Actions keeps data up-to-date automatically

---

## 🎯 Use Cases

* Personal investment tracking
* Mutual fund performance comparison
* Educational finance visualization
* Portfolio analysis for beginners

---

## 🔮 Future Improvements

* Add stock market integration (real-time APIs)
* User login + personalized portfolios
* Advanced risk metrics (Sharpe ratio, volatility)
* Machine learning-based predictions
* Export reports (PDF/Excel)

---

## 🙌 Acknowledgments

* Mutual fund NAV data sources
* GitHub Actions for automation
* Open financial data community

---

## 📬 Contact

📧 [tanavjalan2026@gmail.com](mailto:tanavjalan2026@gmail.com)

