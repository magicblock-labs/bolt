import { Framework } from "../framework";
import { world } from "./world";
import { ecs } from "./ecs";
import { session } from "./session";
import { permissioning } from "./permissioning";

describe("Low level API", () => {
  const framework: Framework = new Framework();
  world(framework);
  ecs(framework);
  session(framework);
  permissioning(framework);
});
