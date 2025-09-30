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
	}

	#[component]
	pub struct Velocity {
		pub x: i64,
		pub y: i64,
		pub z: i64,
	}

	impl Default for Velocity {
		fn default() -> Self {
			Self { x: 1, y: 2, z: 3, bolt_metadata: Default::default() }
		}
	}

	#[system]
	pub mod movement {

		pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {
			let velocity = &ctx.accounts.velocity;
			let position = &mut ctx.accounts.position;
			position.x += velocity.x;
			position.y += velocity.y;
			position.z += velocity.z;
			Ok(ctx.accounts)
		}

		#[system_input]
		pub struct Components {
			pub position: Position,
			pub velocity: Velocity,
		}
	}

	#[system]
	pub mod stop {
		pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {
			ctx.accounts.velocity.x = 0;
			ctx.accounts.velocity.y = 0;
			ctx.accounts.velocity.z = 0;
			Ok(ctx.accounts)
		}

		#[system_input]
		pub struct Components {
			pub velocity: Velocity,
		}
	}
}
