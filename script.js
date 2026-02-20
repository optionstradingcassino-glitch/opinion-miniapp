/************************************************************
 OPTIONS TRADING MINI APP — FULL FRONTEND SCRIPT
************************************************************/

/* ==============================
   🔐 CONFIG — PUT YOUR VALUES HERE
============================== */

// 🔴 CHANGE ONLY THESE TWO
const SUPABASE_URL = "https://liketekvzrazheolmfnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE";

// Supabase REST headers
const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
};

/* ==============================
   TELEGRAM USER DETECTION
============================== */

let telegramId = null;

function detectTelegramUser() {

  if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
    document.getElementById("user").innerText =
      "Hello, " + window.Telegram.WebApp.initDataUnsafe.user.first_name;
  }
  else {
    // fallback for browser testing
    telegramId = "12345";
    document.getElementById("user").innerText =
      "Hello, Test User";
    console.log("Using fallback telegram_id:", telegramId);
  }
}

/* ==============================
   LOAD WALLET BALANCE
============================== */

async function loadBalance() {

  if (!telegramId) return;

  try {

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wallets?telegram_id=eq.${telegramId}&select=points`,
      { headers }
    );

    const data = await res.json();

    if (data.length > 0) {
      document.getElementById("balance").innerText =
        `Balance: ${data[0].points} points`;
    } else {
      document.getElementById("balance").innerText =
        "Balance: 0 points";
    }

  } catch (err) {
    console.error("Balance load error", err);
  }
}

/* ==============================
   LOAD MARKETS + SHOW ODDS
============================== */

async function loadMarkets() {

  try {

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/markets?status=eq.open&select=*`,
      { headers }
    );

    const markets = await res.json();

    const container = document.getElementById("markets");
    container.innerHTML = "";

    if (!markets.length) {
      container.innerHTML = "<p>No active markets</p>";
      return;
    }

    markets.forEach(market => {

      const yesPool = Number(market.yes_pool || 0);
      const noPool = Number(market.no_pool || 0);
      const totalPool = yesPool + noPool;

      let yesOdds = 1.8;
      let noOdds = 1.8;

      // dynamic pool odds
      if (totalPool > 0) {
        if (yesPool > 0) yesOdds = (totalPool / yesPool).toFixed(2);
        if (noPool > 0) noOdds = (totalPool / noPool).toFixed(2);
      }

      const div = document.createElement("div");
      div.className = "market";

      div.innerHTML = `
        <h3>${market.question}</h3>

        <input 
          id="points-${market.id}" 
          type="number" 
          placeholder="Enter points" 
          min="1"
        />

        <div class="buttons">
          <button onclick="tradeMarket('${market.id}','yes')">
            YES (${yesOdds}x)
          </button>

          <button onclick="tradeMarket('${market.id}','no')">
            NO (${noOdds}x)
          </button>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Markets load error", err);
  }
}

/* ==============================
   PLACE TRADE
============================== */

async function tradeMarket(marketId, option) {

  const input = document.getElementById(`points-${marketId}`);
  const amount = Number(input.value);

  if (!amount || amount <= 0) {
    alert("Enter valid points");
    return;
  }

  try {

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/place-trade`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          telegram_id: telegramId,
          market_id: marketId,
          option,
          amount
        })
      }
    );

    const data = await res.json();

    console.log("Trade response:", data);

    if (!res.ok) {
      alert("Trade failed");
      return;
    }

    alert("Trade placed!");

    // reload everything
    loadBalance();
    loadMarkets();

  } catch (err) {
    console.error("Trade error", err);
    alert("Trade error");
  }
}

/* ==============================
   STRIPE DEPOSIT
============================== */

async function deposit() {

  try {

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/create-checkout-session`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          telegram_id: telegramId
        })
      }
    );

    const data = await res.json();

    console.log("Checkout response:", data);

    if (data.url) {
      window.open(data.url, "_blank"); // MUST be top level for Stripe
    } else {
      alert("Checkout session failed");
    }

  } catch (err) {
    console.error("Deposit error:", err);
  }
}

/* ==============================
   APP START
============================== */

window.onload = () => {

  console.log("SAFE SCRIPT LOADED");

  detectTelegramUser();
  loadBalance();
  loadMarkets();
};
