use bolt_lang::*;

declare_id!("Fn1JzzEdyb55fsyduWS94mYHizGhJZuhvjX6DVvrmGbQ");

#[component(delegate)]
#[derive(Copy, Default)]
pub struct Position {
    pub x: i64,
    pub y: i64,
    pub z: i64,
}
