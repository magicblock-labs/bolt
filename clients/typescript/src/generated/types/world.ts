/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/world.json`.
 */
export type World = {
  address: "WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n";
  metadata: {
    name: "world";
    version: "0.2.1";
    spec: "0.1.0";
    description: "Bolt World program";
    repository: "https://github.com/magicblock-labs/bolt";
  };
  instructions: [
    {
      name: "addAuthority";
      discriminator: [229, 9, 106, 73, 91, 213, 109, 183];
      accounts: [
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "newAuthority";
        },
        {
          name: "world";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "worldId";
          type: "u64";
        },
      ];
    },
    {
      name: "addEntity";
      discriminator: [163, 241, 57, 35, 244, 244, 48, 57];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "entity";
          writable: true;
        },
        {
          name: "world";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "extraSeed";
          type: {
            option: "bytes";
          };
        },
      ];
    },
    {
      name: "apply";
      discriminator: [248, 243, 145, 24, 105, 50, 162, 225];
      accounts: [
        {
          name: "boltSystem";
        },
        {
          name: "authority";
          signer: true;
        },
        {
          name: "instructionSysvarAccount";
          address: "Sysvar1nstructions1111111111111111111111111";
        },
        {
          name: "world";
        },
      ];
      args: [
        {
          name: "args";
          type: "bytes";
        },
      ];
    },
    {
      name: "applyWithSession";
      discriminator: [213, 69, 29, 230, 142, 107, 134, 103];
      accounts: [
        {
          name: "boltSystem";
        },
        {
          name: "authority";
          signer: true;
        },
        {
          name: "instructionSysvarAccount";
          address: "Sysvar1nstructions1111111111111111111111111";
        },
        {
          name: "world";
        },
        {
          name: "sessionToken";
        },
      ];
      args: [
        {
          name: "args";
          type: "bytes";
        },
      ];
    },
    {
      name: "approveSystem";
      discriminator: [114, 165, 105, 68, 52, 67, 207, 121];
      accounts: [
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "world";
          writable: true;
        },
        {
          name: "system";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "destroyComponent";
      discriminator: [40, 197, 69, 196, 67, 95, 219, 73];
      accounts: [
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "receiver";
          writable: true;
        },
        {
          name: "componentProgram";
        },
        {
          name: "componentProgramData";
        },
        {
          name: "entity";
        },
        {
          name: "component";
          writable: true;
        },
        {
          name: "instructionSysvarAccount";
          address: "Sysvar1nstructions1111111111111111111111111";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "initializeComponent";
      discriminator: [36, 143, 233, 113, 12, 234, 61, 30];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "data";
          writable: true;
        },
        {
          name: "entity";
        },
        {
          name: "componentProgram";
        },
        {
          name: "authority";
        },
        {
          name: "instructionSysvarAccount";
          address: "Sysvar1nstructions1111111111111111111111111";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "initializeNewWorld";
      discriminator: [23, 96, 88, 194, 200, 203, 200, 98];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "world";
          writable: true;
        },
        {
          name: "registry";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "initializeRegistry";
      discriminator: [189, 181, 20, 17, 174, 57, 249, 59];
      accounts: [
        {
          name: "registry";
          writable: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "removeAuthority";
      discriminator: [242, 104, 208, 132, 190, 250, 74, 216];
      accounts: [
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "authorityToDelete";
        },
        {
          name: "world";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "worldId";
          type: "u64";
        },
      ];
    },
    {
      name: "removeSystem";
      discriminator: [218, 80, 71, 80, 161, 130, 149, 120];
      accounts: [
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "world";
          writable: true;
        },
        {
          name: "system";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
  ];
  accounts: [
    {
      name: "entity";
      discriminator: [46, 157, 161, 161, 254, 46, 79, 24];
    },
    {
      name: "registry";
      discriminator: [47, 174, 110, 246, 184, 182, 252, 218];
    },
    {
      name: "world";
      discriminator: [145, 45, 170, 174, 122, 32, 155, 124];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "invalidAuthority";
      msg: "Invalid authority for instruction";
    },
    {
      code: 6001;
      name: "invalidSystemOutput";
      msg: "Invalid system output";
    },
    {
      code: 6002;
      name: "worldAccountMismatch";
      msg: "The provided world account does not match the expected PDA.";
    },
    {
      code: 6003;
      name: "tooManyAuthorities";
      msg: "Exceed the maximum number of authorities.";
    },
    {
      code: 6004;
      name: "authorityNotFound";
      msg: "The provided authority not found";
    },
    {
      code: 6005;
      name: "systemNotApproved";
      msg: "The system is not approved in this world instance";
    },
  ];
  types: [
    {
      name: "entity";
      type: {
        kind: "struct";
        fields: [
          {
            name: "id";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "registry";
      type: {
        kind: "struct";
        fields: [
          {
            name: "worlds";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "world";
      type: {
        kind: "struct";
        fields: [
          {
            name: "id";
            type: "u64";
          },
          {
            name: "entities";
            type: "u64";
          },
          {
            name: "authorities";
            type: {
              vec: "pubkey";
            };
          },
          {
            name: "permissionless";
            type: "bool";
          },
          {
            name: "systems";
            type: "bytes";
          },
        ];
      };
    },
  ];
};
