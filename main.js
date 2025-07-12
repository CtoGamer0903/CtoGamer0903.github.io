// main.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 国のキャラクターの画像を読み込む
const countryballs = [
  { name: "Poland", imgSrc: "assets/polandball.png", x: 100, y: 100 },
  { name: "Germany", imgSrc: "assets/germanyball.png", x: 300, y: 200 }
];

countryballs.forEach(ball => {
  const img = new Image();
  img.src = ball.imgSrc;
  img.onload = () => {
    ctx.drawImage(img, ball.x, ball.y, 64, 64);
  };
});

// ゲームの基本ループ（後で拡張できる）
function gameLoop() {
  requestAnimationFrame(gameLoop);
  // ctx.clearRect(0, 0, canvas.width, canvas.height); // 描画更新するなら有効化
  // ゲーム状態を更新する処理を書く予定
}

gameLoop();
