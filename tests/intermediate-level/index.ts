import { Framework } from "../framework";
import { world } from "./world";
import { acceleration } from "./acceleration";
import { ecs } from "./ecs";
import { permissioning } from "./permissioning";

describe("Intermediate level API", () => {
  let framework: Framework = new Framework();
  world(framework);
  ecs(framework);
  permissioning(framework);
  acceleration(framework);
});
