import { Keypair } from "@solana/web3.js";
import {
  AddEntity,
  CreateSession,
  InitializeComponent,
  ApplySystem,
  anchor,
  BN,
  Session,
} from "../../clients/bolt-sdk/lib";
import { expect } from "chai";

// TODO: Create the API for it.
export function session(framework) {
  describe("Session", () => {
    let session: Session;
    let entity: anchor.web3.PublicKey;
    let component: anchor.web3.PublicKey;
    let entityWithAuthority: anchor.web3.PublicKey;
    let componentWithAuthority: anchor.web3.PublicKey;

    it("Create Session", async () => {
      const createSession = await CreateSession({
        authority: framework.provider.wallet.publicKey,
        topUp: new BN(1000000000),
      });
      session = createSession.session;
      await framework.provider.sendAndConfirm(createSession.transaction, [
        session.signer,
      ]);
    });

    it("Add entity 1", async () => {
      const addEntity = await AddEntity({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        connection: framework.provider.connection,
      });
      await framework.provider.sendAndConfirm(addEntity.transaction);
      entity = addEntity.entityPda;
    });

    it("Initialize position component", async () => {
      const initializeComponent = await InitializeComponent({
        payer: session.signer.publicKey,
        entity: entity,
        componentId: framework.exampleComponentPosition.programId,
      });
      await framework.provider.sendAndConfirm(initializeComponent.transaction, [
        session.signer,
      ]);
      component = initializeComponent.componentPda;
    });

    it("Apply Fly System on component using session token", async () => {
      const positionBefore =
        await framework.exampleComponentPosition.account.position.fetch(
          component,
        );

      const applySystem = await ApplySystem({
        authority: session.signer.publicKey,
        systemId: framework.systemFly.programId,
        world: framework.worldPda,
        session,
        entities: [
          {
            entity: entity,
            components: [
              { componentId: framework.exampleComponentPosition.programId },
            ],
          },
        ],
      });
      await framework.provider.sendAndConfirm(applySystem.transaction, [
        session.signer,
      ]);

      const positionAfter =
        await framework.exampleComponentPosition.account.position.fetch(
          component,
        );

      expect(positionAfter.x.toNumber()).to.equal(positionBefore.x.toNumber());
      expect(positionAfter.y.toNumber()).to.equal(positionBefore.y.toNumber());
      expect(positionAfter.z.toNumber()).to.equal(
        positionBefore.z.toNumber() + 1,
      );
    });

    it("Add entity for authority test", async () => {
      const addEntity = await AddEntity({
        payer: framework.provider.wallet.publicKey,
        world: framework.worldPda,
        connection: framework.provider.connection,
      });
      await framework.provider.sendAndConfirm(addEntity.transaction);
      entityWithAuthority = addEntity.entityPda;
    });

    it("Initialize position component with authority", async () => {
      const initializeComponent = await InitializeComponent({
        payer: session.signer.publicKey,
        entity: entityWithAuthority,
        componentId: framework.exampleComponentPosition.programId,
        authority: framework.provider.wallet.publicKey,
      });
      await framework.provider.sendAndConfirm(initializeComponent.transaction, [
        session.signer,
      ]);
      componentWithAuthority = initializeComponent.componentPda;
    });

    it("Apply Fly System on component with authority using session token", async () => {
      const positionBefore =
        await framework.exampleComponentPosition.account.position.fetch(
          componentWithAuthority,
        );

      const applySystem = await ApplySystem({
        authority: session.signer.publicKey,
        systemId: framework.systemFly.programId,
        world: framework.worldPda,
        session,
        entities: [
          {
            entity: entityWithAuthority,
            components: [
              { componentId: framework.exampleComponentPosition.programId },
            ],
          },
        ],
      });
      await framework.provider.sendAndConfirm(applySystem.transaction, [
        session.signer,
      ]);

      const positionAfter =
        await framework.exampleComponentPosition.account.position.fetch(
          componentWithAuthority,
        );

      expect(positionAfter.x.toNumber()).to.equal(positionBefore.x.toNumber());
      expect(positionAfter.y.toNumber()).to.equal(positionBefore.y.toNumber());
      expect(positionAfter.z.toNumber()).to.equal(
        positionBefore.z.toNumber() + 1,
      );
    });
  });
}
