// ========================================
// SUPABASE CONFIG (USE YOUR OWN KEYS)
// ========================================
const SUPABASE_URL = "https://liketekvzrazheolmfnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE";

// Load Supabase from CDN
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;

console.log("Script Loaded");


// ========================================
// GET TELEGRAM USER ID
// ========================================
let telegramId = null;

// If inside Telegram
if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
  telegramId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
} else {
  telegramId = "test_user"; // for browser testing
}

console.log("Telegram ID:", telegramId);


// ========================================
// CHECK USER SESSION ON APP LOAD
// ========================================
async function checkUserSession() {

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {

    console.log("No session → show login");

    document.getElementById("loginBox").style.display = "block";
    document.getElementById("appBox").style.display = "none";

  } else {

    console.log("Session found:", session.user.email);

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("appBox").style.display = "block";

    // Ensure user exists in public.users
    await linkUser(session.user);

    // Load app data
    await loadBalance();
    await loadMarkets();
  }
}


// ========================================
// SIGN UP
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

  // Link user in our database
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

  // Link user in our database
  await linkUser(data.user);

  alert("Login successful");
  checkUserSession();
}


// ========================================
// CREATE OR VERIFY USER IN DATABASE
// ========================================
async function linkUser(user) {

  if (!user) return;

  console.log("Linking user to DB...");

  // 1️⃣ Check if user already exists
  const { data: existingUser, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("Select error:", selectError);
    alert("Select Error: " + selectError.message);
    return;
  }

  // 2️⃣ If not exists → Insert new user
  if (!existingUser) {

    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: user.id,               // MUST match auth.uid()
        email: user.email,
        telegram_id: telegramId
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      alert("Insert Error: " + insertError.message);
      return;
    }

    console.log("User inserted successfully");

    // 3️⃣ Create wallet automatically
    const { error: walletError } = await supabase
      .from("wallets")
      .insert({
        uuid: user.id,
        telegram_id: telegramId,
        balance_eur: 0,
        balance_points: 0
      });

    if (walletError) {
      console.error("Wallet creation error:", walletError);
      alert("Wallet Error: " + walletError.message);
      return;
    }

    console.log("Wallet created");

  } else {
    console.log("User already exists");
  }
}


// ========================================
// LOGOUT
// ========================================
async function logout() {
  await supabase.auth.signOut();
  location.reload();
}


// ========================================
// LOAD BALANCE
// ========================================
async function loadBalance() {

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("wallets")
    .select("balance_points")
    .eq("uuid", user.id)
    .single();

  if (error) {
    console.error("Balance error:", error);
    return;
  }

  document.getElementById("balance").innerText = data.balance_points + " pts";
}


// ========================================
// LOAD MARKETS
// ========================================
async function loadMarkets() {

  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .eq("status", "open");

  if (error) {
    console.error("Markets error:", error);
    return;
  }

  console.log("Markets loaded:", data);

  // You can render them here
}


// ========================================
// START APP
// ========================================
checkUserSession();


// ========================================
// EXPOSE BUTTON FUNCTIONS
// ========================================
window.signup = signup;
window.login = login;
window.logout = logout;
