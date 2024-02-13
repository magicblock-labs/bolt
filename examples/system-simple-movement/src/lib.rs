use bolt_lang::*;
use std::str::FromStr;

declare_id!("FSa6qoJXFBR3a7ThQkTAMrC15p6NkchPEjBdd4n6dXxA");

#[system]
pub mod system_simple_movement {
    use std::io::Write;

    pub fn execute(ctx: Context<Components>, args_p: Vec<u8>) -> Result<Components> {
        let args = parse_args::<Args>(&args_p);

        // Compute the new position based on the direction
        let (dx, dy) = match args.direction {
            Direction::Left => (-1, 0),
            Direction::Right => (1, 0),
            Direction::Up => (0, 1),
            Direction::Down => (0, -1),
        };
        ctx.accounts.position.x += dx;
        ctx.accounts.position.y += dy;

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        #[component_id(address = "Fn1JzzEdyb55fsyduWS94mYHizGhJZuhvjX6DVvrmGbQ")]
        pub position: Position,
    }

    #[component_deserialize]
    #[derive(Clone)]
    pub struct Position {
        pub x: i64,
        pub y: i64,
        pub z: i64,
    }

    // Define the structs to deserialize the arguments
    #[derive(BoltSerialize, BoltDeserialize)]
    struct Args {
        direction: Direction,
    }

    #[derive(BoltSerialize, BoltDeserialize)]
    pub enum Direction {
        Left,
        Right,
        Up,
        Down,
    }
}