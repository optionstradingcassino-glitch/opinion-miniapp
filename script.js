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

console.log("Telegram ID:", telegramId);


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
    subscribeToWallet(); // 🔥 Enable realtime
  }
}


// ========================================
// SIGNUP
// ========================================
async function signup() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Signup successful");
  checkUserSession();
}


// ========================================
// LOGIN
// ========================================
async function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Login successful");
  checkUserSession();
}


// ========================================
// STRIPE DEPOSIT (Telegram Compatible)
// ========================================
async function deposit() {

  const amount = prompt("Enter amount in EUR:");
  if (!amount || isNaN(amount)) return;

  try {

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

  } catch (err) {
    alert("Deposit error");
  }
}


// ========================================
// LOAD BALANCE
// ========================================
async function loadBalance() {

  const { data, error } = await supabase
    .from("wallets")
    .select("balance_points")
    .eq("telegram_id", telegramId)
    .single();

  if (error) {
    console.log("Balance error:", error);
    return;
  }

  if (data) {
    document.getElementById("balance").innerText =
      data.balance_points;
  }
}


// ========================================
// REALTIME WALLET SUBSCRIPTION
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

          console.log("Wallet updated in realtime:", payload.new.balance_points);

          document.getElementById("balance").innerText =
            payload.new.balance_points;
        }
      }
    )
    .subscribe();

  console.log("Realtime wallet subscription enabled");
}


// ========================================
// LOGOUT
// ========================================
async function logout() {
  await supabase.auth.signOut();
  location.reload();
}


// ========================================
// START APP
// ========================================
checkUserSession();

window.signup = signup;
window.login = login;
window.deposit = deposit;
window.logout = logout;
