const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const result = document.getElementById("result");
const startButton = document.getElementById("start-button");
const backToMenuButton = document.getElementById("back-to-menu");
const hpFill = document.getElementById("hp-fill");
const livesDisplay = document.getElementById("lives");

const menuBGM = document.getElementById("menu-bgm");
const gameBGM = document.getElementById("game-bgm");

// 画像読み込み
const characterImg = new Image();
characterImg.src = "assets/textures/character.png";

const enemyImg = new Image();
enemyImg.src = "assets/textures/enemy.png";

// 音声関数（cloneNodeで複数同時再生対応）
function playSound(src) {
  const audio = new Audio(src);
  audio.volume = 0.4;
  audio.play();
}

const se = {
  shot: () => playSound("assets/sounds/player_shot.wav"),
  hit: () => playSound("assets/sounds/player_hit.wav"),
  enemyHit: () => playSound("assets/sounds/enemy_hit.wav"),
  barrage: () => playSound("assets/sounds/barrage_start.wav")
};

// ゲーム状態
let player, bullets, enemy, enemyBullets;
let isPlaying = false;
let fireCooldown = 0;
let barrageCooldown = 0;

// プレイヤー初期化
function resetGame() {
  player = {
    x: canvas.width / 2 - 16,
    y: canvas.height - 60,
    width: 32,
    height: 32,
    lives: 3,
    invincible: 0
  };
  bullets = [];
  enemy = {
    x: 190,
    y: 80,
    width: 64,
    height: 64,
    hp: 100,
    hitTimer: 0
  };
  enemyBullets = [];
  fireCooldown = 0;
  barrageCooldown = 0;
  isPlaying = true;
  updateUI();
  gameLoop();
}

// UI更新
function updateUI() {
  livesDisplay.textContent = `残機: ${player.lives}`;
  hpFill.style.width = `${enemy.hp}%`;
}

// 入力設定（マウス追尾とスマホドラッグ）
function setupControls() {
  // マウス移動
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width / 2;
    player.y = e.clientY - rect.top - player.height / 2;
  });

  // スマホドラッグ
  let dragging = false;
  canvas.addEventListener("touchstart", (e) => {
    dragging = true;
    e.preventDefault();
  });
  canvas.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    player.x = touch.clientX - rect.left - player.width / 2;
    player.y = touch.clientY - rect.top - player.height / 2;
  });
  canvas.addEventListener("touchend", () => {
    dragging = false;
  });

  // 左クリック／スマホタップで弾発射
  canvas.addEventListener("click", () => {
    if (!isPlaying) return;
    if (fireCooldown <= 0) {
      bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, speed: 10 });
      se.shot();
      fireCooldown = 15; // 発射間隔（フレーム数）
    }
  });

  // スマホはタップもクリック扱いなので追加不要
}

// 弾更新
function updateBullets() {
  bullets.forEach(b => b.y -= b.speed);
  bullets = bullets.filter(b => b.y > -10);
}

function updateEnemyBullets() {
  enemyBullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
  });
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height + 10 && b.y > -10 && b.x > -10 && b.x < canvas.width + 10);
}

// 弾幕発射（パターンは3種類ランダム）
function fireBarrage() {
  const cx = enemy.x + enemy.width / 2;
  const cy = enemy.y + enemy.height / 2;
  const pattern = Math.floor(Math.random() * 3);
  const bulletsCount = 36;
  barrageCooldown = 90;

  for (let i = 0; i < bulletsCount; i++) {
    let angleDeg = (360 / bulletsCount) * i;
    if (pattern === 1) angleDeg += 10;
    else if (pattern === 2) angleDeg -= 10;
    const angleRad = angleDeg * Math.PI / 180;
    enemyBullets.push({
      x: cx,
      y: cy,
      dx: Math.cos(angleRad) * 3,
      dy: Math.sin(angleRad) * 3
    });
  }
  se.barrage();
}

// 点滅エフェクト用描画
function drawWithBlink(img, x, y, width, height, blinkTimer) {
  if (blinkTimer % 10 < 5) {
    ctx.globalAlpha = 0.5;
  }
  ctx.drawImage(img, x, y, width, height);
  ctx.globalAlpha = 1;
}

// 当たり判定
function checkCollision() {
  // プレイヤー弾→敵
  bullets.forEach((b, i) => {
    if (
      b.x > enemy.x &&
      b.x < enemy.x + enemy.width &&
      b.y > enemy.y &&
      b.y < enemy.y + enemy.height
    ) {
      enemy.hp -= 2;
      se.enemyHit();
      enemy.hitTimer = 20;
      bullets.splice(i, 1);
      updateUI();
      if (enemy.hp <= 0) endGame(true);
    }
  });

  // 敵弾→プレイヤー
  if (player.invincible > 0) {
    player.invincible--;
  } else {
    for (let i = 0; i < enemyBullets.length; i++) {
      const b = enemyBullets[i];
      if (
        b.x > player.x &&
        b.x < player.x + player.width &&
        b.y > player.y &&
        b.y < player.y + player.height
      ) {
        player.lives--;
        player.invincible = 60;
        se.hit();
        updateUI();
        enemyBullets.splice(i, 1);
        if (player.lives <= 0) {
          endGame(false);
        }
        break;
      }
    }
  }
}

// ゲーム終了
function endGame(won) {
  isPlaying = false;
  gameBGM.pause();
  if (won) {
    result.querySelector("h1").textContent = "🎉 クリア！ 🎉";
  } else {
    result.querySelector("h1").textContent = "ゲームオーバー";
  }
  result.style.display = "flex";
  canvas.style.display = "none";
}

// ゲームメインループ
function gameLoop() {
  if (!isPlaying) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // プレイヤー描画（点滅あり）
  if (player.invincible > 0) {
    drawWithBlink(characterImg, player.x, player.y, player.width, player.height, player.invincible);
  } else {
    ctx.drawImage(characterImg, player.x, player.y, player.width, player.height);
  }

  // 敵描画（点滅あり）
  if (enemy.hitTimer > 0) {
    drawWithBlink(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height, enemy.hitTimer);
    enemy.hitTimer--;
  } else {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  }

  // 弾描画
  ctx.fillStyle = "aqua";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));

  ctx.fillStyle = "red";
  enemyBullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  updateBullets();
  updateEnemyBullets();
  checkCollision();

  if (fireCooldown > 0) fireCooldown--;
  if (barrageCooldown > 0) barrageCooldown--;
  else fireBarrage();

  requestAnimationFrame(gameLoop);
}

// イベント登録
startButton.onclick = () => {
  menu.style.display = "none";
  result.style.display = "none";
  canvas.style.display = "block";
  menuBGM.pause();
  gameBGM.currentTime = 0;
  gameBGM.play();
  resetGame();
};

backToMenuButton.onclick = () => {
  result.style.display = "none";
  menu.style.display = "flex";
  canvas.style.display = "none";
  gameBGM.pause();
  menuBGM.currentTime = 0;
  menuBGM.play();
};

// 初期設定
canvas.style.display = "none";
setupControls();
menuBGM.volume = 0.3;
gameBGM.volume = 0.3;
menuBGM.play();
