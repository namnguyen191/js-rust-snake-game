import init, { Direction, GameStatus, World } from 'snake_game';

init().then((wasm) => {
  const CELL_SIZE = 50;
  const WORLD_WIDTH = 4;
  const SNAKE_SPAWN_IDX = Date.now() % (WORLD_WIDTH * WORLD_WIDTH);

  const world = World.new(WORLD_WIDTH, SNAKE_SPAWN_IDX);
  const worldWidth = world.width();

  const canvas: HTMLCanvasElement = document.getElementById(
    'snake-canvas'
  ) as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  canvas.height = worldWidth * CELL_SIZE;
  canvas.width = worldWidth * CELL_SIZE;

  paint();
  setupControls();

  function play() {
    if (world.game_status() === GameStatus.Played) {
      return;
    }

    world.set_game_status(GameStatus.Played);
    update();
  }

  function pause() {
    world.set_game_status(GameStatus.Paused);
  }

  function drawWorld(): void {
    ctx.beginPath();

    for (let x = 0; x < worldWidth + 1; x++) {
      ctx.moveTo(CELL_SIZE * x, 0);
      ctx.lineTo(CELL_SIZE * x, worldWidth * CELL_SIZE);
    }

    for (let y = 0; y < worldWidth + 1; y++) {
      ctx.moveTo(0, CELL_SIZE * y);
      ctx.lineTo(worldWidth * CELL_SIZE, CELL_SIZE * y);
    }

    ctx.stroke();
  }

  function drawSnake(): void {
    const snakeCells: Uint32Array = new Uint32Array(
      wasm.memory.buffer,
      world.get_snake_cells(),
      world.snake_length()
    );

    snakeCells.forEach((cellIdx, i) => {
      ctx.fillStyle = i === 0 ? '#7878db' : '#000000';

      const [row, col] = idxToCell(cellIdx);

      ctx.beginPath();
      ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.stroke();
    });
  }

  function paint(): void {
    drawWorld();
    drawSnake();
  }

  function update(): void {
    if (world.game_status() === GameStatus.Lost) {
      alert('You have lost');
      return;
    }

    if (world.game_status() !== GameStatus.Played) {
      return;
    }

    const fps = 6;
    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawWorld();
      drawSnake();
      world.step();
      draw_reward();

      requestAnimationFrame(update);
    }, 1000 / fps);
  }

  function setupControls(): void {
    document.addEventListener('keydown', (e) => {
      e.preventDefault();
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          world.change_snake_direction(Direction.Up);
          break;
        case 'ArrowDown':
        case 'KeyS':
          world.change_snake_direction(Direction.Down);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          world.change_snake_direction(Direction.Left);
          break;
        case 'ArrowRight':
        case 'KeyD':
          world.change_snake_direction(Direction.Right);
          break;
      }
    });

    const gameStatus: HTMLDivElement = document.querySelector(
      '.game-status'
    ) as HTMLDivElement;

    const playBtn: HTMLButtonElement = document.getElementById(
      'playBtn'
    ) as HTMLButtonElement;
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        play();
        gameStatus.innerHTML = 'Playing';
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'initial';
      });
    }

    const pauseBtn: HTMLButtonElement = document.getElementById(
      'pauseBtn'
    ) as HTMLButtonElement;
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        pause();
        gameStatus.innerHTML = 'Paused';
        pauseBtn.style.display = 'none';
        playBtn.style.display = 'initial';
      });
    }
  }

  function draw_reward(): void {
    const rewardCell = world.get_reward_cell();

    if (rewardCell > WORLD_WIDTH * WORLD_WIDTH) {
      return alert('You win!');
    }

    ctx.fillStyle = '#e3f20a';
    const [row, col] = idxToCell(rewardCell);

    ctx.beginPath();
    ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.stroke();
  }

  function idxToCell(idx: number): [number, number] {
    return [Math.floor(idx / worldWidth), idx % worldWidth];
  }
});
