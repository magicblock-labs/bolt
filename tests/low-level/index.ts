import { Framework, initialize } from "../framework";
import { world } from "./world";
import { permissioning } from "./permissioning";
import { delegation } from "./delegation";
import { ecs } from "./ecs";
import { session } from "./session";

describe("Low level API", () => {
  let framework: Framework = new Framework();
  initialize(framework);
  world(framework);
  ecs(framework);
  session(framework);
  permissioning(framework);
  delegation(framework);
});
