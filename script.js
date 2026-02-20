const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

//Dedek
const player = {
  x: 100,
  y: 300,
  width: 40,
  height: 50,
  speed: 5,
  dx: 0,
  dy: 0,
  gravity: 0.6,
  jumpPower: -12,
  grounded: false
};

//Platformy
const platforms = [
  { x: 0, y: 350, width: 800, height: 50 },
  { x: 300, y: 280, width: 120, height: 20 },
  { x: 500, y: 220, width: 120, height: 20 }
];

//Klávesy
const keys = {
  right: false,
  left: false,
  up: false
};

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowRight") keys.right = true;
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "ArrowUp") keys.up = true;
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowRight") keys.right = false;
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowUp") keys.up = false;
});

function update() {
  //Pohyb
  if (keys.right) player.dx = player.speed;
  else if (keys.left) player.dx = -player.speed;
  else player.dx = 0;

  //Skok
  if (keys.up && player.grounded) {
    player.dy = player.jumpPower;
    player.grounded = false;
  }

  //Gravitace
  player.dy += player.gravity;

  //Pohyb
  player.x += player.dx;
  player.y += player.dy;

  //Kolize platforem
  player.grounded = false;
  for (let platform of platforms) {
    if (
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x &&
      player.y + player.height < platform.y + platform.height &&
      player.y + player.height + player.dy >= platform.y
    ) {
      player.dy = 0;
      player.grounded = true;
      player.y = platform.y - player.height;
    }
  }

  //Rohy mapy
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //Platformy
  ctx.fillStyle = "green";
  for (let platform of platforms) {
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  }

  //Dedek
  const playerImage = new Image();
  playerImage.src = "Dedek.png";
  ctx.drawImage(
    playerImage,
    player.x,
    player.y,
    player.width,
    player.height
  );
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
