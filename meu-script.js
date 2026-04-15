const body = document.body;

const choice = document.getElementById("choice");
const game = document.getElementById("game");
const scoreScreen = document.getElementById("scoreScreen");
const tiroSom = new Audio('disparo.mp3')
const explosaoSom = new Audio('explosao.mp3')

let mode = 0;

let tanks = [];
let bullets = [];
let keys = {};
let gameOver = false;

const TANK_SIZE = 50;
const BULLET_SIZE = 8;

const GRAVITY = 0.1;
const RELOAD_TIME = 1800; // 🔥 aumentado bastante

body.style.overflow = "hidden";

function tocarSom(audio) {
    audio.volume = 0.5;
    audio.currentTime = 0;
    audio.play();
}

// =========================
// INPUT
// =========================
document.addEventListener("keydown", (e) => {
    keys[e.code] = true;

    if (e.repeat || gameOver) return;

    for (const t of tanks) {
        if (!t.controls) continue; // 🔥 evita erro

        if (e.code === t.controls.fire) {
            shoot(t);
        }
    }
});

document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

// =========================
// MODE
// =========================
function verMode() {
    choice.style.display = "none";
    game.style.display = "block";

    clearGame();

    if (mode === 1) {
        startMatch(1, 3); // 🔥 1 player vs 2 bots
    } else if (mode === 2) {
        startMatch(2, 1); // 2 players + 1 bot
    } else if (mode === 3) {
        startMatch(3, 1);
    } else if (mode === 4) {
        startMatch(4, 0);
    }
}

// =========================
// RESET
// =========================
function clearGame() {
    tanks.forEach((t) => t.el.remove());
    bullets.forEach((b) => b.el.remove());

    tanks = [];
    bullets = [];
    gameOver = false;
}

// =========================
// VISUAL TANK (melhorado)
// =========================
function createTankEl(color) {
    const el = document.createElement("div");

    el.style.position = "absolute";
    el.style.width = TANK_SIZE + "px";
    el.style.height = TANK_SIZE + "px";
    el.style.background = color;
    el.style.borderRadius = "6px";
    el.style.border = "2px solid #111";
    el.style.boxShadow = "inset -6px -6px 0 rgba(0,0,0,0.3)";
    el.style.transition = "transform 0.05s linear";

    const cannon = document.createElement("div");
    cannon.style.position = "absolute";
    cannon.style.width = "28px";
    cannon.style.height = "6px";
    cannon.style.background = "#222";
    cannon.style.top = "22px";
    cannon.style.left = "35px";
    cannon.style.borderRadius = "3px";

    el.appendChild(cannon);

    return el;
}

// =========================
// CONTROLES
// =========================
function getControls(i) {
    const presets = [
        {
            up: "KeyW",
            down: "KeyS",
            left: "KeyA",
            right: "KeyD",
            fire: "Space",
        },
        {
            up: "ArrowUp",
            down: "ArrowDown",
            left: "ArrowLeft",
            right: "ArrowRight",
            fire: "Enter",
        },
        {
            up: "Numpad5",
            down: "Numpad2",
            left: "Numpad1",
            right: "Numpad3",
            fire: "Numpad0",
        },
        {
            up: "KeyT",
            down: "KeyG",
            left: "KeyF",
            right: "KeyH",
            fire: "ShiftRight",
        },
    ];

    return presets[i] || presets[0];
}

// =========================
// START
// =========================
function startMatch(players, bots = 0) {
    const colors = ["#3ea34a", "#d43b3b", "#3b67d4", "#d49a3b"];

    // players
    for (let i = 0; i < players; i++) {
        const el = createTankEl(colors[i]);

        body.appendChild(el);

        const t = {
            id: i,
            el,
            x: 100 + i * 150,
            y: 100,
            speed: 2,
            alive: true,
            cooldown: false,
            ammo: 10,
            facing: 1,
            score: 0,
            controls: getControls(i),
        };

        el.style.left = t.x + "px";
        el.style.top = t.y + "px";

        tanks.push(t);
    }

    // bots
    for (let i = 0; i < bots; i++) {
        createBot(i + players);
    }

    updateHUD();
    loop();
}

function createBot(id) {
    const el = createTankEl("gray");
    body.appendChild(el);

    const bot = {
        id: id,
        el,

        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 200) + 100,

        speed: 0.8 + Math.random() * 0.7,
        accuracy: Math.random(),
        reaction: 800 + Math.random() * 1200,

        alive: true,
        cooldown: false,
        ammo: 10,
        facing: Math.random() < 0.5 ? -1 : 1,
        score: 0,

        isBot: true,

        // 🔥 controle de alvo (ESSENCIAL)
        target: null,
        lastTargetChange: 0,
        lastShot: 0,
    };

    el.style.left = bot.x + "px";
    el.style.top = bot.y + "px";

    tanks.push(bot);
}

function moveBot(t) {
    if (!t.alive) return;

    const agora = Date.now();

    // =========================
    // ESCOLHER ALVO (SEM TREMER)
    // =========================
    if (!t.target || !t.target.alive || agora - t.lastTargetChange > 2000) {
        const alvos = tanks.filter((p) => p !== t && p.alive);

        if (alvos.length === 0) return;

        // 🔥 pega o mais próximo
        t.target = alvos.reduce((closest, p) => {
            const d1 = Math.hypot(p.x - t.x, p.y - t.y);
            const d2 = Math.hypot(closest.x - t.x, closest.y - t.y);
            return d1 < d2 ? p : closest;
        });

        t.lastTargetChange = agora;
    }

    const target = t.target;

    const dx = target.x - t.x;
    const dy = target.y - t.y;

    // 🔥 SEMPRE olhar pro alvo
    if (dx !== 0) {
        t.facing = dx > 0 ? 1 : -1;
    }

    const DISTANCIA_BOA = 150;

    // =========================
    // COMPORTAMENTO
    // =========================
    const agressivo = t.accuracy > 0.5;

    if (agressivo) {
        if (Math.abs(dx) > DISTANCIA_BOA) {
            t.x += Math.sign(dx) * t.speed;
            t.facing = dx > 0 ? 1 : -1;
        }
    } else {
        if (Math.abs(dx) < DISTANCIA_BOA) {
            t.x -= Math.sign(dx) * t.speed;
        }
    }

    if (Math.abs(dy) > 40) {
        t.y += Math.sign(dy) * t.speed;
    }

    // =========================
    // TIRO (COM ERRO HUMANO)
    // =========================
    const erro = (Math.random() - 0.5) * (120 * (1 - t.accuracy));
    const alinhado = Math.abs(dy + erro) < 40;

    if (alinhado && agora - t.lastShot > t.reaction && Math.random() < 0.6) {
        shoot(t);
        t.lastShot = agora;
    }

    // =========================
    // LIMITES
    // =========================
    t.x = Math.max(0, Math.min(window.innerWidth - TANK_SIZE, t.x));
    t.y = Math.max(0, Math.min(window.innerHeight - TANK_SIZE, t.y));

    // =========================
    // APLICAR
    // =========================
    t.el.style.left = t.x + "px";
    t.el.style.top = t.y + "px";

    t.el.style.transform = t.facing === -1 ? "scaleX(-1)" : "scaleX(1)";
}

function updateHUD() {
    let html = `<div style="
        position:fixed;
        top:10px;
        left:10px;
        background:rgba(0,0,0,0.6);
        padding:10px;
        border-radius:10px;
        color:white;
        font-family:Arial;
        font-size:14px;
        white-space:pre;
    ">`;

    tanks.forEach((t) => {
        let status;

        if (t.ammo === 0) {
            status = "SEM MUNIÇÃO";
        } else if (t.cooldown) {
            status = "⏳";
        } else {
            status = "OK";
        }

        html += `P${t.id + 1} | ${t.alive ? "VIVO" : "MORTO"} | Score: ${t.score} | Munição: ${t.ammo} | ${status}\n`;
    });

    html += `</div>`;

    scoreScreen.innerHTML = html;
}

// =========================
// MOVIMENTO + FACING
// =========================
function moveTank(t) {
    if (!t.alive) return;

    let moving = false;

    if (keys[t.controls.left]) {
        t.x -= t.speed;
        t.facing = -1;
        moving = true;
    }

    if (keys[t.controls.right]) {
        t.x += t.speed;
        t.facing = 1;
        moving = true;
    }

    if (keys[t.controls.up]) {
        t.y -= t.speed;
        moving = true;
    }

    if (keys[t.controls.down]) {
        t.y += t.speed;
        moving = true;
    }

    t.x = Math.max(0, Math.min(window.innerWidth - TANK_SIZE, t.x));
    t.y = Math.max(0, Math.min(window.innerHeight - TANK_SIZE, t.y));

    t.el.style.left = t.x + "px";
    t.el.style.top = t.y + "px";

    // 🔥 olha pra direção
    t.el.style.transform = t.facing === -1 ? "scaleX(-1)" : "scaleX(1)";
}

// =========================
// TIRO
// =========================
function shoot(t) {
    if (!t.alive || t.cooldown || gameOver || t.ammo < 1) return;

    tocarSom(tiroSom)
    t.ammo -= 1;
    t.cooldown = true;

    setTimeout(() => {
        t.cooldown = false;
    }, RELOAD_TIME); // 🔥 mais lento

    const bulletEl = document.createElement("div");

    bulletEl.style.position = "absolute";
    bulletEl.style.width = BULLET_SIZE + "px";
    bulletEl.style.height = BULLET_SIZE + "px";
    bulletEl.style.borderRadius = "50%";
    bulletEl.style.background = "black";
    bulletEl.style.boxShadow = "0 0 6px rgba(0,0,0,0.4)";

    body.appendChild(bulletEl);

    const b = {
        el: bulletEl,
        x: t.x + 25,
        y: t.y + 25,
        vx: 6 * t.facing,
        vy: -2,
        gravity: GRAVITY,
        owner: t,
    };

    bullets.push(b);
}

// =========================
// BULLETS + GRAVIDADE
// =========================
function updateBullets() {
    bullets = bullets.filter((b) => {
        b.vy += b.gravity; // 🔥 gravidade real
        b.x += b.vx;
        b.y += b.vy;

        b.el.style.left = b.x + "px";
        b.el.style.top = b.y + "px";

        if (b.x < 0 || b.x > innerWidth || b.y > innerHeight) {
            b.el.remove();
            return false;
        }

        for (const t of tanks) {
            if (!t.alive || t === b.owner) continue;

            if (Math.abs(b.x - t.x) < 40 && Math.abs(b.y - t.y) < 40) {
                b.el.remove();
                b.owner.score++; // 🔥 quem matou ganha ponto
                t.alive = false;
                t.loot = t.ammo; // 🔥 munição dropada
                t.el.style.filter = "grayscale(100%)"; // visual morto
                tocarSom(explosaoSom)

                checkWin();
                updateHUD();
                return false;
            }
        }

        return true;
    });
}

function checkLoot() {
    for (const t of tanks) {
        if (!t.alive && t.loot > 0) {
            // 🔥 mostra loot só 1 vez por frame
            t.el.innerText = "+" + t.loot;

            for (const p of tanks) {
                if (!p.alive || p === t) continue;

                const pegou =
                    p.x < t.x + TANK_SIZE &&
                    p.x + TANK_SIZE > t.x &&
                    p.y < t.y + TANK_SIZE &&
                    p.y + TANK_SIZE > t.y;

                if (pegou) {
                    p.ammo = Math.min(p.ammo + t.loot, 30); // 🔥 limite
                    t.loot = 0;

                    t.el.innerText = ""; // limpa texto
                    t.el.style.opacity = "0.3";

                    console.log(`P${p.id + 1} pegou munição`);
                }
            }
        }
    }
}

// =========================
// WIN CHECK
// =========================
function checkWin() {
    const alive = tanks.filter((t) => t.alive);

    if (alive.length === 1 && tanks.length > 1) {
        setTimeout(() => {
            alert(`Jogador ${alive[0].id + 1} venceu!`);
            location.reload();
        }, 400);
    }
}

// =========================
// LOOP
// =========================
function loop() {
    tanks.forEach((t) => {
        if (t.isBot) {
            moveBot(t);
        } else {
            moveTank(t);
        }
    });

    checkLoot();
    updateBullets();
    updateHUD();

    if (!gameOver) {
        requestAnimationFrame(loop);
    }
}
