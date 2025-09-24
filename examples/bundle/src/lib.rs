use bolt_lang::*;

declare_id!("CgfPBUeDUL3GT6b5AUDFE56KKgU4ycWA9ERjEWsfMZCj");

#[bundle]
pub mod example_bundle {

	#[component]
	#[derive(Default)]
	pub struct Position {
		pub x: i64,
		pub y: i64,
		pub z: i64,
		#[max_len(20)]
		pub description: String,
	}

	#[system]
	pub mod system {

		pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {
			let position = &mut ctx.accounts.position;
			position.x += 1;
			position.y += 1;
			Ok(ctx.accounts)
		}

		#[system_input]
		pub struct Components {
			pub position: Position,
		}
	}
}
