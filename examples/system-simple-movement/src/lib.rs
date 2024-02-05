use bolt_lang::*;

declare_id!("FSa6qoJXFBR3a7ThQkTAMrC15p6NkchPEjBdd4n6dXxA");

#[system]
pub mod system_simple_movement {
    pub fn execute(ctx: Context<Component>, args_p: Vec<u8>) -> Result<Position> {
        let args = parse_args::<Args>(&args_p);

        let mut position = Position::from_account_info(&ctx.accounts.position)?;

        // Compute the new position based on the direction
        let (dx, dy) = match args.direction {
            Direction::Left => (-1, 0),
            Direction::Right => (1, 0),
            Direction::Up => (0, 1),
            Direction::Down => (0, -1),
        };
        position.x += dx;
        position.y += dy;

        Ok(position)
    }
}

// Define the Account to parse from the component
#[derive(Accounts)]
pub struct Component<'info> {
    /// CHECK: check that the component is the expected account
    pub position: AccountInfo<'info>,
}

#[component_deserialize]
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
