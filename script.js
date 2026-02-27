console.log("SCRIPT LOADED");

// ========================================
// SUPABASE CONFIG
// ========================================
const SUPABASE_URL = "https://liketekvzrazheolmfnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let telegramId = null;    // Telegram user ID
let userEmail = null;     // Logged in email

// ========================================
// START APP — runs when page loads
// ========================================
document.addEventListener("DOMContentLoaded", async () => {

  console.log("DOM LOADED");

  // Step 1: Verify Telegram identity (always required — we're inside Telegram)
  const telegramResult = await secureTelegramLogin();
  if (!telegramResult) return;

  telegramId = telegramResult.telegram_id;

  // Step 2: Check if this Telegram account already has an email linked
  if (telegramResult.email_linked) {
    // Already fully set up — go straight to the app
    console.log("Email already linked, loading app...");
    showApp(telegramResult);
  } else {
    // First time — show email signup/login screen
    console.log("No email linked, showing auth screen...");
    showAuthScreen();
  }
});

// ========================================
// STEP 1: VERIFY TELEGRAM IDENTITY
// Always runs first — proves who the user is
// ========================================
async function secureTelegramLogin() {

  if (!window.Telegram || !window.Telegram.WebApp) {
    alert("Please open this app inside Telegram.");
    return null;
  }

  const tg = window.Telegram.WebApp;
  tg.expand();

  const initData = tg.initData;
  if (!initData) {
    alert("No Telegram authentication data.");
    return null;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/telegram-login`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: initData
    });

    if (!response.ok) {
      const text = await response.text();
      alert("Telegram login failed: " + text);
      return null;
    }

    const data = await response.json();

    // telegram-login returns { telegram_id, balance_points, email_linked, email, ... }
    return {
      telegram_id: String(tg.initDataUnsafe.user.id),
      balance_points: data.balance_points,
      email_linked: data.email_linked,
      email: data.email
    };

  } catch (err) {
    console.error("Telegram login error:", err);
    alert("Connection failed. Please try again.");
    return null;
  }
}

// ========================================
// SHOW AUTH SCREEN (Email signup / login)
// Shown when Telegram account has no email yet
// ========================================
function showAuthScreen() {
  document.getElementById("authScreen").style.display = "block";
  document.getElementById("mainApp").style.display = "none";

  // Switch between signup and login tabs
  window.showTab = function(tab) {
    document.getElementById("signupForm").style.display = tab === "signup" ? "block" : "none";
    document.getElementById("loginForm").style.display  = tab === "login"  ? "block" : "none";
    document.getElementById("tabSignup").classList.toggle("active", tab === "signup");
    document.getElementById("tabLogin").classList.toggle("active",  tab === "login");
  };

  showTab("signup"); // default to signup
}

// ========================================
// SIGN UP with email + password
// Creates a new account and links Telegram ID
// ========================================
window.signup = async function() {
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirm  = document.getElementById("signupConfirm").value;

  if (!email || !password) {
    showAuthError("Please fill in all fields.");
    return;
  }

  if (password !== confirm) {
    showAuthError("Passwords do not match.");
    return;
  }

  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters.");
    return;
  }

  showAuthError("");
  document.getElementById("authSubmitBtn").innerText = "Creating account...";
  document.getElementById("authSubmitBtn").disabled = true;

  try {
    // Call our register edge function
    // It creates the Supabase Auth account + user row + wallet
    const response = await fetch(`${SUPABASE_URL}/functions/v1/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        telegram_id: telegramId,   // link Telegram at signup
        username: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || ""
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showAuthError(data.error || "Signup failed.");
      return;
    }

    // Signup successful — show the app
    userEmail = email;
    showApp({ balance_points: 0, email });

  } catch (err) {
    showAuthError("Connection error. Please try again.");
    console.error(err);
  } finally {
    document.getElementById("authSubmitBtn").innerText = "Create Account";
    document.getElementById("authSubmitBtn").disabled = false;
  }
};

// ========================================
// LOGIN with email + password
// Links this Telegram ID to existing account
// ========================================
window.login = async function() {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showAuthError("Please fill in all fields.");
    return;
  }

  showAuthError("");
  document.getElementById("loginSubmitBtn").innerText = "Logging in...";
  document.getElementById("loginSubmitBtn").disabled = true;

  try {
    // Sign in via Supabase Auth directly
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      showAuthError("Wrong email or password.");
      return;
    }

    // =============================================
    // Link this Telegram ID to the email account
    // So next time they open the app, it auto-logs in
    // =============================================
    await supabase
      .from("users")
      .update({ telegram_id: telegramId })
      .eq("auth_id", authData.user.id);

    // Also make sure wallet uses telegram_id
    await supabase
      .from("wallets")
      .upsert(
        { telegram_id: telegramId, balance_points: 0, balance_eur: 0 },
        { onConflict: "telegram_id", ignoreDuplicates: true }
      );

    // Get their wallet balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance_points")
      .eq("telegram_id", telegramId)
      .single();

    userEmail = email;
    showApp({ balance_points: wallet?.balance_points || 0, email });

  } catch (err) {
    showAuthError("Connection error. Please try again.");
    console.error(err);
  } finally {
    document.getElementById("loginSubmitBtn").innerText = "Login";
    document.getElementById("loginSubmitBtn").disabled = false;
  }
};

function showAuthError(msg) {
  const el = document.getElementById("authError");
  el.innerText = msg;
  el.style.display = msg ? "block" : "none";
}

// ========================================
// SHOW MAIN APP
// Called after successful login/signup
// ========================================
function showApp(data) {
  document.getElementById("authScreen").style.display = "none";
  document.getElementById("mainApp").style.display = "block";

  document.getElementById("balance").innerText = data.balance_points || 0;

  loadMarkets();
  subscribeToWallet();
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
    document.getElementById("balance").innerText = data.balance_points;
  }
}

// ========================================
// REALTIME WALLET UPDATES
// Balance updates live without refresh
// ========================================
function subscribeToWallet() {
  supabase
    .channel("wallet-live")
    .on("postgres_changes",
      { event: "UPDATE", schema: "public", table: "wallets" },
      (payload) => {
        if (payload.new.telegram_id === telegramId) {
          document.getElementById("balance").innerText = payload.new.balance_points;
        }
      }
    )
    .subscribe();
}

// ========================================
// LOAD MARKETS
// ========================================
async function loadMarkets() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-markets`, {
    method: "GET",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const markets = await response.json();
  const container = document.getElementById("markets");
  container.innerHTML = "";

  if (!markets || markets.length === 0) {
    container.innerHTML = "No open markets";
    return;
  }

  markets.forEach(market => {
    const yesPool  = market.yes_pool || 0;
    const noPool   = market.no_pool  || 0;
    const totalPool = yesPool + noPool;

    const yesOdds = yesPool > 0 ? (totalPool / yesPool).toFixed(2) : "1.00";
    const noOdds  = noPool  > 0 ? (totalPool / noPool).toFixed(2)  : "1.00";

    const card = document.createElement("div");
    card.innerHTML = `
      <h4>${market.question}</h4>
      <p>YES Pool: ${yesPool} (x${yesOdds})</p>
      <p>NO Pool: ${noPool} (x${noOdds})</p>
      <button class="yes" onclick="placeTrade('${market.id}','yes')">YES @ x${yesOdds}</button>
      <button class="no"  onclick="placeTrade('${market.id}','no')">NO @ x${noOdds}</button>
    `;
    container.appendChild(card);
  });
}

// ========================================
// PLACE TRADE
// ========================================
window.placeTrade = async function(marketId, option) {
  const amount = prompt("Enter amount in points:");
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  const initData = window.Telegram.WebApp.initData;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/place-trade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      initData,                  // Telegram proof of identity
      market_id: marketId,
      choice: option,
      stake: Number(amount)
    })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Trade failed");
    return;
  }

  alert("Trade placed successfully!");
  await loadBalance();
  await loadMarkets();
};

// ========================================
// STRIPE DEPOSIT
// ========================================
window.deposit = async function() {
  const amount = prompt("Enter amount in EUR:");
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Number(amount), initData: window.Telegram?.WebApp?.initData })
  });

  const data = await response.json();

  if (data.url) {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(data.url);
    } else {
      window.location.href = data.url;
    }
  } else {
    alert(data.error || "Checkout creation failed");
  }
};
