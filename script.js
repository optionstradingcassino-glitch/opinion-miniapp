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
          "apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE",
          "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE"
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


// ---------------- LOAD MARKETS ----------------

async function loadMarkets(){

  try{

    const res = await fetch(
      "https://liketekvzrazheolmfnj.supabase.co/rest/v1/markets?status=eq.open",
      {
        headers:{
          "apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE",
          "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE"
        }
      }
    );

    const markets = await res.json();

    if(!markets.length){
      document.getElementById("markets").innerHTML = "No active markets";
      return;
    }

    let html = "";

    for(const m of markets){

      html += `
        <div style="margin:20px;padding:15px;border:1px solid #334155;border-radius:10px;">
          <h3>${m.question}</h3>
          <button class="yes" onclick="tradeMarket('${m.id}','YES')">YES</button>
          <button class="no" onclick="tradeMarket('${m.id}','NO')">NO</button>
        </div>
      `;
    }

    document.getElementById("markets").innerHTML = html;

  }catch(err){
    console.error("Market load error:", err);
  }

}


// ---------------- TRADE PER MARKET ----------------

async function tradeMarket(marketId, option){

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
          market_id: marketId,
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


// ---------------- DEPOSIT ----------------

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


// ---------------- START APP SAFELY ----------------

function startApp(){

  initUser();

  if (tg){
    Telegram.WebApp.ready();
    setTimeout(()=>{
      loadBalance();
      loadMarkets();   // ⭐ NEW: load markets automatically
    },500);
  }else{
    loadBalance();
    loadMarkets();
  }

}

startApp();
