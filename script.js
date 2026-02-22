// ===============================
// SUPABASE CONFIG  (PUT YOURS)
// ===============================
const SUPABASE_URL = "https://liketekvzrazheolmfnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE";

// Load Supabase from CDN
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Create client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;

console.log("SCRIPT LOADED");


// ===============================
// TELEGRAM USER ID
// ===============================
let telegramId = null;

if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
  telegramId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
} else {
  telegramId = "test_user"; // browser testing fallback
}

console.log("Telegram:", telegramId);


// ===============================
// CHECK SESSION ON LOAD
// ===============================
async function checkUserSession(){

  const { data: { session } } = await supabase.auth.getSession();

  if(!session){

    console.log("NO SESSION → SHOW LOGIN");

    document.getElementById("loginBox").style.display = "block";
    document.getElementById("appBox").style.display = "none";

  } else {

    console.log("SESSION FOUND:", session.user.email);

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("appBox").style.display = "block";

    await linkUser(session.user);

    // LOAD YOUR APP ONLY HERE
    loadBalance();
    loadMarkets();
  }
}


// ===============================
// SIGNUP
// ===============================
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

  await linkUser(data.user);

  alert("Signup success");
  checkUserSession();
}


// ===============================
// LOGIN
// ===============================
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

  alert("Login success");
  checkUserSession();
}


// ===============================
// LINK USER TO DB
// ===============================
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


// ===============================
// LOGOUT (optional)
// ===============================
async function logout(){
  await supabase.auth.signOut();
  location.reload();
}


// ===============================
// YOUR EXISTING APP FUNCTIONS
// ===============================

// keep your real implementations here

async function loadBalance(){
  console.log("LOAD BALANCE HERE");
}

async function loadMarkets(){
  console.log("LOAD MARKETS HERE");
}


// ===============================
// START APP
// ===============================
checkUserSession();
