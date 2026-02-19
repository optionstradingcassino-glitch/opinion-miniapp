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

  console.log("Opened outside Telegram");
  document.getElementById("user").innerText =
    "Opened outside Telegram (test mode)";

}

// --- TRADE BUTTON ---
function trade(option) {
  alert("You selected: " + option + " (Trading logic later)");
}


// --- DEPOSIT BUTTON ---
async function deposit() {

  try {

    let telegram_id;

    // If inside Telegram, use real user ID
    if (tg && tg.initDataUnsafe?.user?.id) {
      telegram_id = tg.initDataUnsafe.user.id;
    } else {
      // fallback for browser testing
      console.log("Testing outside Telegram → using dummy ID");
      telegram_id = "12345";
    }

    const res = await fetch(
      "https://liketekvzrazheolmfnj.supabase.co/functions/v1/create-checkout-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: telegram_id,
          amount: 10   // default €10 deposit (change later if needed)
        })
      }
    );

    const data = await res.json();

    if (!data.url) {
      alert("Failed to create checkout session");
      console.error(data);
      return;
    }

    // redirect to Stripe checkout
    window.location.href = data.url;

  } catch (err) {

    console.error("Deposit error:", err);
    alert("Deposit failed. Check console.");

  }

}
