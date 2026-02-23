// ========================================
// SUPABASE CONFIG
// ========================================
const SUPABASE_URL = "https://liketekvzrazheolmfnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ========================================
// TELEGRAM DATA
// ========================================
let telegramId = null;

if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
  telegramId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
} else {
  telegramId = "test_user";
}


// ========================================
// CHECK SESSION
// ========================================
async function checkUserSession() {

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {

    document.getElementById("loginBox").style.display = "block";
    document.getElementById("appBox").style.display = "none";

  } else {

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("appBox").style.display = "block";

    await loadBalance();
    await loadMarkets();
    subscribeToWallet();
  }
}


// ========================================
// LOAD MARKETS FROM EDGE FUNCTION
// ========================================
async function loadMarkets() {

  try {

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

      const card = document.createElement("div");
      card.id = "marketCard";

      card.innerHTML = `
        <h4>${market.question}</h4>
        <p>YES Pool: ${market.yes_pool || 0}</p>
        <p>NO Pool: ${market.no_pool || 0}</p>
        <button class="yes" onclick="placeTrade('${market.id}','yes')">YES</button>
        <button class="no" onclick="placeTrade('${market.id}','no')">NO</button>
        <hr>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.log("Market load error:", err);
  }
}


// ========================================
// PLACE TRADE (TEMP BASIC)
// ========================================
async function placeTrade(marketId, option) {

  const amount = prompt("Enter amount in points:");
  if (!amount || isNaN(amount)) return;

  alert(`Trade placed: ${option.toUpperCase()} - ${amount} pts (logic to be implemented next)`);
}


// ========================================
// STRIPE DEPOSIT
// ========================================
async function deposit() {

  const amount = prompt("Enter amount in EUR:");
  if (!amount || isNaN(amount)) return;

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        amount: Number(amount)
      })
    }
  );

  const data = await response.json();

  if (data.url) {

    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.openLink(data.url);
    } else {
      window.location.href = data.url;
    }

  } else {
    alert("Checkout creation failed");
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
// REALTIME WALLET
// ========================================
function subscribeToWallet() {

  supabase
    .channel('wallet-updates')
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
async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert(error.message);
    return;
  }

  checkUserSession();
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert(error.message);
    return;
  }

  checkUserSession();
}

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}


// ========================================
checkUserSession();

window.signup = signup;
window.login = login;
window.logout = logout;
window.deposit = deposit;
window.placeTrade = placeTrade;
