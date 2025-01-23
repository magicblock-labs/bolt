import { Framework } from "../framework";
import { world } from "./world";
import { ecs } from "./ecs";
import { session } from "./session";
import { permissioning } from "./permissioning";
import { acceleration } from "./acceleration";

describe("Intermediate level API", () => {
  let framework: Framework = new Framework();
  world(framework);
  ecs(framework);
  session(framework);
  permissioning(framework);
  acceleration(framework);
});
