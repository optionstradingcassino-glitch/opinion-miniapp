let tg = window.Telegram.WebApp;

tg.expand();

if(tg.initDataUnsafe?.user){
document.getElementById("user").innerText =
"Hello, " + tg.initDataUnsafe.user.first_name;
}else{
document.getElementById("user").innerText =
"Hello, Telegram user detected";
}

function trade(option){
alert("You selected: " + option + " (Trading logic later)");
}

function deposit(){
 async function deposit(){

const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

const res = await fetch(
"https://liketekvzrazheolmfnj.supabase.co/functions/v1/create-checkout-session",
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
telegram_id: user.id,
amount: 10
})
});

const data = await res.json();

window.location.href = data.url;
}


//redeploy trigger
