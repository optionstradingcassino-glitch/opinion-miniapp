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
alert("Stripe deposit coming soon");
}
