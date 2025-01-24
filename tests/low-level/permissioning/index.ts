import { component } from "./component";
import { world } from "./world";

export function permissioning(framework) {
  describe("Permissioning", () => {
    component(framework);
    world(framework);
  });
}
