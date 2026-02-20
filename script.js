/********************************************************************
 OPTIONS TRADING MINI APP - SAFE FULL SCRIPT
********************************************************************/

/******************** CONFIG ************************/

// 🔴 PASTE YOUR VALUES HERE
const SUPABASE_URL = "https://liketekvzrazheolmfnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE";

// Edge function endpoints
const PLACE_TRADE_URL = `${SUPABASE_URL}/functions/v1/place-trade`;
const CREATE_CHECKOUT_URL = `${SUPABASE_URL}/functions/v1/create-checkout-session`;

/******************** GLOBAL STATE ************************/

// Telegram user id must be global so all functions can use it
let telegramId = null;

/******************** TELEGRAM INIT ************************/

const tg = window.Telegram?.WebApp;
tg?.expand();

// Detect Telegram user safely
if (tg && tg.initDataUnsafe?.user) {

  telegramId = tg.initDataUnsafe.user.id.toString();

  document.getElementById("user").innerText =
    "Hello, " + tg.initDataUnsafe.user.first_name;

} else {

  // fallback for browser testing only
  telegramId = "12345";

  document.getElementById("user").innerText =
    "Hello, Options Trading";

}

console.log("Telegram ID:", telegramId);

/******************** LOAD WALLET ************************/

async function loadBalance() {

  try {

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wallets?telegram_id=eq.${telegramId}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const data = await res.json();

    if (data.length > 0) {
      document.getElementById("balance").innerText =
        `Balance: ${Math.floor(data[0].points)} points`;
    } else {
      document.getElementById("balance").innerText =
        "Balance: 0 points";
    }

  } catch (err) {

    console.error("Balance load error", err);
    document.getElementById("balance").innerText =
      "Balance error";

  }

}

/******************** LOAD MARKETS + ODDS ************************/

async function loadMarkets() {

  try {

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/markets?status=eq.open`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const markets = await res.json();

    const container = document.getElementById("markets");
    container.innerHTML = "";

    if (!markets.length) {
      container.innerHTML = "<p>No active markets</p>";
      return;
    }

    markets.forEach(m => {

      const yesPool = Number(m.yes_pool || 0);
      const noPool = Number(m.no_pool || 0);
      const total = yesPool + noPool;

      // Pool odds logic
      let yesOdds = 1.8;
      let noOdds = 1.8;

      if (total > 0) {
        yesOdds = (total / (yesPool || 1)).toFixed(2);
        noOdds = (total / (noPool || 1)).toFixed(2);
      }

      container.innerHTML += `
        <div class="market-card">

          <h3>${m.question}</h3>

          <input
            type="number"
            id="amount-${m.id}"
            placeholder="Enter points"
          />

          <br><br>

          <button onclick="tradeMarket('${m.id}','yes')">
            YES (${yesOdds}x)
          </button>

          <button onclick="tradeMarket('${m.id}','no')">
            NO (${noOdds}x)
          </button>

        </div>
      `;
    });

  } catch (err) {

    console.error("Markets load error", err);

  }

}

/******************** PLACE TRADE ************************/

async function tradeMarket(marketId, option) {

  try {

    const input = document.getElementById(`amount-${marketId}`);
    const amount = Number(input.value);

    if (!amount || amount <= 0) {
      alert("Enter valid points");
      return;
    }

    const res = await fetch(PLACE_TRADE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        market_id: marketId,
        option: option,
        amount_points: amount
      })
    });

    const data = await res.json();
    console.log("Trade response:", data);

    if (!res.ok) {
      alert("Trade failed");
      return;
    }

    alert("Trade placed!");

    // reload wallet + markets after trade
    loadBalance();
    loadMarkets();

  } catch (err) {

    console.error("Trade error", err);
    alert("Trade error");

  }

}

/******************** STRIPE DEPOSIT ************************/

async function deposit() {

  try {

    const res = await fetch(CREATE_CHECKOUT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        telegram_id: telegramId
      })
    });

    const data = await res.json();

    if (data.url) {
      window.open(data.url, "_blank");
    } else {
      alert("Checkout session failed");
    }

  } catch (err) {

    console.error("Deposit error:", err);

  }

}

/******************** INIT APP ************************/

loadBalance();
loadMarkets();
