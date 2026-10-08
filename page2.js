let yesCount = 0;

const maxClicks = 10;

const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");

const mainText = document.getElementById("mainText");
const subText = document.getElementById("subText");
const counter = document.getElementById("counter");


const messages = [

    [
        "Please maan jao na 🥺",
        "Mujhse sach mein galti ho gayi ❤️"
    ],

    [
        "Abhi bhi naraz ho? 🥺",
        "Please mujhe maaf kar do"
    ],

    [
        "I'm really sorry 😔",
        "Please ek baar meri baat sun lo"
    ],

    [
        "Meri galti thi 🥺",
        "Please gussa mat karo ❤️"
    ],

    [
        "Ek chance de do please 😔",
        "Main dil se sorry bol raha hoon"
    ],

    [
        "Please mujhe forgive kar do 🥺",
        "I promise I'll do better ❤️"
    ],

    [
        "Bas thoda sa maan jao na 😔",
        "Tumhari narazgi achhi nahi lagti"
    ],

    [
        "Please ab gussa chhod do 🥺",
        "I really mean my sorry ❤️"
    ],

    [
        "Ek baar smile kar do please 🥺",
        "Mujhe maaf kar do"
    ],

    [
        "Thank you 🥺❤️",
        "Ab please mujhe maaf kar do"
    ]

];


// =========================
// YES BUTTON
// =========================

yesBtn.addEventListener("click", function () {

    yesCount++;

    counter.innerText =
        "YES clicks: " + yesCount + " / 10";


    mainText.innerText =
        messages[yesCount - 1][0];

    subText.innerText =
        messages[yesCount - 1][1];


    // 10 YES clicks
    if (yesCount >= 10) {

        setTimeout(function () {

            window.location.href = "page3.html";

        }, 800);

    }

});


// =========================
// NO BUTTON BHAAGEGA
// =========================

function moveNoButton() {

    const buttonWidth = noBtn.offsetWidth;
    const buttonHeight = noBtn.offsetHeight;

    const maxX =
        window.innerWidth - buttonWidth - 20;

    const maxY =
        window.innerHeight - buttonHeight - 20;


    const randomX =
        Math.floor(Math.random() * maxX);

    const randomY =
        Math.floor(Math.random() * maxY);


    noBtn.style.position = "fixed";

    noBtn.style.left =
        Math.max(10, randomX) + "px";

    noBtn.style.top =
        Math.max(10, randomY) + "px";

}


// Desktop
noBtn.addEventListener("mouseenter", function () {

    moveNoButton();

});


// Mobile
noBtn.addEventListener("touchstart", function (event) {

    event.preventDefault();

    moveNoButton();

});