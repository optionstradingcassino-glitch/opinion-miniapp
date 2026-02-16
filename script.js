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
 window.location.href="https://buy.stripe.com/test_eVq6oGbqtaZee4cg0Q24000";
}

