import { Framework } from "../framework";
import { world } from "./world";
import { ecs } from "./ecs";
import { session } from "./session";
import { permissioning } from "./permissioning";
import { acceleration } from "./acceleration";

describe("Low level API", () => {
  let framework: Framework = new Framework();
  describe("World", () => {
    world(framework);
  });
  describe("ECS", () => {
    ecs(framework);
  });
  describe("Session", () => {
    session(framework);
  });
  describe("Permissioning", () => {
    permissioning(framework);
  });
  describe("Acceleration", () => {
    acceleration(framework);
  });
});
