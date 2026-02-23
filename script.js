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
let telegramUsername = null;

if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
  telegramId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
  telegramUsername =
    window.Telegram.WebApp.initDataUnsafe.user.username || null;
} else {
  telegramId = "test_user";
  telegramUsername = "test_username";
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

    await linkUser(session.user);
    await loadBalance();
    await loadMarkets();
  }
}


// ========================================
// SIGNUP
// ========================================
async function signup() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  await linkUser(data.user);

  alert("Signup successful");
  checkUserSession();
}


// ========================================
// LOGIN
// ========================================
async function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  await linkUser(data.user);

  alert("Login successful");
  checkUserSession();
}


// ========================================
// LINK USER (FIXED LOGIC)
// ========================================
async function linkUser(user) {

  if (!user) return;

  // 1️⃣ Check if telegram_id already exists
  const { data: existingTelegramUser } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (existingTelegramUser) {

    console.log("Telegram user already exists");

    // Optional: update username if changed
    await supabase
      .from("users")
      .update({ username: telegramUsername })
      .eq("telegram_id", telegramId);

    return;
  }

  // 2️⃣ Insert new user
  const { error: insertError } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email,
      telegram_id: telegramId,
      username: telegramUsername
    });

  if (insertError) {
    alert(insertError.message);
    return;
  }

  console.log("User created");

  // 3️⃣ Create wallet
  await supabase
    .from("wallets")
    .insert({
      id: user.id,
      telegram_id: telegramId,
      balance_eur: 0,
      balance_points: 0
    });

  console.log("Wallet created");
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
      data.balance_points + " pts";
  }
}


// ========================================
// LOAD MARKETS
// ========================================
async function loadMarkets() {

  const { data } = await supabase
    .from("markets")
    .select("*")
    .eq("status", "open");

  console.log("Markets:", data);
}


// ========================================
async function logout() {
  await supabase.auth.signOut();
  location.reload();
}


// ========================================
checkUserSession();

window.signup = signup;
window.login = login;
window.logout = logout;
