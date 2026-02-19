console.log("SAFE SCRIPT LOADED");

// ---------------- TELEGRAM INIT ----------------

// Detect Telegram environment safely
let tg = window.Telegram?.WebApp;

// Show username if inside Telegram
if (tg) {

  tg.expand();

  if (tg.initDataUnsafe?.user) {
    document.getElementById("user").innerText =
      "Hello, " + tg.initDataUnsafe.user.first_name;
  } else {
    document.getElementById("user").innerText =
      "Hello, Telegram user detected";
  }

} else {

  // Browser testing mode
  document.getElementById("user").innerText =
    "Opened outside Telegram (test mode)";
}


// ---------------- LOAD WALLET BALANCE ----------------

async function loadBalance(){

  try{

    let telegram_id;

    // Get real Telegram ID if inside Telegram
    if (tg && tg.initDataUnsafe?.user?.id){
      telegram_id = tg.initDataUnsafe.user.id;
    } else {
      telegram_id = "12345"; // fallback for browser testing
    }

    // Fetch wallet from Supabase REST API
    const res = await fetch(
      "https://liketekvzrazheolmfnj.supabase.co/rest/v1/wallets?telegram_id=eq."+telegram_id,
      {
        headers:{
          // ⚠️ REPLACE THIS WITH YOUR REAL ANON KEY
          "apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE",
          "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE"
        }
      }
    );

    const data = await res.json();

    // Update balance on screen
    if(data.length>0){
      document.getElementById("balance").innerText =
        "Balance: " + data[0].balance_points + " points";
    }else{
      document.getElementById("balance").innerText =
        "Balance: 0 points";
    }

  }catch(err){
    console.error("Balance load error:", err);
  }

}


// ---------------- TRADE BUTTON ----------------

function trade(option){
  alert("You selected: " + option + " (Trading logic next step)");
}


// ---------------- DEPOSIT BUTTON ----------------

async function deposit(){

  try {

    let telegram_id;

    if (tg && tg.initDataUnsafe?.user?.id){
      telegram_id = tg.initDataUnsafe.user.id;
    } else {
      telegram_id = "12345"; // browser fallback
    }

    // Call backend to create Stripe checkout session
    const res = await fetch(
      "https://liketekvzrazheolmfnj.supabase.co/functions/v1/create-checkout-session",
      {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          telegram_id: telegram_id,
          amount: 10
        })
      }
    );

    const data = await res.json();
    console.log("Checkout response:", data);

    if(!data.url){
      alert("Checkout session failed");
      return;
    }

    // Open Stripe safely outside Telegram iframe
    if (tg) {
      tg.openLink(data.url);
    } else {
      window.location.href = data.url;
    }

  } catch(err){

    console.error("Deposit error:", err);
    alert("Deposit failed — check console");

  }

}


// ---------------- AUTO LOAD BALANCE ON START ----------------

loadBalance();
