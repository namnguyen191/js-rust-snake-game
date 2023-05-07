use std::vec;

use wasm_bindgen::prelude::*;
use wee_alloc::WeeAlloc;

#[global_allocator]
static ALLOC: WeeAlloc = WeeAlloc::INIT;

#[wasm_bindgen(module = "/www/utils/helper.js")]
extern "C" {
    fn rnd(max: usize) -> usize;
}

#[derive(Clone, PartialEq)]
pub struct SnakeCell(usize);

struct Snake {
    body: Vec<SnakeCell>,
    direction: Direction,
}

impl Snake {
    fn new(spawn_index: usize, size: usize) -> Snake {
        let mut body = vec![];

        for i in 0..size {
            body.push(SnakeCell(spawn_index - i));
        }

        Snake {
            body,
            direction: Direction::Right,
        }
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub enum Direction {
    Up,
    Right,
    Down,
    Left,
}

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq)]
pub enum GameStatus {
    Paused,
    Played,
    Win,
    Lost,
}

#[wasm_bindgen]
pub struct World {
    width: usize,
    size: usize,
    snake: Snake,
    reward_cell: usize,
    game_status: GameStatus,
}

#[wasm_bindgen]
impl World {
    pub fn new(width: usize, snake_idx: usize) -> World {
        let size = width * width;

        let snake = Snake::new(snake_idx, 3);

        let mut world = World {
            width,
            size,
            snake,
            reward_cell: 0,
            game_status: GameStatus::Paused,
        };

        world.reward_cell = world.generate_reward_cell();

        world
    }

    pub fn width(&self) -> usize {
        self.width
    }

    pub fn game_status(&self) -> GameStatus {
        self.game_status
    }

    pub fn set_game_status(&mut self, new_status: GameStatus) {
        self.game_status = new_status
    }

    pub fn snake_head_idx(&self) -> usize {
        self.snake.body[0].0
    }

    pub fn get_snake_cells(&self) -> *const SnakeCell {
        self.snake.body.as_ptr()
    }

    pub fn get_reward_cell(&self) -> usize {
        self.reward_cell
    }

    pub fn snake_length(&self) -> usize {
        self.snake.body.len()
    }

    pub fn change_snake_direction(&mut self, new_direction: Direction) {
        let old_direction = self.snake.direction;

        self.snake.direction = new_direction;

        // change back if the new direction is colliding with body
        if self.generate_next_snake_cell() == self.snake.body[1] {
            self.snake.direction = old_direction
        }
    }

    fn set_snake_head(&mut self, idx: SnakeCell) {
        self.snake.body[0] = idx;
    }

    fn index_to_cell(&self, idx: usize) -> (usize, usize) {
        (idx / self.width, idx % self.width)
    }

    fn cell_to_index(&self, row: usize, col: usize) -> usize {
        (row * self.width) + col
    }

    fn generate_next_snake_cell(&self) -> SnakeCell {
        let snake_idx = self.snake_head_idx();
        let (row, col) = self.index_to_cell(snake_idx);

        let (new_row, new_col) = match self.snake.direction {
            Direction::Right => (row, (col + 1) % self.width),
            Direction::Left => (row, (col - 1 + self.width) % self.width),
            Direction::Up => ((row - 1 + self.width) % self.width, col),
            Direction::Down => ((row + 1) % self.width, col),
        };

        SnakeCell(self.cell_to_index(new_row, new_col))
    }

    fn generate_reward_cell(&self) -> usize {
        if self.snake.body.len() == self.size {
            return usize::MAX;
        }

        let mut reward_cell: usize;
        loop {
            reward_cell = rnd(self.size);
            if !self.snake.body.contains(&SnakeCell(reward_cell)) {
                break;
            }
        }

        reward_cell
    }

    pub fn step(&mut self) {
        let temp = self.snake.body.clone();

        let next_cell = self.generate_next_snake_cell();
        self.set_snake_head(next_cell);

        let len = self.snake.body.len();
        for i in 1..len {
            self.snake.body[i] = SnakeCell(temp[i - 1].0);
        }

        if self.snake.body[1..len].contains(&self.snake.body[0]) {
            self.game_status = GameStatus::Lost;
        }

        if self.reward_cell == self.snake_head_idx() {
            self.snake.body.push(SnakeCell(self.snake.body[1].0));
            self.reward_cell = self.generate_reward_cell();
        }
    }
}

// wasm-pack build --target web
