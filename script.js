console.log("SCRIPT LOADED");
// ========================================
// SUPABASE CONFIG
// ========================================
const SUPABASE_URL = "https://liketekvzrazheolmfnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let telegramId = null;

// ========================================
// SECURE TELEGRAM LOGIN (DEBUG VERSION)
// ========================================
async function secureTelegramLogin() {

  console.log("secureTelegramLogin started");

  if (!window.Telegram || !window.Telegram.WebApp) {
    console.log("Telegram WebApp not found");
    alert("Open this app inside Telegram.");
    return null;
  }

  const tg = window.Telegram.WebApp;
  tg.expand();

  const initData = tg.initData;
  const initDataUnsafe = tg.initDataUnsafe;

  console.log("initData:", initData);
  console.log("initDataUnsafe:", initDataUnsafe);

  if (!initData) {
    console.log("No initData");
    alert("No Telegram authentication data.");
    return null;
  }

  console.log("Calling telegram-login function...");

  try {

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/telegram-login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: initData
      }
    );

    console.log("Response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.log("Response error:", text);
      alert("Login failed: " + text);
      return null;
    }

    const wallet = await response.json();
    console.log("Wallet received:", wallet);

    telegramId = String(initDataUnsafe.user.id);

    return wallet;

  } catch (err) {
    console.log("FETCH ERROR:", err);
    alert("Fetch failed. Check console.");
    return null;
  }
}
// ========================================
// LOAD BALANCE
// ========================================
async function loadBalance() {

  const { data } = await supabase
    .from("wallets")
    .select("balance_points")
    .eq("telegram_id", telegramId)
    .single();

  if (data) {
    document.getElementById("balance").innerText =
      data.balance_points;
  }
}

// ========================================
// REALTIME WALLET UPDATES
// ========================================
function subscribeToWallet() {

  supabase
    .channel('wallet-live')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'wallets'
      },
      (payload) => {

        if (payload.new.telegram_id === telegramId) {
          document.getElementById("balance").innerText =
            payload.new.balance_points;
        }
      }
    )
    .subscribe();
}

// ========================================
// LOAD MARKETS
// ========================================
async function loadMarkets() {

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/get-markets`,
    {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const markets = await response.json();
  const container = document.getElementById("markets");
  container.innerHTML = "";

  if (!markets || markets.length === 0) {
    container.innerHTML = "No open markets";
    return;
  }

  markets.forEach(market => {

    const yesPool = market.yes_pool || 0;
    const noPool = market.no_pool || 0;
    const totalPool = yesPool + noPool;

    const yesOdds = yesPool > 0
      ? (totalPool / yesPool).toFixed(2)
      : "1.00";

    const noOdds = noPool > 0
      ? (totalPool / noPool).toFixed(2)
      : "1.00";

    const card = document.createElement("div");

    card.innerHTML = `
      <h4>${market.question}</h4>
      <p>YES Pool: ${yesPool} (x${yesOdds})</p>
      <p>NO Pool: ${noPool} (x${noOdds})</p>
      <button class="yes" onclick="placeTrade('${market.id}','yes')">
        YES @ x${yesOdds}
      </button>
      <button class="no" onclick="placeTrade('${market.id}','no')">
        NO @ x${noOdds}
      </button>
    `;

    container.appendChild(card);
  });
}

// ========================================
// PLACE TRADE
// ========================================
async function placeTrade(marketId, option) {

  const amount = prompt("Enter amount in points:");
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/place-trade`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        market_id: marketId,
        choice: option,
        stake: Number(amount)
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Trade failed");
    return;
  }

  alert("Trade placed successfully!");

  await loadBalance();
  await loadMarkets();
}

// ========================================
// STRIPE DEPOSIT
// ========================================
async function deposit() {

  const amount = prompt("Enter amount in EUR:");
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Number(amount)
      })
    }
  );

  const data = await response.json();

  if (data.url) {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(data.url);
    } else {
      window.location.href = data.url;
    }
  } else {
    alert("Checkout creation failed");
  }
}

// ========================================
// START APP
// ========================================
document.addEventListener("DOMContentLoaded", async () => {

  console.log("DOM LOADED");

  const wallet = await secureTelegramLogin();

  console.log("Login result:", wallet);

  if (!wallet) return;

  document.getElementById("balance").innerText =
    wallet.balance_points;

  await loadMarkets();
  subscribeToWallet();
});

window.deposit = deposit;
window.placeTrade = placeTrade;
