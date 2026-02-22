// ===== SUPABASE SETUP =====
// Replace these with your real values
const SUPABASE_URL = "https://liketekvzrazheolmfnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE";

// Import from CDN
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Create client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose for console testing
window.supabase = supabase;

console.log("Auth + Trading script loaded");


// ===== TELEGRAM USER DETECTION =====
let telegramId = null;

if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
  telegramId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
} else {
  telegramId = "test_telegram"; // fallback for browser testing
}

console.log("Telegram ID:", telegramId);


// =====================================================
// =============== AUTH FUNCTIONS =======================
// =====================================================

// ===== SIGNUP =====
async function signup(){

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if(error){
    alert(error.message);
    return;
  }

  // Save user to your custom users table
  await linkUser(data.user);

  alert("Signup successful!");
}


// ===== LOGIN =====
async function login(){

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    alert(error.message);
    return;
  }

  await linkUser(data.user);

  alert("Login successful!");
}


// ===== LINK AUTH USER TO TELEGRAM =====
async function linkUser(user){

  if(!user) return;

  await supabase
    .from("users")
    .upsert({
      id: user.id,
      email: user.email,
      telegram_id: telegramId
    });

  console.log("User linked:", user.email);
}


// =====================================================
// =============== YOUR EXISTING APP ====================
// =====================================================

// NOTE: keep your existing wallet load / market load / trade code BELOW this

// Example:
// loadBalance();
// loadMarkets();


// =====================================================
// =============== OPTIONAL CONSOLE TEST ================
// =====================================================

// Now you can test in console:
// supabase.auth.signUp({ email:"a@a.com", password:"12345678" })
