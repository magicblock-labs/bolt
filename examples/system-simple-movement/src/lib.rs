use bolt_lang::*;

declare_id!("FSa6qoJXFBR3a7ThQkTAMrC15p6NkchPEjBdd4n6dXxA");

#[system]
pub mod system_simple_movement {
    pub fn execute(ctx: Context<Components>, args: Args) -> Result<()> {
        // Compute the new position based on the direction
        let (dx, dy) = match args.direction {
            Direction::Left => (-1, 0),
            Direction::Right => (1, 0),
            Direction::Up => (0, 1),
            Direction::Down => (0, -1),
        };
        ctx.accounts.position.x += dx;
        ctx.accounts.position.y += dy;

        Ok(())
    }

    #[system_input]
    pub struct Components {
        #[component_id("Fn1JzzEdyb55fsyduWS94mYHizGhJZuhvjX6DVvrmGbQ")]
        pub position: Position,
    }

    // Define the structs to deserialize the arguments
    #[arguments]
    struct Args {
        direction: Direction,
    }

    #[arguments]
    pub enum Direction {
        Left,
        Right,
        Up,
        Down,
    }
}
