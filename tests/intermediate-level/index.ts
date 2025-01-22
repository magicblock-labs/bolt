import { Framework, initialize } from "../framework";
import { world } from "./world";
import { delegation } from "./delegation";
import { ecs } from "./ecs";
import { permissioning } from "./permissioning";

describe("Intermediate level API", () => {
  let framework: Framework = new Framework();
  initialize(framework);
  world(framework);
  ecs(framework);
  permissioning(framework);
  delegation(framework);
});
