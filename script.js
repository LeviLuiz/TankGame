const version = "1.2.1";
document.getElementById("versionText").innerHTML = version;
const body = document.body;

const choice = document.getElementById("choice");
const game = document.getElementById("game");
const scoreScreen = document.getElementById("scoreScreen");
const tiroSom = new Audio("disparo.mp3");
const explosaoSom = new Audio("explosao.mp3");
const clickSom = new Audio("click.mp3");
const linhas = choice.children;

let mode = 0;

let walls = [];
let playerTankTypes = [1, 1, 1, 1];
let tanks = [];
let bullets = [];
let keys = {};
let powerUps = ["speed", "ammo", "health"];
let powerUpItems = [];
let gameOver = false;
let botsNumber = parseInt(localStorage.getItem("bots")) || 0;
let showHitbox = false; // SEMPRE FALSE
let posicaobotx = 0;
let posicaoboty = 0;

const slider = document.getElementById("botsConfig");
const label = document.getElementById("botsNumber");

slider.value = botsNumber;
label.textContent = "Número de Bots: " + botsNumber;

const TANK_SIZE = 50;
const TANK_SIDE = TANK_SIZE + 20;
const BULLET_SIZE = 8;

const RELOAD_TIME = 2000;

body.style.overflow = "hidden";

let waitingKey = null;

function setControl(playerIndex, action) {
    waitingKey = { playerIndex, action };
}

function tocarSom(audio) {
    audio.volume = 0.3;
    audio.currentTime = 0;
    audio.play();
}

async function focarPaisagem() {
    try {
        await screen.orientation.lock("landscape");
    } catch (e) {
        console.log("Não foi possível travar a orientação:", e);
    }
}

if (isMobile()) {
    focarPaisagem()

    linhas[1].children[1].style.display = "none";
    linhas[2].children[0].style.display = "none";
    linhas[1].style.height = "100dvh";

    document.getElementById("configScreen").children[4].style.display = "none";

    posicaobotx = 40;
    posicaoboty = window.innerHeight;
}

// =========================
// INPUT
// =========================
document.addEventListener("keydown", (e) => {
    if (e.code === "KeyP") {
        showHitbox = !showHitbox;
    }
    // 👇 NOVO: captura tecla pra configurar
    if (waitingKey) {
        const controls = getSavedControls();

        if (!controls[waitingKey.playerIndex]) {
            controls[waitingKey.playerIndex] = getControls(
                waitingKey.playerIndex,
            );
        }

        controls[waitingKey.playerIndex][waitingKey.action] = e.code;

        localStorage.setItem("controls", JSON.stringify(controls));

        waitingKey = null;
        renderControls();
        return;
    }

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

const tankTypes = {
    1: {
        nome: "Tanque tipo 1",
        vida: 100,
        speed: 2,
        ammo: 7,
        reload: 2000,
        turretSpeed: 0.07,
        damage: 50,
        ammoType: 1,
    },

    2: {
        nome: "Tanque tipo 2",
        vida: 80,
        speed: 2.5,
        ammo: 12,
        reload: 800,
        turretSpeed: 0.1,
        damage: 20,
        ammoType: 2,
    },

    3: {
        nome: "Tanque tipo 3",
        vida: 150,
        speed: 1.5,
        ammo: 6,
        reload: 2500,
        turretSpeed: 0.05,
        damage: 60,
        ammoType: 3,
    },

    4: {
        nome: "Tanque tipo 4",
        vida: 70,
        speed: 2.7,
        ammo: 30,
        reload: 500,
        turretSpeed: 0.08,
        damage: 10,
        ammoType: 4,
    },
};

function isMobile() {
    return (
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
            navigator.userAgent,
        ) ||
        window.innerWidth <= 900 ||
        "ontouchstart" in window
    );
}
// =========================
// MODE
// =========================
player = 0;
function verMode() {
    if (player >= mode) {
        startGame();
        return;
    }

    linhas[0].style.display = "block";
    linhas[0].innerHTML = "Player " + (player + 1);

    linhas[1].children[0].style.display = "block";
    linhas[1].children[1].style.display = "block";
    linhas[2].children[0].style.display = "block";
    linhas[2].children[1].style.display = "block";
    linhas[1].style.height = "50dvh";

    linhas[1].children[0].children[0].innerHTML = "Tanque tipo 1";
    linhas[1].children[1].children[0].innerHTML = "Tanque tipo 2";
    linhas[2].children[0].children[0].innerHTML = "Tanque tipo 3";
    linhas[2].children[1].children[0].innerHTML = "Tanque tipo 4";

    linhas[1].children[0].children[1].style.display = "block";
    linhas[1].children[1].children[1].style.display = "block";
    linhas[2].children[0].children[1].style.display = "block";
    linhas[2].children[1].children[1].style.display = "block";

    // tankType 1
    linhas[1].children[0].children[1].children[1].innerHTML =
        "Vida: " + tankTypes[1].vida;

    linhas[1].children[0].children[1].children[2].innerHTML =
        "Munição: " + tankTypes[1].ammo;

    linhas[1].children[0].children[1].children[3].innerHTML =
        "Recarga: " + tankTypes[1].reload / 1000;

    linhas[1].children[0].children[1].children[4].innerHTML =
        "Dano: " + tankTypes[1].damage;

    // tankType 2
    linhas[1].children[1].children[1].children[1].innerHTML =
        "Vida: " + tankTypes[2].vida;

    linhas[1].children[1].children[1].children[2].innerHTML =
        "Munição: " + tankTypes[2].ammo;

    linhas[1].children[1].children[1].children[3].innerHTML =
        "Recarga: " + tankTypes[2].reload / 1000;

    linhas[1].children[1].children[1].children[4].innerHTML =
        "Dano: " + tankTypes[2].damage;

    // tankType 3
    linhas[2].children[0].children[1].children[1].innerHTML =
        "Vida: " + tankTypes[3].vida;

    linhas[2].children[0].children[1].children[2].innerHTML =
        "Munição: " + tankTypes[3].ammo;

    linhas[2].children[0].children[1].children[3].innerHTML =
        "Recarga: " + tankTypes[3].reload / 1000;

    linhas[2].children[0].children[1].children[4].innerHTML =
        "Dano: " + tankTypes[3].damage;

    // tankType 4
    linhas[2].children[1].children[1].children[1].innerHTML =
        "Vida: " + tankTypes[4].vida;

    linhas[2].children[1].children[1].children[2].innerHTML =
        "Munição: " + tankTypes[4].ammo;

    linhas[2].children[1].children[1].children[3].innerHTML =
        "Recarga: " + tankTypes[4].reload / 1000;

    linhas[2].children[1].children[1].children[4].innerHTML =
        "Dano: " + tankTypes[4].damage;

    linhas[1].children[0].onclick = function () {
        playerTankTypes[player - 1] = 1;
        linhas[0].innerHTML = "Player" + player;
        verMode();
    };

    linhas[1].children[1].onclick = function () {
        playerTankTypes[player - 1] = 2;
        verMode();
    };

    linhas[2].children[0].onclick = function () {
        playerTankTypes[player - 1] = 3;
        verMode();
    };

    linhas[2].children[1].onclick = function () {
        playerTankTypes[player - 1] = 4;
        verMode();
    };

    player += 1;
}

function startGame() {
    if (mode === 1) {
        if (botsNumber > 0) {
            startMatch(1, botsNumber);
        } else {
            startMatch(1, 1);
        }
    } else if (mode === 2) {
        startMatch(2, botsNumber);
    } else if (mode === 3) {
        startMatch(3, botsNumber);
    } else if (mode === 4) {
        startMatch(4, botsNumber);
    }

    choice.style.display = "none";
    game.style.display = "block";
    if (isMobile()) {
        document.getElementById("mobileButtons").style.display = "block";
    }
}

function createWall(x, y, w, h) {
    const el = document.createElement("div");

    el.style.position = "absolute";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.style.background = "#444";
    el.style.border = "2px solid #111";

    body.appendChild(el);

    walls.push({ x, y, w, h, el });
}

function createMap() {
    // bordas
    createWall(0, 0, window.innerWidth, 5);
    createWall(0, window.innerHeight - 5, window.innerWidth, 5);
    createWall(0, 0, 5, window.innerHeight);
    createWall(window.innerWidth - 5, 0, 5, window.innerHeight);

    // obstáculos no meio
    createWall(300, 200, 200, 40);
    createWall(600, 400, 40, 200);
    createWall(900, 150, 150, 40);
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

function createExplosion(x, y) {
    const e = document.createElement("div");

    e.style.position = "absolute";
    e.style.left = x + "px";
    e.style.top = y + "px";
    e.style.width = "20px";
    e.style.height = "20px";
    e.style.borderRadius = "50%";
    e.style.background = "orange";
    e.style.pointerEvents = "none";
    e.style.transition = "all 0.4s ease-out";

    body.appendChild(e);

    requestAnimationFrame(() => {
        e.style.transform = "scale(4)";
        e.style.opacity = "0";
    });

    setTimeout(() => e.remove(), 400);
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

function getSavedControls() {
    return (
        JSON.parse(localStorage.getItem("controls")) || [
            getControls(0),
            getControls(1),
            getControls(2),
            getControls(3),
        ]
    );
}

function renderControls() {
    for (let i = 0; i < 4; i++) {
        const c = getSavedControls()[i];

        document.getElementById(`player${i + 1}l`).textContent =
            "Left: " + c.left;
        document.getElementById(`player${i + 1}r`).textContent =
            "Right: " + c.right;
        document.getElementById(`player${i + 1}u`).textContent = "Up: " + c.up;
        document.getElementById(`player${i + 1}d`).textContent =
            "Down: " + c.down;
        document.getElementById(`player${i + 1}tl`).textContent =
            "Turret Left: " + c.turretLeft;
        document.getElementById(`player${i + 1}td`).textContent =
            "Turret Right: " + c.turretRight;
        document.getElementById(`player${i + 1}f`).textContent =
            "Fire: " + c.fire;
    }
}

renderControls();

// =========================
// START
// =========================
function startMatch(players, bots = 0) {
    const colors = ["#3ea34a", "#d43b3b", "#3b67d4", "#d49a3b"];

    // players
    for (let i = 0; i < players; i++) {
        const el = createTankEl(colors[i]);

        body.appendChild(el);

        let posicaox = 100;
        let posicaoy = 100;

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
        const type = playerTankTypes[i];
        const config = tankTypes[type];

        const t = {
            id: i,

            vida: config.vida,
            el,

            x: posicaox,
            y: posicaoy,

            speed: config.speed,
            alive: true,
            cooldown: false,

            ammo: config.ammo,
            score: 0,

            controls: getSavedControls()[i],

            angle: 0,
            turretAngle: 0,

            reload: config.reload,
            slowed: false,

            ammoType: config.ammoType,
            turretSpeed: config.turretSpeed,
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
    createMap();
    loop();
}

function createBot(id) {
    if (!isMobile()) {
        posicaobotx = 100;
        posicaoboty = 120;
    }
    const el = createTankEl("gray");
    body.appendChild(el);

    if (id == 1) {
        if (!isMobile()) {
            posicaobotx = 50;
            posicaoboty = window.innerHeight - 50;
        }
    } else if (id == 2) {
        posicaobotx = window.innerWidth - posicaobotx;
    } else if (id == 3) {
        posicaobotx = window.innerWidth - posicaobotx;
        posicaoboty = window.innerHeight - posicaoboty;
    } else if (id == 4) {
        posicaobotx = window.innerWidth / 2 + 200;
        posicaoboty = window.innerHeight / 2;
    } else if (id == 5) {
        posicaobotx = window.innerWidth / 2 - 300;
        posicaoboty = window.innerHeight / 2;
    }

    const bot = {
        id: id,
        vida: 100,
        el,

        x: posicaobotx,
        y: posicaoboty - 100,

        speed: 1.5,
        accuracy: Math.random(),
        reaction: 800 + Math.random() * 1200,

        alive: true,
        cooldown: false,
        reload: 2000,
        ammo: 7,
        ammoType: 1,

        angle: Math.random() * Math.PI * 2,
        turretAngle: Math.random() * Math.PI * 2,
        turretSpeed: 0.07,

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

    const prediction = 20;

    const futureTargetX =
        target.x + Math.cos(target.angle) * target.speed * prediction;
    const futureTargetY =
        target.y + Math.sin(target.angle) * target.speed * prediction;

    const dx = futureTargetX - t.x;
    const dy = futureTargetY - t.y;

    // =========================
    // TORRE (mira no alvo)
    // =========================
    const desiredTurret = Math.atan2(dy, dx);

    let turretDiff = desiredTurret - t.turretAngle;
    turretDiff = Math.atan2(Math.sin(turretDiff), Math.cos(turretDiff));

    if (Math.abs(turretDiff) > 0.02) {
        t.turretAngle += Math.sign(turretDiff) * 0.05;
    }

    for (const b of bullets) {
        if (b.owner === t) continue;

        const distBullet = Math.hypot(b.x - t.x, b.y - t.y);

        if (distBullet < 300) {
            const dodge = Math.atan2(t.y - b.y, t.x - b.x);

            // gira 90° para lado da bala
            const dodgeAngle = dodge + Math.PI / 2;

            let diff = dodgeAngle - t.angle;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));

            t.angle += Math.sign(diff) * 0.08;
        }
    }

    // =========================
    // CORPO (movimento)
    // =========================

    const lookAhead = 40;

    const futureX = t.x + Math.cos(t.angle) * lookAhead;
    const futureY = t.y + Math.sin(t.angle) * lookAhead;

    if (isColliding(futureX, futureY)) {
        t.angle += 0.1;
    }

    let bodyDiff = desiredTurret - t.angle;
    bodyDiff = Math.atan2(Math.sin(bodyDiff), Math.cos(bodyDiff));

    const ROT_SPEED = 0.04;

    if (bodyDiff > 0) {
        t.angle += ROT_SPEED;
    } else {
        t.angle -= ROT_SPEED;
    }

    let newX = t.x + Math.cos(t.angle) * t.speed;
    let newY = t.y + Math.sin(t.angle) * t.speed;

    let moved = false;

    if (!isColliding(newX, t.y)) {
        t.x = newX;
        moved = true;
    }

    if (!isColliding(t.x, newY)) {
        t.y = newY;
        moved = true;
    }

    // 👇 se travou, tenta escapar lateralmente
    if (!moved) {
        const angleOffset = Math.PI / 2;

        const tryX = t.x + Math.cos(t.angle + angleOffset) * t.speed;
        const tryY = t.y + Math.sin(t.angle + angleOffset) * t.speed;

        if (!isColliding(tryX, t.y)) t.x = tryX;
        if (!isColliding(t.x, tryY)) t.y = tryY;
    }

    // =========================
    // DISTÂNCIA
    // =========================
    const dist = Math.hypot(dx, dy);

    const DISTANCIA_BOA = 180;

    // =========================
    // TIRO
    // =========================
    const alinhado = Math.abs(turretDiff) < 0.2;
    const ALCANCE_TIRO = 400;

    if (dist < ALCANCE_TIRO && alinhado && agora - t.lastShot > t.reaction) {
        shoot(t, t.isBot);
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

    if (showHitbox) {
        t.el.style.outline = "2px solid red";
    } else {
        t.el.style.outline = "none";
    }
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
        tanks
            .filter((t) => t.alive)
            .forEach((t) => {
                let status;

                if (t.ammo === 0) {
                    status = "SEM MUNIÇÃO";
                } else if (t.cooldown) {
                    status = "⏳";
                } else {
                    status = "OK";
                }

                html += `P${t.id + 1} | Munição: ${t.ammo} | ${status}\n`;
            });
    } else {
        tanks
            .filter((t) => t.alive)
            .forEach((t) => {
                let status;

                if (t.ammo === 0) {
                    status = "SEM MUNIÇÃO";
                } else if (t.cooldown) {
                    status = "⏳";
                } else {
                    status = "OK";
                }

                html += `P${t.id + 1} | Score: ${t.score} | Munição: ${t.ammo} | ${status}\n`;
            });
    }

    html += `</div>`;

    scoreScreen.innerHTML = html;
}

function isColliding(x, y) {
    const radius = TANK_SIDE / 2;

    const centerX = x + TANK_SIDE / 2;
    const centerY = y + TANK_SIZE / 2;

    return walls.some((w) => {
        const closestX = Math.max(w.x, Math.min(centerX, w.x + w.w));
        const closestY = Math.max(w.y, Math.min(centerY, w.y + w.h));

        const dx = centerX - closestX;
        const dy = centerY - closestY;

        return dx * dx + dy * dy < radius * radius;
    });
}

function moveTank(t) {
    if (!t.alive) return;

    const ROT_SPEED = 0.05;
    const MOVE_SPEED = t.speed;

    let newX = t.x;
    let newY = t.y;

    // rotação do tanque
    if (keys[t.controls.left]) {
        t.angle -= ROT_SPEED;
    }

    if (keys[t.controls.right]) {
        t.angle += ROT_SPEED;
    }

    // movimento frente/ré
    if (keys[t.controls.up]) {
        newX += Math.cos(t.angle) * MOVE_SPEED;
        newY += Math.sin(t.angle) * MOVE_SPEED;
    }

    if (keys[t.controls.down]) {
        newX -= Math.cos(t.angle) * MOVE_SPEED * 0.6;
        newY -= Math.sin(t.angle) * MOVE_SPEED * 0.6;
    }

    // colisão (AGORA FUNCIONA)
    if (!isColliding(newX, t.y)) t.x = newX;
    if (!isColliding(t.x, newY)) t.y = newY;

    // torre
    if (keys[t.controls.turretLeft]) {
        t.turretAngle -= t.turretSpeed;
    }

    if (keys[t.controls.turretRight]) {
        t.turretAngle += t.turretSpeed;
    }

    // limites da tela
    t.x = Math.max(0, Math.min(window.innerWidth - TANK_SIZE, t.x));
    t.y = Math.max(0, Math.min(window.innerHeight - TANK_SIZE, t.y));

    // aplicar visual
    t.el.style.left = t.x + "px";
    t.el.style.top = t.y + "px";
    t.el.style.transform = `rotate(${t.angle}rad)`;
    t.el.cannon.style.transform = `rotate(${t.turretAngle - t.angle}rad)`;

    if (showHitbox) {
        t.el.style.outline = "2px solid red";
    } else {
        t.el.style.outline = "none";
    }
}

function shoot(t, robo) {
    if (!t.alive || gameOver) {
        return;
    } else if (t.cooldown || t.ammo < 1) {
        tocarSom(clickSom);
        return;
    }

    tocarSom(tiroSom);
    t.ammo -= 1;
    t.cooldown = true;

    setTimeout(() => {
        t.cooldown = false;
        updateHUD()
    }, t.reload);

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

    let eRobo = robo || false;

    let b;

    if (eRobo == false) {
        if (t.ammoType == 1) {
            b = {
                el: bulletEl,
                damage: tankTypes[1].damage,
                x: spawnX,
                y: spawnY,
                vx: Math.cos(t.turretAngle) * speed,
                vy: Math.sin(t.turretAngle) * speed,
                owner: t,
                life: 0,
                maxLife: 80,
            };
        }

        if (t.ammoType == 2) {
            b = {
                el: bulletEl,
                damage: tankTypes[2].damage,
                x: spawnX,
                y: spawnY,
                vx: Math.cos(t.turretAngle) * speed,
                vy: Math.sin(t.turretAngle) * speed,
                owner: t,
                life: 0,
                maxLife: 90,
            };
        }

        if (t.ammoType == 3) {
            b = {
                el: bulletEl,
                damage: tankTypes[3].damage,
                x: spawnX,
                y: spawnY,
                vx: Math.cos(t.turretAngle) * speed,
                vy: Math.sin(t.turretAngle) * speed,
                owner: t,
                life: 0,
                maxLife: 75,
            };
        }

        if (t.ammoType == 4) {
            b = {
                el: bulletEl,
                damage: tankTypes[4].damage,
                x: spawnX,
                y: spawnY,
                vx: Math.cos(t.turretAngle) * speed,
                vy: Math.sin(t.turretAngle) * speed,
                owner: t,
                life: 0,
                maxLife: 75,
            };
        }
    } else {
        b = {
            el: bulletEl,
            damage: 50,
            x: spawnX,
            y: spawnY,
            vx: Math.cos(t.turretAngle) * speed,
            vy: Math.sin(t.turretAngle) * speed,
            owner: t,
            life: 0,
            maxLife: 80,
        };
    }

    updateHUD();

    bullets.push(b);

    bulletEl.style.left = spawnX + "px";
    bulletEl.style.top = spawnY + "px";
}

function die(t, b) {
    t.alive = false;
    b.owner.score++;
    t.el.style.filter = "grayscale(100%)";
    tocarSom(explosaoSom);
    createExplosion(t.x, t.y);
    t.loot = t.ammo;
    t.el.style.zIndex = "-1";
}

function dieColision(t, t2) {
    t.alive = false;
    t2.score++;
    t.el.style.filter = "grayscale(100%)";
    tocarSom(explosaoSom);
    createExplosion(t.x, t.y);
    t.loot = t.ammo;
    t.el.style.zIndex = "-1";
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

        for (const w of walls) {
            const hitWall =
                b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h;

            if (hitWall) {
                b.el.remove();
                return false;
            }
        }

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
                t.vida -= b.damage;
                if (t.vida <= 30 && !t.slowed) {
                    t.speed /= 2;
                    t.slowed = true;
                    t.el.style.filter = "grayscale(50%)";
                }

                if (t.vida <= 0) {
                    die(t, b);
                }
                createExplosion(t.x, t.y);

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
                    p.x < t.x + TANK_SIDE &&
                    p.x + TANK_SIDE > t.x &&
                    p.y < t.y + TANK_SIZE &&
                    p.y + TANK_SIZE > t.y;

                if (pegou && t.ammoType == p.ammoType) {
                    p.ammo = Math.min(p.ammo + t.loot, 30); //limite
                    t.loot = 0;

                    t.el.innerText = ""; // limpa texto
                    t.el.style.opacity = "0.3";
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
    } else if (alive.length === 0) {
        alert(`O jogo Empatou`);
        location.reload();
    }
}

function addPowerUps() {
    chance = Math.round(Math.random() * 600);
    if (chance == 1) {
        powerUpRoleta = Math.round(Math.random() * 3);
        powerUp = powerUps[powerUpRoleta];
        createPowerUp(powerUp);
    }
}

function createPowerUp(power) {
    const item = document.createElement("div");
    
    if (power == 'speed') item.style.background = 'blue'
    if (power == 'ammo') item.style.background = 'red'
    if (power == 'health') item.style.background = 'green'
    item.style.position = "absolute";
    item.style.width = "40px";
    item.style.height = "40px";
    item.style.borderRadius = "8px";

    const x = Math.random() * (window.innerWidth - 20);
    const y = Math.random() * (window.innerHeight - 20);

    item.style.left = x + "px";
    item.style.top = y + "px";

    body.appendChild(item);

    // salva no array
    powerUpItems.push({
        el: item,
        x: x,
        y: y,
        type: power,
    });
}

function checkColetou() {
    powerUpItems = powerUpItems.filter((item) => {
        for (const t of tanks) {
            if (!t.alive) continue;

            const pegou =
                t.x < item.x + 20 &&
                t.x + TANK_SIDE > item.x &&
                t.y < item.y + 20 &&
                t.y + TANK_SIZE > item.y;

            if (pegou) {
                item.el.remove();

                if (item.type == "speed") {
                    if (t.ammoType == 1) {
                        t.speed = Math.min(t.speed + 0.5, 4);
                    }

                    if (t.ammoType == 2) {
                        t.speed = Math.min(t.speed + 0.5, 5);
                    }

                    if (t.ammoType == 3) {
                        t.speed = Math.min(t.speed + 0.5, 3);
                    }
                } else if (item.type == "health") {
                    if (t.ammoType == 1) {
                        t.vida = Math.min(t.vida + 10, 100);
                    }

                    if (t.ammoType == 2) {
                        t.vida = Math.min(t.vida + 10, 80);
                    }

                    if (t.ammoType == 3) {
                        t.vida = Math.min(t.vida + 10, 150);
                    }
                } else if (item.type == "ammo") {
                    if (t.ammoType == 1) {
                        t.ammo = Math.min(t.ammo + 2, 12);
                    }

                    if (t.ammoType == 2) {
                        t.ammo = Math.min(t.ammo + 4, 20);
                    }

                    if (t.ammoType == 3) {
                        t.ammo = Math.min(t.ammo + 2, 10);
                    }
                }

                return false; // remove da lista
            }
        }
        return true;
    });
}

function isCollidingTanks(t1, t2) {
    return (
        t1.x < t2.x + TANK_SIDE &&
        t1.x + TANK_SIDE > t2.x &&
        t1.y < t2.y + TANK_SIZE &&
        t1.y + TANK_SIZE > t2.y
    );
}

function checkColision() {
    for (let i = 0; i < tanks.length; i++) {
        for (let j = i + 1; j < tanks.length; j++) {
            const t1 = tanks[i];
            const t2 = tanks[j];

            if (!t1.alive || !t2.alive) continue;

            if (isCollidingTanks(t1, t2)) {
                t1.x -= Math.cos(t1.angle) * 2;
                t1.y -= Math.sin(t1.angle) * 2;

                t2.x -= Math.cos(t2.angle) * 2;
                t2.y -= Math.sin(t2.angle) * 2;

                t1.vida -= 1;
                t2.vida -= 1;
                if (t1.vida <= 30 && !t1.slowed) {
                    t1.speed /= 2;
                    t1.slowed = true;
                    t1.el.style.filter = "grayscale(50%)";
                }
                if (t1.vida > 30) {
                    t1.slowed = false;
                    t1.el.style.filter = "grayscale(0%)";
                }
                if (t2.vida <= 30 && !t2.slowed) {
                    t2.speed /= 2;
                    t2.slowed = true;
                    t2.el.style.filter = "grayscale(50%)";
                }
                if (t2.vida > 30) {
                    t2.slowed = false;
                    t2.el.style.filter = "grayscale(0%)";
                }
                if (t1.vida <= 0) {
                    dieColision(t1, t2);
                }
                if (t2.vida <= 0) {
                    dieColision(t2, t1);
                }

                checkWin();
                updateHUD();
            }
        }
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

        if (t.vida > 30) {
            t.slowed = false;
            t.el.style.filter = "grayscale(0%)";

            if (t.ammoType == 1) t.speed = 2;
            if (t.ammoType == 2) t.speed = 2.5;
            if (t.ammoType == 3) t.speed = 1.5;
        }
    });

    checkLoot();
    updateBullets();
    addPowerUps();
    checkColetou();
    checkColision();

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

// CONTROLES MOBILE

function bindTouch(id, key) {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("touchstart", (e) => {
        e.preventDefault();
        keys[key] = true;
    });

    el.addEventListener("touchend", (e) => {
        e.preventDefault();
        keys[key] = false;
    });
}

bindTouch("btnUp", "KeyW");
bindTouch("btnLeft", "KeyA");
bindTouch("btnRight", "KeyD");
bindTouch("btnDown", "KeyS");
bindTouch("torRight", "KeyE");
bindTouch("torLeft", "KeyQ");

document.getElementById("btnFire").addEventListener("touchstart", () => {
    shoot(tanks[0]);
});
