/* =========================================================
   OPINION TRADING MINI APP SCRIPT
   Pool-based dynamic odds version
   ========================================================= */

/* ================== 🔑 PUT YOUR ANON KEY HERE ================== */

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2V0ZWt2enJhemhlb2xtZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MzYsImV4cCI6MjA4NjgyNDQzNn0.8Zo-NJ0QmaH95zt3Nh4yV20M0HM5OOH9V0cDs1xYpPE";

/* =============================================================== */

console.log("SCRIPT LOADED");

/* ---------- Telegram object ---------- */
let tg = window.Telegram?.WebApp;


/* =========================================================
   USER DISPLAY
   ========================================================= */
function initUser(){

  if(tg && tg.initDataUnsafe?.user){
    tg.expand();

    document.getElementById("user").innerText =
      "Hello, " + tg.initDataUnsafe.user.first_name;
  }
  else{
    document.getElementById("user").innerText =
      "Opened outside Telegram (test mode)";
  }

}


/* =========================================================
   LOAD WALLET BALANCE
   ========================================================= */
async function loadBalance(){

  try{

    const telegram_id =
      tg?.initDataUnsafe?.user?.id || "12345"; // fallback for browser testing

    const res = await fetch(
      `https://liketekvzrazheolmfnj.supabase.co/rest/v1/wallets?select=*&telegram_id=eq.${telegram_id}`,
      {
        headers:{
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const data = await res.json();

    document.getElementById("balance").innerText =
      "Balance: " + (data[0]?.balance_points || 0) + " points";

  }catch(err){
    console.log("Balance error:",err);
  }

}


/* =========================================================
   LOAD MARKETS + CALCULATE POOL ODDS
   ========================================================= */
async function loadMarkets(){

  try{

    const res = await fetch(
      "https://liketekvzrazheolmfnj.supabase.co/rest/v1/markets?select=*",
      {
        headers:{
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    let markets = await res.json();

    // show only open markets
    markets = markets.filter(m => m.status==="open");

    if(!markets.length){
      document.getElementById("markets").innerHTML="No active markets";
      return;
    }

    let html="";

    for(const m of markets){

      const yes = m.yes_pool || 0;
      const no  = m.no_pool  || 0;
      const total = yes + no;

      // dynamic pool odds
      const yesOdds = yes>0 ? (total/yes).toFixed(2) : "1.00";
      const noOdds  = no>0  ? (total/no ).toFixed(2) : "1.00";

      html+=`
        <div class="market">

          <h3>${m.question}</h3>

          <!-- stake input per market -->
          <input id="stake_${m.id}" type="number" placeholder="Enter points">

          <!-- YES button with live odds -->
          <button class="yes"
            onclick="tradeMarket('${m.id}','YES')">
            YES (${yesOdds}x)
          </button>

          <!-- NO button with live odds -->
          <button class="no"
            onclick="tradeMarket('${m.id}','NO')">
            NO (${noOdds}x)
          </button>

        </div>
      `;
    }

    document.getElementById("markets").innerHTML=html;

  }catch(err){
    console.log("Market load error:",err);
  }

}


/* =========================================================
   PLACE TRADE
   ========================================================= */
async function tradeMarket(marketId,option){

  try{

    const telegram_id =
      tg?.initDataUnsafe?.user?.id || "12345";

    const stake =
      Number(document.getElementById("stake_"+marketId)?.value || 0);

    if(!stake){
      alert("Enter stake first");
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

      loadBalance();   // refresh wallet
      loadMarkets();   // refresh pools + odds immediately

    }else{
      alert(data.error || "Trade failed");
    }

  }catch(err){
    console.log("Trade error:",err);
    alert("Trade failed");
  }

}


/* =========================================================
   DEPOSIT VIA STRIPE
   ========================================================= */
async function deposit(){

  const telegram_id =
    tg?.initDataUnsafe?.user?.id || "12345";

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

    if(tg){
      tg.openLink(data.url);
    }else{
      window.location.href=data.url;
    }

  }

}


/* =========================================================
   START APP
   ========================================================= */
function startApp(){

  initUser();

  if(tg){
    Telegram.WebApp.ready();
    setTimeout(()=>{
      loadBalance();
      loadMarkets();
    },500);
  }
  else{
    loadBalance();
    loadMarkets();
     setInterval(loadMarkets, 5000);  // refresh odds every 5 sec
  }

}

startApp();


/* =========================================================
   IMPORTANT:
   Make tradeMarket visible globally for button onclick
   ========================================================= */
window.tradeMarket = tradeMarket;
