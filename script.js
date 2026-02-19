console.log("SAFE SCRIPT LOADED");

let tg = window.Telegram?.WebApp;

// ---------- INIT USER ----------
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
      "Opened outside Telegram";
  }
}

// ---------- LOAD BALANCE ----------
async function loadBalance(){

  try{

    const telegram_id = tg?.initDataUnsafe?.user?.id || "12345";

    const res = await fetch(
      "https://liketekvzrazheolmfnj.supabase.co/rest/v1/wallets?select=*&telegram_id=eq."+telegram_id,
      {
        headers:{
          "apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE",
          "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE"
        }
      }
    );

    const data = await res.json();

    document.getElementById("balance").innerText =
      "Balance: " + (data[0]?.balance_points || 0) + " points";

  }catch(e){
    console.log("Balance error",e);
  }
}


// ---------- LOAD MARKETS WITH POOL ODDS ----------
async function loadMarkets(){

  try{

    const res = await fetch(
      "https://liketekvzrazheolmfnj.supabase.co/rest/v1/markets?select=*",
      {
        headers:{
          "apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE",
          "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE"
        }
      }
    );

    let markets = await res.json();

    // only open markets
    markets = markets.filter(m => m.status === "open");

    if(!markets.length){
      document.getElementById("markets").innerHTML="No active markets";
      return;
    }

    let html="";

    for(const m of markets){

      const yes = m.yes_pool || 0;
      const no  = m.no_pool  || 0;
      const total = yes+no;

      const yesOdds = yes>0 ? (total/yes).toFixed(2) : "1.00";
      const noOdds  = no>0  ? (total/no ).toFixed(2) : "1.00";

      html+=`
        <div class="market">
          <h3>${m.question}</h3>

          <input id="stake_${m.id}" type="number"
            placeholder="Enter points">

          <button class="yes"
            onclick="tradeMarket('${m.id}','YES')">
            YES (${yesOdds}x)
          </button>

          <button class="no"
            onclick="tradeMarket('${m.id}','NO')">
            NO (${noOdds}x)
          </button>
        </div>
      `;
    }

    document.getElementById("markets").innerHTML=html;

  }catch(e){
    console.log("Market load error",e);
  }
}


// ---------- TRADE ----------
async function tradeMarket(marketId,option){

  try{

    const telegram_id = tg?.initDataUnsafe?.user?.id || "12345";
    const stake =
      Number(document.getElementById("stake_"+marketId).value||0);

    if(!stake){
      alert("Enter stake");
      return;
    }

    const res = await fetch(
      "https://liketekvzrazheolmfnj.supabase.co/functions/v1/place-trade",
      {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          telegram_id,
          market_id:marketId,
          choice:option,
          stake
        })
      }
    );

    const data = await res.json();

    if(data.success){
      alert("Trade placed!");
      loadBalance();
      loadMarkets(); // refresh odds after trade
    }else{
      alert("Trade failed");
    }

  }catch(e){
    console.log("Trade error",e);
  }
}


// ---------- DEPOSIT ----------
async function deposit(){

  const telegram_id = tg?.initDataUnsafe?.user?.id || "12345";

  const res = await fetch(
    "https://liketekvzrazheolmfnj.supabase.co/functions/v1/create-checkout-session",
    {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        telegram_id,
        amount:10
      })
    }
  );

  const data = await res.json();

  if(data.url){
    if(tg) tg.openLink(data.url);
    else window.location.href=data.url;
  }
}


// ---------- START ----------
function startApp(){

  initUser();

  if(tg){
    Telegram.WebApp.ready();
    setTimeout(()=>{
      loadBalance();
      loadMarkets();
    },500);
  }else{
    loadBalance();
    loadMarkets();
  }
}

startApp();
