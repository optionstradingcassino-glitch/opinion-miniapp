// ========================================
// SUPABASE CONFIG
// ========================================
const SUPABASE_URL = "https://liketekvzrazheolmfnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;


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
async function checkUserSession() {

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("appBox").style.display = "none";
  } else {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("appBox").style.display = "block";

    await loadBalance();
  }
}


// ========================================
// DEPOSIT FUNCTION (REAL STRIPE)
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
        "apikey": SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        amount: Number(amount)
      })
    }
  );

  const data = await response.json();

  if (data.url) {
    window.location.href = data.url;
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


async function logout() {
  await supabase.auth.signOut();
  location.reload();
}


checkUserSession();

window.deposit = deposit;
window.logout = logout;
