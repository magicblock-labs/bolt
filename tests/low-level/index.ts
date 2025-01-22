import { Framework } from "../framework";
import { world } from "./world";
import { permissioning } from "./permissioning";
import { acceleration } from "./acceleration";
import { ecs } from "./ecs";
import { session } from "./session";

describe("Low level API", () => {
  let framework: Framework = new Framework();
  world(framework);
  ecs(framework);
  session(framework);
  permissioning(framework);
  acceleration(framework);
});
