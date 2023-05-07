import init, { Direction, GameStatus, World } from 'snake_game';

init().then((wasm) => {
  const DEFAULT_WORLD_WIDTH = 6;
  const DEFAULT_GAME_FPS = 4;
  const CELL_SIZE = 50;
  let world: World;
  let curWorldWidth = DEFAULT_WORLD_WIDTH;
  let fps: number = DEFAULT_GAME_FPS;

  const gameStatus: HTMLDivElement = document.querySelector(
    '.game-status'
  ) as HTMLDivElement;

  const playBtn: HTMLButtonElement = document.getElementById(
    'playBtn'
  ) as HTMLButtonElement;

  const pauseBtn: HTMLButtonElement = document.getElementById(
    'pauseBtn'
  ) as HTMLButtonElement;

  const resetBtn: HTMLButtonElement = document.getElementById(
    'resetBtn'
  ) as HTMLButtonElement;

  const canvas: HTMLCanvasElement = document.getElementById(
    'snake-canvas'
  ) as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');

  paint();
  setupControls();
  setupConfigPanel();

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    for (let x = 0; x < world.width() + 1; x++) {
      ctx.moveTo(CELL_SIZE * x, 0);
      ctx.lineTo(CELL_SIZE * x, world.width() * CELL_SIZE);
    }

    for (let y = 0; y < world.width() + 1; y++) {
      ctx.moveTo(0, CELL_SIZE * y);
      ctx.lineTo(world.width() * CELL_SIZE, CELL_SIZE * y);
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
      // lost case when head and body collapsed
      if (cellIdx === snakeCells[0] && i !== 0) {
        ctx.fillStyle = '#FF0000';
      } else {
        ctx.fillStyle = i === 0 ? '#7878db' : '#000000';
      }

      const [row, col] = idxToCell(cellIdx);

      ctx.beginPath();
      ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.stroke();
    });
  }

  function paint(): void {
    const SNAKE_SPAWN_IDX = Date.now() % (curWorldWidth * curWorldWidth);

    world = World.new(curWorldWidth, SNAKE_SPAWN_IDX);

    canvas.height = curWorldWidth * CELL_SIZE;
    canvas.width = curWorldWidth * CELL_SIZE;
    drawWorld();
    drawSnake();
  }

  function update(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWorld();
    drawSnake();
    checkGameStatus();
    if (world.game_status() !== GameStatus.Played) {
      return;
    }
    world.step();
    draw_reward();

    setTimeout(() => {
      requestAnimationFrame(update);
    }, 1000 / fps);
  }

  function checkGameStatus() {
    if (world.game_status() === GameStatus.Lost) {
      // setTimeout so that alert appear after the lost frame is rendered
      setTimeout(() => {
        alert('You have lost');
      }, 10);
      resetBtn.style.display = 'initial';
      pauseBtn.style.display = 'none';
      gameStatus.innerHTML = 'You Lost!';
      return;
    }
  }

  function setupControls(): void {
    document.addEventListener('keydown', (e) => {
      if (world.game_status() !== GameStatus.Played) {
        return;
      }
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

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        play();
        gameStatus.innerHTML = 'Playing';
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'initial';
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        pause();
        gameStatus.innerHTML = 'Paused';
        pauseBtn.style.display = 'none';
        playBtn.style.display = 'initial';
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        paint();
        gameStatus.innerHTML = 'Paused';
        resetBtn.style.display = 'none';
        playBtn.style.display = 'initial';
      });
    }
  }

  function setupConfigPanel(): void {
    const showConfigBtn: HTMLButtonElement = document.getElementById(
      'config-btn'
    ) as HTMLButtonElement;
    const configPanelModal: HTMLDialogElement = document.getElementById(
      'config-panel-modal'
    ) as HTMLDialogElement;

    showConfigBtn.addEventListener('click', () => {
      configPanelModal.showModal();
    });

    const worldWidthInput: HTMLInputElement = document.getElementById(
      'world-width'
    ) as HTMLInputElement;
    worldWidthInput.value = DEFAULT_WORLD_WIDTH.toString();

    const gameFpsInput: HTMLInputElement = document.getElementById(
      'game-fps'
    ) as HTMLInputElement;
    gameFpsInput.value = DEFAULT_GAME_FPS.toString();

    const confirmBtn: HTMLButtonElement = document.getElementById(
      'confirm-btn'
    ) as HTMLButtonElement;
    confirmBtn.addEventListener('click', () => {
      curWorldWidth = parseInt(worldWidthInput.value);
      fps = parseInt(gameFpsInput.value);
      paint();
      configPanelModal.close();
    });

    const cancelBtn: HTMLButtonElement = document.getElementById(
      'cancel-btn'
    ) as HTMLButtonElement;
    cancelBtn.addEventListener('click', () => configPanelModal.close());
  }

  function draw_reward(): void {
    const rewardCell = world.get_reward_cell();

    if (rewardCell > world.width() * world.width()) {
      return alert('You win!');
    }

    ctx.fillStyle = '#e3f20a';
    const [row, col] = idxToCell(rewardCell);

    ctx.beginPath();
    ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.stroke();
  }

  function idxToCell(idx: number): [number, number] {
    return [Math.floor(idx / world.width()), idx % world.width()];
  }
});
