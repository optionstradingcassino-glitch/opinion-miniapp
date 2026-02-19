console.log("SAFE SCRIPT LOADED");

// Detect Telegram WebApp safely
let tg = window.Telegram?.WebApp;

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
  console.log("Opened outside Telegram (browser test)");
  document.getElementById("user").innerText =
    "Opened outside Telegram (test mode)";
}


// TRADE BUTTON
function trade(option){
  alert("You selected: " + option + " (Trading logic later)");
}


// DEPOSIT BUTTON (SAFE TELEGRAM VERSION)
async function deposit(){

  try {

    let telegram_id;

    if (tg && tg.initDataUnsafe?.user?.id){
      telegram_id = tg.initDataUnsafe.user.id;
    } else {
      telegram_id = "12345";   // fallback for browser testing
      console.log("Using fallback telegram_id:", telegram_id);
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

    // ✅ THIS IS THE IMPORTANT SAFE TELEGRAM OPEN
    if (tg) {
      tg.openLink(data.url);      // opens outside Telegram iframe
    } else {
      window.location.href = data.url;
    }

  } catch(err){

    console.error("Deposit error:", err);
    alert("Deposit failed — check console");

  }

}
