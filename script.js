console.log("SAFE SCRIPT LOADED");

// ---------------- TELEGRAM INIT ----------------

let tg = window.Telegram?.WebApp;

function initUser(){

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

    document.getElementById("user").innerText =
      "Opened outside Telegram (test mode)";
  }

}


// ---------------- LOAD WALLET BALANCE ----------------

async function loadBalance(){

  try{

    let telegram_id;

    if (tg && tg.initDataUnsafe?.user?.id){
      telegram_id = tg.initDataUnsafe.user.id;
    } else {
      telegram_id = "12345";
    }

    const res = await fetch(
      "https://liketekvzrazheolmfnj.supabase.co/rest/v1/wallets?telegram_id=eq."+telegram_id,
      {
        headers:{
          "apikey":"",eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8ZoNJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE
          "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8ZoNJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE"
        }
      }
    );

    const data = await res.json();

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


// ---------------- PROFIT PREVIEW ----------------

function updatePreview(){

  const stake = Number(document.getElementById("stake").value || 0);

  if(stake>0){
    const payout = Math.floor(stake * 1.8);
    document.getElementById("profitPreview").innerText =
      "If you win → " + payout + " points";
  }else{
    document.getElementById("profitPreview").innerText = "";
  }

}


// ---------------- TRADE FUNCTION ----------------

async function trade(option){

  try{

    let telegram_id;

    if (tg && tg.initDataUnsafe?.user?.id){
      telegram_id = tg.initDataUnsafe.user.id;
    } else {
      telegram_id = "12345";
    }

    const stakeValue = Number(document.getElementById("stake").value || 0);

    if(stakeValue <= 0){
      alert("Enter stake first");
      return;
    }

    const res = await fetch(
      "https://liketekvzrazheolmfnj.supabase.co/functions/v1/place-trade",
      {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          telegram_id: telegram_id,
          market_id: "65bc2ad9-b335-40b6-b60f-12bdd2964afa",
          choice: option,
          stake: stakeValue
        })
      }
    );

    const data = await res.json();
    console.log("Trade response:", data);

    if(data.success){
      alert("Trade placed!");
      document.getElementById("stake").value="";
      updatePreview();
      loadBalance();
    }else{
      alert("Trade failed");
    }

  }catch(err){
    console.error("Trade error:", err);
    alert("Trade error");
  }

}


// ---------------- DEPOSIT FUNCTION ----------------

async function deposit(){

  try {

    let telegram_id;

    if (tg && tg.initDataUnsafe?.user?.id){
      telegram_id = tg.initDataUnsafe.user.id;
    } else {
      telegram_id = "12345";
    }

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


// ---------------- SAFE START ----------------

function startApp(){

  initUser();

  if (tg){
    Telegram.WebApp.ready();
    setTimeout(loadBalance, 500);
  }else{
    loadBalance();
  }

}

startApp();
