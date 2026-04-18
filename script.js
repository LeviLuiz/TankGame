const body = document.body;

const choice = document.getElementById("choice");
const game = document.getElementById("game");
const scoreScreen = document.getElementById("scoreScreen");
const tiroSom = new Audio("disparo.mp3");
const explosaoSom = new Audio("explosao.mp3");

let mode = 0;

let tanks = [];
let bullets = [];
let keys = {};
let gameOver = false;
let botsNumber = localStorage.getItem("bots") ?? 0;

const slider = document.getElementById("botsConfig");
const label = document.getElementById("botsNumber");

slider.value = botsNumber;
label.textContent = "Número de Bots: " + botsNumber;

const TANK_SIZE = 50;
const TANK_SIDE = TANK_SIZE + 20;
const BULLET_SIZE = 8;

const RELOAD_TIME = 2000;

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
        if (!t.controls) continue; //evita erro

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
        if (botsNumber > 0) {
            startMatch(1, botsNumber);
        } else {
            startMatch(1, 1)
        }
    } else if (mode === 2) {
        startMatch(2, botsNumber);
    } else if (mode === 3) {
        startMatch(3, botsNumber);
    } else if (mode === 4) {
        startMatch(4, botsNumber);
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
    el.style.width = TANK_SIDE + "px";
    el.style.height = TANK_SIZE + "px";
    el.style.background = color;
    el.style.borderRadius = "6px";
    el.style.border = "2px solid #111";
    el.style.boxShadow = "inset -6px -6px 0 rgba(0,0,0,0.3)";
    el.style.transition = "transform 0.05s linear";

    //BASE DA TORRE
    const turret = document.createElement("div");
    turret.style.position = "absolute";
    turret.style.width = "26px";
    turret.style.height = "26px";
    turret.style.background = "#333";
    turret.style.borderRadius = "50%";
    turret.style.top = "10px";
    turret.style.left = "20px";
    turret.style.border = "2px solid #111";

    //CANO
    const cannon = document.createElement("div");
    cannon.style.position = "absolute";
    cannon.style.width = "30px";
    cannon.style.height = "8px";
    cannon.style.background = "#111";
    cannon.style.top = "7px";
    cannon.style.left = "20px";
    cannon.style.borderRadius = "3px";

    // junta os dois
    turret.appendChild(cannon);
    el.appendChild(turret);

    //guarda referência
    el.cannon = turret;

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
            turretLeft: "KeyQ",
            turretRight: "KeyE",
        },
        {
            up: "ArrowUp",
            down: "ArrowDown",
            left: "ArrowLeft",
            right: "ArrowRight",
            fire: "Enter",
            turretLeft: "Delete",
            turretRight: "PageDown",
        },
        {
            up: "Numpad5",
            down: "Numpad2",
            left: "Numpad1",
            right: "Numpad3",
            fire: "Numpad0",
            turretLeft: "Numpad4",
            turretRight: "Numpad6",
        },
        {
            up: "KeyT",
            down: "KeyG",
            left: "KeyF",
            right: "KeyH",
            fire: "ShiftRight",
            turretLeft: "KeyR",
            turretRight: "KeyY",
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

        posicaox = 100;
        posicaoy = 100;

        if (i == 0) {
            posicaox = 100;
            posicaoy = 100;
        } else if (i == 1) {
            posicaox = window.innerWidth - 100;
        } else if (i == 2) {
            posicaoy = window.innerHeight - 100;
        } else {
            posicaox = window.innerWidth - 100;
            posicaoy = window.innerHeight - 100;
        }

        const t = {
            id: i,
            el,
            x: posicaox,
            y: posicaoy,
            speed: 2,
            alive: true,
            cooldown: false,
            ammo: 10,
            score: 0,
            controls: getControls(i),
            angle: 0,
            turretAngle: 0,
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

        x: Math.random() * (window.innerWidth - 200) + 500,
        y: Math.random() * (window.innerHeight - 200) + 100,

        speed: 1 + Math.random() * 0.7,
        accuracy: Math.random(),
        reaction: 800 + Math.random() * 1200,

        alive: true,
        cooldown: false,
        ammo: 10,

        angle: Math.random() * Math.PI * 2,
        turretAngle: Math.random() * Math.PI * 2,

        score: 0,

        isBot: true,

        //controle de alvo (ESSENCIAL)
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
    // ESCOLHER ALVO
    // =========================
    if (!t.target || !t.target.alive || agora - t.lastTargetChange > 2000) {
        const alvos = tanks.filter((p) => p !== t && p.alive);
        if (alvos.length === 0) return;

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

    // =========================
    // TORRE (mira no alvo)
    // =========================
    const desiredTurret = Math.atan2(dy, dx);

    let turretDiff = desiredTurret - t.turretAngle;
    turretDiff = Math.atan2(Math.sin(turretDiff), Math.cos(turretDiff));

    if (Math.abs(turretDiff) > 0.02) {
        t.turretAngle += Math.sign(turretDiff) * 0.05;
    }

    // =========================
    // CORPO (movimento)
    // =========================
    let bodyDiff = desiredTurret - t.angle;
    bodyDiff = Math.atan2(Math.sin(bodyDiff), Math.cos(bodyDiff));

    const ROT_SPEED = 0.04;

    if (bodyDiff > 0) {
        t.angle += ROT_SPEED;
    } else {
        t.angle -= ROT_SPEED;
    }

    // =========================
    // DISTÂNCIA
    // =========================
    const dist = Math.hypot(dx, dy);

    const DISTANCIA_BOA = 180;

    // =========================
    // MOVIMENTO
    // =========================
    if (dist > DISTANCIA_BOA) {
        // avança
        t.x += Math.cos(t.angle) * t.speed;
        t.y += Math.sin(t.angle) * t.speed;
    } else if (dist < 100) {
        // recua
        t.x -= Math.cos(t.angle) * t.speed * 0.6;
        t.y -= Math.sin(t.angle) * t.speed * 0.6;
    }

    // =========================
    // TIRO
    // =========================
    const alinhado = Math.abs(turretDiff) < 0.2;
    const ALCANCE_TIRO = 400;

    if (dist < ALCANCE_TIRO && alinhado && agora - t.lastShot > t.reaction) {
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
    t.el.style.transform = `rotate(${t.angle}rad)`;
    t.el.cannon.style.transform = `rotate(${t.turretAngle - t.angle}rad)`;
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

    if (mode == 1) {
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
    } else {
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
    }

    html += `</div>`;

    scoreScreen.innerHTML = html;
}

function moveTank(t) {
    if (!t.alive) return;

    const ROT_SPEED = 0.05; // velocidade de rotação
    const MOVE_SPEED = t.speed;

    const TURRET_SPEED = 0.07;

    // girar torre
    if (keys[t.controls.turretLeft]) {
        t.turretAngle -= TURRET_SPEED;
    }

    if (keys[t.controls.turretRight]) {
        t.turretAngle += TURRET_SPEED;
    }

    // ROTACIONAR
    if (keys[t.controls.left]) {
        t.angle -= ROT_SPEED;
    }

    if (keys[t.controls.right]) {
        t.angle += ROT_SPEED;
    }

    // MOVER PRA FRENTE
    if (keys[t.controls.up]) {
        t.x += Math.cos(t.angle) * MOVE_SPEED;
        t.y += Math.sin(t.angle) * MOVE_SPEED;
    }

    // RÉ
    if (keys[t.controls.down]) {
        t.x -= Math.cos(t.angle) * MOVE_SPEED * 0.6; // mais lento
        t.y -= Math.sin(t.angle) * MOVE_SPEED * 0.6;
    }

    // limites da tela
    t.x = Math.max(0, Math.min(window.innerWidth - TANK_SIZE, t.x));
    t.y = Math.max(0, Math.min(window.innerHeight - TANK_SIZE, t.y));

    t.el.style.left = t.x + "px";
    t.el.style.top = t.y + "px";

    t.el.style.transform = `rotate(${t.angle}rad)`;

    // torre gira independente
    t.el.cannon.style.transform = `rotate(${t.turretAngle - t.angle}rad)`;
}

function shoot(t) {
    if (!t.alive || t.cooldown || gameOver || t.ammo < 1) return;

    tocarSom(tiroSom);
    t.ammo -= 1;
    t.cooldown = true;

    setTimeout(() => {
        t.cooldown = false;
    }, RELOAD_TIME);

    const bulletEl = document.createElement("div");

    bulletEl.style.position = "absolute";
    bulletEl.style.width = BULLET_SIZE + "px";
    bulletEl.style.height = BULLET_SIZE + "px";
    bulletEl.style.borderRadius = "50%";
    bulletEl.style.background = "black";

    body.appendChild(bulletEl);

    const barrelLength = 30;

    const spawnX = t.x + TANK_SIDE / 2 + Math.cos(t.turretAngle) * barrelLength;
    const spawnY = t.y + TANK_SIZE / 2 + Math.sin(t.turretAngle) * barrelLength;

    const speed = 6;

    const b = {
        el: bulletEl,
        x: spawnX,
        y: spawnY,
        vx: Math.cos(t.turretAngle) * speed,
        vy: Math.sin(t.turretAngle) * speed,
        owner: t,
        life: 0, // tempo atual
        maxLife: 80, // duração (frames)
    };

    bulletEl.style.left = spawnX + "px";
    bulletEl.style.top = spawnY + "px";

    bullets.push(b);
}

// =========================
// BULLETS + GRAVIDADE
// =========================
function updateBullets() {
    bullets = bullets.filter((b) => {
        b.x += b.vx;
        b.y += b.vy;

        b.el.style.left = b.x + "px";
        b.el.style.top = b.y + "px";

        if (b.x < 0 || b.x > innerWidth || b.y < 0 || b.y > innerHeight) {
            b.el.remove();
            return false;
        }

        b.life++;
        b.vx *= 0.995;
        b.vy *= 0.995;

        for (const t of tanks) {
            if (b.life > b.maxLife) {
                b.el.remove();
                return false;
            }
            if (!t.alive || t === b.owner) continue;

            const tankLeft = t.x;
            const tankRight = t.x + TANK_SIDE;
            const tankTop = t.y;
            const tankBottom = t.y + TANK_SIZE;

            const hit =
                b.x > tankLeft &&
                b.x < tankRight &&
                b.y > tankTop &&
                b.y < tankBottom;

            if (hit) {
                b.el.remove();
                b.owner.score++;
                t.alive = false;
                t.loot = t.ammo;
                t.el.style.filter = "grayscale(100%)";
                tocarSom(explosaoSom);

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
            //mostra loot só 1 vez por frame
            t.el.innerText = "+" + t.loot;

            for (const p of tanks) {
                if (!p.alive || p === t) continue;

                const pegou =
                    p.x < t.x + TANK_SIZE &&
                    p.x + TANK_SIZE > t.x &&
                    p.y < t.y + TANK_SIZE &&
                    p.y + TANK_SIZE > t.y;

                if (pegou) {
                    p.ammo = Math.min(p.ammo + t.loot, 30); //limite
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
        }, 100);
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

function openConfig() {
    document.getElementById("configScreen").style.display = "flex";
    document.getElementById("overlay").style.display = "block";
}

function salvarConfig() {
    botsNumber = document.getElementById("botsConfig").value;
    localStorage.setItem("bots", document.getElementById("botsConfig").value);
    document.getElementById("configScreen").style.display = "none";
    document.getElementById("overlay").style.display = "none";
}
