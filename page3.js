(function () {
    "use strict";

    var MAX_HITS = 10;                 // frustration reaches 0% and the banner appears; shooting never stops
    var hits = 0, score = 0, soundOn = true, audioCtx = null, verdictShown = false, combo = 0, levelNo = 1, started = false;

    var $ = function (id) { return document.getElementById(id); };
    var game = $("game"), target = $("target"), wrap = $("targetWrap"), swing = $("swing");
    var fx = $("fx"), crosshair = $("crosshair"), soundBtn = $("soundBtn");
    var weapon = $("weapon"), gun = $("gun"), arena = $("arena"), comboEl = $("combo"), ammoEl = $("ammo"), statusEl = $("weaponStatus"), levelToast = $("levelToast"), gameIntro = $("gameIntro"), startGame = $("startGame");
    var gameComment = $("gameComment");

    var hitComments = [
        "Isko toh nahi chhodungi!",
        "Aaj bachne ka koi chance nahi!",
        "Ab batao, maafi kaise maangte hain!",
        "Ek aur! Abhi gussa khatam nahi hua!",
        "Ruko zara… abhi hisaab baaki hai!",
        "Aaj toh poora gussa niklega!",
        "Ab kahan bhaagoge?",
        "Ye lo meri taraf se!",
        "Galti ki hai, punishment toh milegi!",
        "Bas? Itni si sorry se nahi maanungi!",
        "Aaj toh tumhari khair nahi!",
        "Abhi toh trailer tha!",
        "Gussa meter: FULL",
        "Hisaab barabar karna hai!",
        "Ab samjho meri power!"
    ];

    function showGameComment(index) {
        if (!gameComment) return;
        gameComment.textContent = hitComments[index % hitComments.length];
        gameComment.classList.remove("show");
        void gameComment.offsetWidth;
        gameComment.classList.add("show");
    }
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function beginGame() {
        started = true;
        if (gameIntro) {
            gameIntro.classList.add("started");
            setTimeout(function(){ gameIntro.hidden = true; }, 420);
        }
        if (statusEl) statusEl.textContent = "LOCKED";
        if (soundOn) playShot(false);
    }
    if (startGame) startGame.addEventListener("click", beginGame);
    var TIP = 150;                     // barrel length in px

    function rand(a, b) { return a + Math.random() * (b - a); }

    function spawn(cls, x, y, vars, life) {
        var el = document.createElement("div");
        el.className = cls;
        el.style.left = x + "px";
        el.style.top = y + "px";
        for (var k in vars) el.style.setProperty(k, vars[k]);
        fx.appendChild(el);
        setTimeout(function () { el.remove(); }, life || 1600);
        return el;
    }

    function retrigger(el, cls, ms) {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
        setTimeout(function () { el.classList.remove(cls); }, ms);
    }

    /* ---------- sound: crack + boom + room tail + thud, all synthesised ---------- */
    function noise(c, secs, power) {
        var len = Math.floor(c.sampleRate * secs), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, power);
        var s = c.createBufferSource(); s.buffer = b; return s;
    }
    function playShot(isHit) {
        if (!soundOn) return;
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            audioCtx = audioCtx || new AC();
            if (audioCtx.state === "suspended") audioCtx.resume();
            var c = audioCtx, t = c.currentTime, v = rand(0.9, 1.1);

            var crack = noise(c, 0.06, 2), hp = c.createBiquadFilter(), cg = c.createGain();
            hp.type = "highpass"; hp.frequency.value = 1500 * v; cg.gain.value = 0.7;
            crack.connect(hp); hp.connect(cg); cg.connect(c.destination); crack.start(t);

            var o = c.createOscillator(), og = c.createGain();
            o.frequency.setValueAtTime(170 * v, t);
            o.frequency.exponentialRampToValueAtTime(38, t + 0.16);
            og.gain.setValueAtTime(0.7, t);
            og.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            o.connect(og); og.connect(c.destination); o.start(t); o.stop(t + 0.22);

            var tail = noise(c, 0.7, 4), lp = c.createBiquadFilter(), tg = c.createGain();
            lp.type = "lowpass"; lp.frequency.value = 900; tg.gain.value = 0.22;
            tail.connect(lp); lp.connect(tg); tg.connect(c.destination); tail.start(t + 0.03);

            if (isHit) {                                   // dull thud on the poster
                var th = c.createOscillator(), thg = c.createGain();
                th.type = "triangle"; th.frequency.setValueAtTime(110, t + 0.04);
                th.frequency.exponentialRampToValueAtTime(55, t + 0.14);
                thg.gain.setValueAtTime(0.35, t + 0.04);
                thg.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
                th.connect(thg); thg.connect(c.destination); th.start(t + 0.04); th.stop(t + 0.18);
            }
        } catch (e) { /* sound is optional */ }
    }
    soundBtn.addEventListener("click", function () {
        soundOn = !soundOn;
        soundBtn.textContent = soundOn ? "🔊 SOUND ON" : "🔇 SOUND OFF";
    });

    /* ---------- crosshair + weapon aim ---------- */
    function aim(clientX, clientY) {
        var r = game.getBoundingClientRect();
        var a = Math.atan2(clientX - r.left - r.width / 2, -(clientY - r.top - (r.height + 20)));
        a = Math.max(-1.2, Math.min(1.2, a));
        weapon.style.transform = "translateX(-50%) rotate(" + a + "rad)";
        crosshair.style.left = (clientX - r.left) + "px";
        crosshair.style.top = (clientY - r.top) + "px";
        return a;
    }
    game.addEventListener("pointermove", function (e) {
        if (e.pointerType === "mouse") crosshair.classList.add("on");
        aim(e.clientX, e.clientY);
    });
    game.addEventListener("pointerleave", function () { crosshair.classList.remove("on"); });

    /* ---------- one shot (unlimited) ---------- */
    
    function addDamage(clientX, clientY) {
        var overlay = document.getElementById("damageOverlay");
        if (!overlay) return;

        var b = target.getBoundingClientRect();
        var x = Math.max(6, Math.min(94, ((clientX - b.left) / b.width) * 100));
        var y = Math.max(6, Math.min(94, ((clientY - b.top) / b.height) * 100));

        var hit = document.createElement("span");
        hit.className = "damage-hit";
        hit.style.left = x + "%";
        hit.style.top = y + "%";
        hit.style.setProperty("--r", rand(-20, 20) + "deg");
        overlay.appendChild(hit);

        for (var i = 0; i < 4; i++) {
            var crack = document.createElement("i");
            crack.className = "damage-crack";
            crack.style.left = x + "%";
            crack.style.top = y + "%";
            crack.style.setProperty("--a", rand(0, 360) + "deg");
            crack.style.setProperty("--l", rand(18, 38) + "px");
            overlay.appendChild(crack);
        }
    }

function fire(clientX, clientY, isHit) {
        if (!started) return;
        var r = game.getBoundingClientRect();
        var x = clientX - r.left, y = clientY - r.top;
        var a = aim(clientX, clientY);
        var busy = fx.childElementCount > 160;

        crosshair.classList.add("on");
        retrigger(crosshair, "fire", 220);
        retrigger(gun, "kick", 170);
        playShot(isHit);

        // muzzle flash + tracer start at the barrel tip
        var px = r.width / 2, py = r.height + 20;
        var tx = px + TIP * Math.sin(a), ty = py - TIP * Math.cos(a);
        spawn("muzzle", tx, ty, {}, 300);
        var dx = x - tx, dy = y - ty;
        spawn("tracer", tx, ty, {
            width: Math.sqrt(dx * dx + dy * dy) + "px",
            transform: "rotate(" + Math.atan2(dy, dx) + "rad)"
        }, 300);

        // ejected brass
        spawn("casing", px + 80 * Math.sin(a) + 14, py - 80 * Math.cos(a), {
            "--cx": rand(40, 110) + "px", "--cr": rand(200, 600) + "deg"
        }, 1000);

        // impact: bloom, ring, gravity sparks, drifting smoke
        spawn("bloom", x, y, {}, 400);
        var n = isHit ? 14 : 6;
        if (isHit) spawn("ring", x, y, {}, 600);
        for (var i = 0; i < n; i++) {
            var ang = rand(0, Math.PI * 2), dist = rand(30, 110);
            spawn("spark", x, y, {
                "--dx": Math.cos(ang) * dist + "px",
                "--dy": Math.sin(ang) * dist + "px",
                "--r": (ang * 180 / Math.PI + 90) + "deg"
            }, 700);
        }
        if (!busy) {
            for (var s = 0; s < (isHit ? 3 : 1); s++) spawn("smoke", x - 40 + rand(-14, 14), y - 40, { "--sx": rand(-40, 40) + "px" }, 1700);
        }

        // camera kick
        if (!reduceMotion) retrigger(game, "shake", 320);
        retrigger(game, "hit", 300);

        if (!isHit) {
            combo = 0;
            if (comboEl) comboEl.innerHTML = "COMBO <b>0</b>";
            if (statusEl) statusEl.textContent = "MISS";
            return;
        }

        // poster reacts: recoil, swings on its rail away from the impact, drifts
        score += 100 + combo * 25; hits++;
        showGameComment(hits - 1);
        addDamage(clientX, clientY);
        combo++;
        if (comboEl) comboEl.innerHTML = "COMBO <b>" + combo + "</b>";
        if (ammoEl) ammoEl.textContent = "∞";
        if (statusEl) statusEl.textContent = "HIT CONFIRMED";
        if (combo >= 3 && !reduceMotion) retrigger(comboEl, "comboPulse", 300);
        var newLevel = Math.floor(hits / 3) + 1;
        if (newLevel > levelNo) {
            levelNo = newLevel;
            if (levelToast) {
                levelToast.textContent = "LEVEL " + levelNo;
                retrigger(levelToast, "show", 850);
            }
            if (statusEl) statusEl.textContent = "LEVEL UP";
        }
        retrigger(target, "recoil", 240);
        var b = target.getBoundingClientRect();
        var dir = (clientX < b.left + b.width / 2) ? 1 : -1;
        var amp = (reduceMotion ? 1 : rand(3, 5.5)) * dir;
        swing.animate([
            { transform: "rotate(0deg)" },
            { transform: "rotate(" + amp + "deg)" },
            { transform: "rotate(" + (-amp * 0.6) + "deg)" },
            { transform: "rotate(" + (amp * 0.35) + "deg)" },
            { transform: "rotate(" + (-amp * 0.15) + "deg)" },
            { transform: "rotate(0deg)" }
        ], { duration: 1300, easing: "ease-out" });
        moveTarget();

        $("score").textContent = score;
        $("hits").textContent = hits;
        var lvl = Math.max(0, 100 - hits * 10);
        $("level").textContent = lvl;
        $("meterFill").style.width = lvl + "%";
        retrigger($("score").parentNode, "bump", 260);
        retrigger($("hits").parentNode, "bump", 260);

        if (hits >= MAX_HITS && !verdictShown) {
            verdictShown = true;
            setTimeout(function () { $("verdict").hidden = false; }, 700);
        }
    }

    function moveTarget() {
        var reach = Math.min(window.innerWidth * 0.1, 60);
        wrap.style.setProperty("--tx", rand(-reach, reach) + "px");
        wrap.style.setProperty("--ty", rand(-18, 18) + "px");
        wrap.style.setProperty("--rot", rand(-2, 2) + "deg");
        wrap.style.setProperty("--sc", rand(0.95, 1.02));
    }

    /* ---------- input ---------- */
    target.addEventListener("pointerdown", function (e) {      // arcade lock-marker hit
        e.preventDefault();
        e.stopPropagation();
        fire(e.clientX, e.clientY, true);
    });
    target.addEventListener("click", function (e) {            // keyboard (Enter / Space)
        if (e.detail !== 0) return;
        var b = target.getBoundingClientRect();
        fire(b.left + b.width / 2, b.top + b.height / 2, true);
    });
    arena.addEventListener("pointerdown", function (e) {       // miss: shot lands on the wall
        if (e.target.closest && e.target.closest("#target")) return;
        fire(e.clientX, e.clientY, false);
    });

    /* ---------- Continue -> final apology ---------- */
    $("continueBtn").addEventListener("click", function () {
        game.hidden = true;
        document.body.classList.remove("game-on");
        $("apology").hidden = false;
        window.scrollTo(0, 0);
        var s = document.createElement("script");   // Tenor loads only now, so embeds measure correctly
        s.async = true;
        s.src = "https://tenor.com/embed.js";
        document.body.appendChild(s);
    });
})();
