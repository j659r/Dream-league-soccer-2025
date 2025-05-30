
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
let score = { blue: 0, red: 0 };

class Player {
  constructor(x, y, color, control = false, isGoalie = false) {
    this.x = x;
    this.y = y;
    this.size = 25;
    this.speed = 2;
    this.color = color;
    this.control = control;
    this.isGoalie = isGoalie;
  }

  moveToward(targetX, targetY) {
    if (this.isGoalie) {
      this.y = Math.max(Math.min(targetY, 350), 150);
      return;
    }
    let dx = targetX - this.x;
    let dy = targetY - this.y;
    let dist = Math.hypot(dx, dy);
    if (dist > 1) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

const user = new Player(100, 200, "blue", true);
const teammates = [new Player(120, 100, "blue"), new Player(120, 300, "blue")];
const userGoalie = new Player(20, 250, "blue", false, true);

const opponents = [new Player(600, 200, "red"), new Player(620, 100, "red"), new Player(620, 300, "red")];
const enemyGoalie = new Player(770, 250, "red", false, true);

let ball = { x: 400, y: 250, radius: 10, dx: 0, dy: 0 };
let keys = {};
let sounds = {
  kick: new Audio("kick.wav"),
  goal: new Audio("goal.wav")
};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

if (isTouchDevice) {
  canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    user.x = touch.clientX - canvas.offsetLeft;
    user.y = touch.clientY - canvas.offsetTop;
  });
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = -ball.dx || 1.5;
  ball.dy = 1.2;
}

function kickBall(towardX, towardY, power = 3) {
  let dx = towardX - user.x;
  let dy = towardY - user.y;
  let dist = Math.hypot(dx, dy);
  ball.dx = (dx / dist) * power;
  ball.dy = (dy / dist) * power;
  sounds.kick.play();
}

function detectBallControl(player) {
  return Math.hypot(ball.x - player.x, ball.y - player.y) < 30;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (user.control) {
    if (keys["ArrowUp"]) user.y -= user.speed;
    if (keys["ArrowDown"]) user.y += user.speed;
    if (keys["ArrowLeft"]) user.x -= user.speed;
    if (keys["ArrowRight"]) user.x += user.speed;
    if (keys["a"]) {
      const mate = teammates.reduce((a, b) =>
        Math.hypot(a.x - user.x, a.y - user.y) < Math.hypot(b.x - user.x, b.y - user.y) ? a : b
      );
      if (detectBallControl(user)) kickBall(mate.x, mate.y, 2.5);
    }
    if (keys["s"] && detectBallControl(user)) {
      kickBall(canvas.width, canvas.height / 2, 4.5);
    }
  }

  teammates.forEach(p => p.moveToward(ball.x, ball.y));
  opponents.forEach(p => p.moveToward(ball.x, ball.y));
  userGoalie.moveToward(ball.x, ball.y);
  enemyGoalie.moveToward(ball.x, ball.y);

  ball.x += ball.dx;
  ball.y += ball.dy;

  ball.dx *= 0.99;
  ball.dy *= 0.99;

  if (ball.x < 0 || ball.x > canvas.width) ball.dx *= -1;
  if (ball.y < 0 || ball.y > canvas.height) ball.dy *= -1;

  let goalTop = 150;
  let goalBottom = 350;

  if (ball.x <= 5 && ball.y > goalTop && ball.y < goalBottom) {
    score.red++;
    sounds.goal.play();
    resetBall();
  }
  if (ball.x >= canvas.width - 5 && ball.y > goalTop && ball.y < goalBottom) {
    score.blue++;
    sounds.goal.play();
    resetBall();
  }

  ctx.fillStyle = "yellow";
  ctx.fillRect(0, goalTop, 5, 200);
  ctx.fillRect(canvas.width - 5, goalTop, 5, 200);

  [...teammates, ...opponents, user, userGoalie, enemyGoalie].forEach(p => p.draw());

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Blue: ${score.blue}`, 20, 30);
  ctx.fillText(`Red: ${score.red}`, canvas.width - 100, 30);

  requestAnimationFrame(gameLoop);
}

gameLoop();
