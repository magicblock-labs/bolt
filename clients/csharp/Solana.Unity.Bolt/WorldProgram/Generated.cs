#pragma warning disable CS1591

using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Threading.Tasks;
using Solana.Unity;
using Solana.Unity.Programs.Abstract;
using Solana.Unity.Programs.Utilities;
using Solana.Unity.Rpc;
using Solana.Unity.Rpc.Builders;
using Solana.Unity.Rpc.Core.Http;
using Solana.Unity.Rpc.Core.Sockets;
using Solana.Unity.Rpc.Types;
using Solana.Unity.Wallet;
using World;
using World.Program;
using World.Errors;
using World.Accounts;
using World.Types;

namespace World
{
    namespace Accounts
    {
        public partial class Entity
        {
            public static ulong ACCOUNT_DISCRIMINATOR => 1751670451238706478UL;
            public static ReadOnlySpan<byte> ACCOUNT_DISCRIMINATOR_BYTES => new byte[]{46, 157, 161, 161, 254, 46, 79, 24};
            public static string ACCOUNT_DISCRIMINATOR_B58 => "8oEQa6zH67R";
            public ulong Id { get; set; }

            public static Entity Deserialize(ReadOnlySpan<byte> _data)
            {
                int offset = 0;
                ulong accountHashValue = _data.GetU64(offset);
                offset += 8;
                if (accountHashValue != ACCOUNT_DISCRIMINATOR)
                {
                    return null;
                }

                Entity result = new Entity();
                result.Id = _data.GetU64(offset);
                offset += 8;
                return result;
            }
        }

        public partial class Registry
        {
            public static ulong ACCOUNT_DISCRIMINATOR => 15779688099924061743UL;
            public static ReadOnlySpan<byte> ACCOUNT_DISCRIMINATOR_BYTES => new byte[]{47, 174, 110, 246, 184, 182, 252, 218};
            public static string ACCOUNT_DISCRIMINATOR_B58 => "8ya1XGY4XBP";
            public ulong Worlds { get; set; }

            public static Registry Deserialize(ReadOnlySpan<byte> _data)
            {
                int offset = 0;
                ulong accountHashValue = _data.GetU64(offset);
                offset += 8;
                if (accountHashValue != ACCOUNT_DISCRIMINATOR)
                {
                    return null;
                }

                Registry result = new Registry();
                result.Worlds = _data.GetU64(offset);
                offset += 8;
                return result;
            }
        }

        public partial class SessionToken
        {
            public static ulong ACCOUNT_DISCRIMINATOR => 1081168673100727529UL;
            public static ReadOnlySpan<byte> ACCOUNT_DISCRIMINATOR_BYTES => new byte[]{233, 4, 115, 14, 46, 21, 1, 15};
            public static string ACCOUNT_DISCRIMINATOR_B58 => "fyZWTdUu1pS";
            public PublicKey Authority { get; set; }

            public PublicKey TargetProgram { get; set; }

            public PublicKey SessionSigner { get; set; }

            public long ValidUntil { get; set; }

            public static SessionToken Deserialize(ReadOnlySpan<byte> _data)
            {
                int offset = 0;
                ulong accountHashValue = _data.GetU64(offset);
                offset += 8;
                if (accountHashValue != ACCOUNT_DISCRIMINATOR)
                {
                    return null;
                }

                SessionToken result = new SessionToken();
                result.Authority = _data.GetPubKey(offset);
                offset += 32;
                result.TargetProgram = _data.GetPubKey(offset);
                offset += 32;
                result.SessionSigner = _data.GetPubKey(offset);
                offset += 32;
                result.ValidUntil = _data.GetS64(offset);
                offset += 8;
                return result;
            }
        }

        public partial class World
        {
            public static ulong ACCOUNT_DISCRIMINATOR => 8978805993381703057UL;
            public static ReadOnlySpan<byte> ACCOUNT_DISCRIMINATOR_BYTES => new byte[]{145, 45, 170, 174, 122, 32, 155, 124};
            public static string ACCOUNT_DISCRIMINATOR_B58 => "RHQudtaQtu1";
            public ulong Id { get; set; }

            public ulong Entities { get; set; }

            public PublicKey[] Authorities { get; set; }

            public bool Permissionless { get; set; }

            public byte[] Systems { get; set; }

            public static World Deserialize(ReadOnlySpan<byte> _data)
            {
                int offset = 0;
                ulong accountHashValue = _data.GetU64(offset);
                offset += 8;
                if (accountHashValue != ACCOUNT_DISCRIMINATOR)
                {
                    return null;
                }

                World result = new World();
                result.Id = _data.GetU64(offset);
                offset += 8;
                result.Entities = _data.GetU64(offset);
                offset += 8;
                int resultAuthoritiesLength = (int)_data.GetU32(offset);
                offset += 4;
                result.Authorities = new PublicKey[resultAuthoritiesLength];
                for (uint resultAuthoritiesIdx = 0; resultAuthoritiesIdx < resultAuthoritiesLength; resultAuthoritiesIdx++)
                {
                    result.Authorities[resultAuthoritiesIdx] = _data.GetPubKey(offset);
                    offset += 32;
                }

                result.Permissionless = _data.GetBool(offset);
                offset += 1;
                int resultSystemsLength = (int)_data.GetU32(offset);
                offset += 4;
                result.Systems = _data.GetBytes(offset, resultSystemsLength);
                offset += resultSystemsLength;
                return result;
            }
        }
    }

    namespace Errors
    {
        public enum WorldErrorKind : uint
        {
            InvalidAuthority = 6000U,
            InvalidSystemOutput = 6001U,
            WorldAccountMismatch = 6002U,
            TooManyAuthorities = 6003U,
            AuthorityNotFound = 6004U,
            SystemNotApproved = 6005U,
            InvalidComponentOwner = 6006U
        }
    }

    namespace Types
    {
    }

    public partial class WorldClient : TransactionalBaseClient<WorldErrorKind>
    {
        public WorldClient(IRpcClient rpcClient, IStreamingRpcClient streamingRpcClient, PublicKey programId = null) : base(rpcClient, streamingRpcClient, programId ?? new PublicKey(WorldProgram.ID))
        {
        }

        public async Task<Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<Entity>>> GetEntitysAsync(string programAddress = WorldProgram.ID, Commitment commitment = Commitment.Confirmed)
        {
            var list = new List<Solana.Unity.Rpc.Models.MemCmp>{new Solana.Unity.Rpc.Models.MemCmp{Bytes = Entity.ACCOUNT_DISCRIMINATOR_B58, Offset = 0}};
            var res = await RpcClient.GetProgramAccountsAsync(programAddress, commitment, memCmpList: list);
            if (!res.WasSuccessful || !(res.Result?.Count > 0))
                return new Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<Entity>>(res);
            List<Entity> resultingAccounts = new List<Entity>(res.Result.Count);
            resultingAccounts.AddRange(res.Result.Select(result => Entity.Deserialize(Convert.FromBase64String(result.Account.Data[0]))));
            return new Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<Entity>>(res, resultingAccounts);
        }

        public async Task<Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<Registry>>> GetRegistrysAsync(string programAddress = WorldProgram.ID, Commitment commitment = Commitment.Confirmed)
        {
            var list = new List<Solana.Unity.Rpc.Models.MemCmp>{new Solana.Unity.Rpc.Models.MemCmp{Bytes = Registry.ACCOUNT_DISCRIMINATOR_B58, Offset = 0}};
            var res = await RpcClient.GetProgramAccountsAsync(programAddress, commitment, memCmpList: list);
            if (!res.WasSuccessful || !(res.Result?.Count > 0))
                return new Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<Registry>>(res);
            List<Registry> resultingAccounts = new List<Registry>(res.Result.Count);
            resultingAccounts.AddRange(res.Result.Select(result => Registry.Deserialize(Convert.FromBase64String(result.Account.Data[0]))));
            return new Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<Registry>>(res, resultingAccounts);
        }

        public async Task<Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<SessionToken>>> GetSessionTokensAsync(string programAddress = WorldProgram.ID, Commitment commitment = Commitment.Confirmed)
        {
            var list = new List<Solana.Unity.Rpc.Models.MemCmp>{new Solana.Unity.Rpc.Models.MemCmp{Bytes = SessionToken.ACCOUNT_DISCRIMINATOR_B58, Offset = 0}};
            var res = await RpcClient.GetProgramAccountsAsync(programAddress, commitment, memCmpList: list);
            if (!res.WasSuccessful || !(res.Result?.Count > 0))
                return new Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<SessionToken>>(res);
            List<SessionToken> resultingAccounts = new List<SessionToken>(res.Result.Count);
            resultingAccounts.AddRange(res.Result.Select(result => SessionToken.Deserialize(Convert.FromBase64String(result.Account.Data[0]))));
            return new Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<SessionToken>>(res, resultingAccounts);
        }

        public async Task<Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<World.Accounts.World>>> GetWorldsAsync(string programAddress = WorldProgram.ID, Commitment commitment = Commitment.Confirmed)
        {
            var list = new List<Solana.Unity.Rpc.Models.MemCmp>{new Solana.Unity.Rpc.Models.MemCmp{Bytes = World.Accounts.World.ACCOUNT_DISCRIMINATOR_B58, Offset = 0}};
            var res = await RpcClient.GetProgramAccountsAsync(programAddress, commitment, memCmpList: list);
            if (!res.WasSuccessful || !(res.Result?.Count > 0))
                return new Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<World.Accounts.World>>(res);
            List<World.Accounts.World> resultingAccounts = new List<World.Accounts.World>(res.Result.Count);
            resultingAccounts.AddRange(res.Result.Select(result => World.Accounts.World.Deserialize(Convert.FromBase64String(result.Account.Data[0]))));
            return new Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<World.Accounts.World>>(res, resultingAccounts);
        }

        public async Task<Solana.Unity.Programs.Models.AccountResultWrapper<Entity>> GetEntityAsync(string accountAddress, Commitment commitment = Commitment.Finalized)
        {
            var res = await RpcClient.GetAccountInfoAsync(accountAddress, commitment);
            if (!res.WasSuccessful)
                return new Solana.Unity.Programs.Models.AccountResultWrapper<Entity>(res);
            var resultingAccount = Entity.Deserialize(Convert.FromBase64String(res.Result.Value.Data[0]));
            return new Solana.Unity.Programs.Models.AccountResultWrapper<Entity>(res, resultingAccount);
        }

        public async Task<Solana.Unity.Programs.Models.AccountResultWrapper<Registry>> GetRegistryAsync(string accountAddress, Commitment commitment = Commitment.Finalized)
        {
            var res = await RpcClient.GetAccountInfoAsync(accountAddress, commitment);
            if (!res.WasSuccessful)
                return new Solana.Unity.Programs.Models.AccountResultWrapper<Registry>(res);
            var resultingAccount = Registry.Deserialize(Convert.FromBase64String(res.Result.Value.Data[0]));
            return new Solana.Unity.Programs.Models.AccountResultWrapper<Registry>(res, resultingAccount);
        }

        public async Task<Solana.Unity.Programs.Models.AccountResultWrapper<SessionToken>> GetSessionTokenAsync(string accountAddress, Commitment commitment = Commitment.Finalized)
        {
            var res = await RpcClient.GetAccountInfoAsync(accountAddress, commitment);
            if (!res.WasSuccessful)
                return new Solana.Unity.Programs.Models.AccountResultWrapper<SessionToken>(res);
            var resultingAccount = SessionToken.Deserialize(Convert.FromBase64String(res.Result.Value.Data[0]));
            return new Solana.Unity.Programs.Models.AccountResultWrapper<SessionToken>(res, resultingAccount);
        }

        public async Task<Solana.Unity.Programs.Models.AccountResultWrapper<World.Accounts.World>> GetWorldAsync(string accountAddress, Commitment commitment = Commitment.Finalized)
        {
            var res = await RpcClient.GetAccountInfoAsync(accountAddress, commitment);
            if (!res.WasSuccessful)
                return new Solana.Unity.Programs.Models.AccountResultWrapper<World.Accounts.World>(res);
            var resultingAccount = World.Accounts.World.Deserialize(Convert.FromBase64String(res.Result.Value.Data[0]));
            return new Solana.Unity.Programs.Models.AccountResultWrapper<World.Accounts.World>(res, resultingAccount);
        }

        public async Task<SubscriptionState> SubscribeEntityAsync(string accountAddress, Action<SubscriptionState, Solana.Unity.Rpc.Messages.ResponseValue<Solana.Unity.Rpc.Models.AccountInfo>, Entity> callback, Commitment commitment = Commitment.Finalized)
        {
            SubscriptionState res = await StreamingRpcClient.SubscribeAccountInfoAsync(accountAddress, (s, e) =>
            {
                Entity parsingResult = null;
                if (e.Value?.Data?.Count > 0)
                    parsingResult = Entity.Deserialize(Convert.FromBase64String(e.Value.Data[0]));
                callback(s, e, parsingResult);
            }, commitment);
            return res;
        }

        public async Task<SubscriptionState> SubscribeRegistryAsync(string accountAddress, Action<SubscriptionState, Solana.Unity.Rpc.Messages.ResponseValue<Solana.Unity.Rpc.Models.AccountInfo>, Registry> callback, Commitment commitment = Commitment.Finalized)
        {
            SubscriptionState res = await StreamingRpcClient.SubscribeAccountInfoAsync(accountAddress, (s, e) =>
            {
                Registry parsingResult = null;
                if (e.Value?.Data?.Count > 0)
                    parsingResult = Registry.Deserialize(Convert.FromBase64String(e.Value.Data[0]));
                callback(s, e, parsingResult);
            }, commitment);
            return res;
        }

        public async Task<SubscriptionState> SubscribeSessionTokenAsync(string accountAddress, Action<SubscriptionState, Solana.Unity.Rpc.Messages.ResponseValue<Solana.Unity.Rpc.Models.AccountInfo>, SessionToken> callback, Commitment commitment = Commitment.Finalized)
        {
            SubscriptionState res = await StreamingRpcClient.SubscribeAccountInfoAsync(accountAddress, (s, e) =>
            {
                SessionToken parsingResult = null;
                if (e.Value?.Data?.Count > 0)
                    parsingResult = SessionToken.Deserialize(Convert.FromBase64String(e.Value.Data[0]));
                callback(s, e, parsingResult);
            }, commitment);
            return res;
        }

        public async Task<SubscriptionState> SubscribeWorldAsync(string accountAddress, Action<SubscriptionState, Solana.Unity.Rpc.Messages.ResponseValue<Solana.Unity.Rpc.Models.AccountInfo>, World.Accounts.World> callback, Commitment commitment = Commitment.Finalized)
        {
            SubscriptionState res = await StreamingRpcClient.SubscribeAccountInfoAsync(accountAddress, (s, e) =>
            {
                World.Accounts.World parsingResult = null;
                if (e.Value?.Data?.Count > 0)
                    parsingResult = World.Accounts.World.Deserialize(Convert.FromBase64String(e.Value.Data[0]));
                callback(s, e, parsingResult);
            }, commitment);
            return res;
        }

        protected override Dictionary<uint, ProgramError<WorldErrorKind>> BuildErrorsDictionary()
        {
            return new Dictionary<uint, ProgramError<WorldErrorKind>>{{6000U, new ProgramError<WorldErrorKind>(WorldErrorKind.InvalidAuthority, "Invalid authority for instruction")}, {6001U, new ProgramError<WorldErrorKind>(WorldErrorKind.InvalidSystemOutput, "Invalid system output")}, {6002U, new ProgramError<WorldErrorKind>(WorldErrorKind.WorldAccountMismatch, "The provided world account does not match the expected PDA.")}, {6003U, new ProgramError<WorldErrorKind>(WorldErrorKind.TooManyAuthorities, "Exceed the maximum number of authorities.")}, {6004U, new ProgramError<WorldErrorKind>(WorldErrorKind.AuthorityNotFound, "The provided authority not found")}, {6005U, new ProgramError<WorldErrorKind>(WorldErrorKind.SystemNotApproved, "The system is not approved in this world instance")}, {6006U, new ProgramError<WorldErrorKind>(WorldErrorKind.InvalidComponentOwner, "The component owner does not match the program")}, };
        }
    }

    namespace Program
    {
        public class AddAuthorityAccounts
        {
            public PublicKey Authority { get; set; }

            public PublicKey NewAuthority { get; set; }

            public PublicKey World { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public class AddEntityAccounts
        {
            public PublicKey Payer { get; set; }

            public PublicKey Entity { get; set; }

            public PublicKey World { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public class ApplyAccounts
        {
            public PublicKey Buffer { get; set; }

            public PublicKey BoltSystem { get; set; }

            public PublicKey Authority { get; set; }

            public PublicKey CpiAuth { get; set; }

            public PublicKey World { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public class ApplyWithSessionAccounts
        {
            public PublicKey Buffer { get; set; }

            public PublicKey BoltSystem { get; set; }

            public PublicKey Authority { get; set; }

            public PublicKey CpiAuth { get; set; }

            public PublicKey World { get; set; }

            public PublicKey SessionToken { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public class ApproveSystemAccounts
        {
            public PublicKey Authority { get; set; }

            public PublicKey World { get; set; }

            public PublicKey System { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public class DestroyComponentAccounts
        {
            public PublicKey Authority { get; set; }

            public PublicKey Receiver { get; set; }

            public PublicKey ComponentProgram { get; set; }

            public PublicKey ComponentProgramData { get; set; }

            public PublicKey Entity { get; set; }

            public PublicKey Component { get; set; }

            public PublicKey CpiAuth { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public class InitializeComponentAccounts
        {
            public PublicKey Payer { get; set; }

            public PublicKey Data { get; set; }

            public PublicKey Entity { get; set; }

            public PublicKey ComponentProgram { get; set; }

            public PublicKey Authority { get; set; }

            public PublicKey CpiAuth { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");

            public PublicKey Buffer { get; set; }
        }

        public class InitializeNewWorldAccounts
        {
            public PublicKey Payer { get; set; }

            public PublicKey World { get; set; }

            public PublicKey Registry { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public class InitializeRegistryAccounts
        {
            public PublicKey Registry { get; set; }

            public PublicKey Payer { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public class RemoveAuthorityAccounts
        {
            public PublicKey Authority { get; set; }

            public PublicKey AuthorityToDelete { get; set; }

            public PublicKey World { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public class RemoveSystemAccounts
        {
            public PublicKey Authority { get; set; }

            public PublicKey World { get; set; }

            public PublicKey System { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public partial class WorldProgram
        {
            public const string ID = "WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n";
            public static Solana.Unity.Rpc.Models.TransactionInstruction AddAuthority(AddAuthorityAccounts accounts, ulong world_id, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Authority, true), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.NewAuthority, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.World, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(13217455069452700133UL, offset);
                offset += 8;
                _data.WriteU64(world_id, offset);
                offset += 8;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction AddEntity(AddEntityAccounts accounts, byte[] extra_seed, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Payer, true), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Entity, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.World, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(4121062988444201379UL, offset);
                offset += 8;
                if (extra_seed != null)
                {
                    _data.WriteU8(1, offset);
                    offset += 1;
                    _data.WriteS32(extra_seed.Length, offset);
                    offset += 4;
                    _data.WriteSpan(extra_seed, offset);
                    offset += extra_seed.Length;
                }
                else
                {
                    _data.WriteU8(0, offset);
                    offset += 1;
                }

                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction Apply(ApplyAccounts accounts, byte[] args, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Buffer, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.BoltSystem, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Authority, true), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.CpiAuth, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.World, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(16258613031726085112UL, offset);
                offset += 8;
                _data.WriteS32(args.Length, offset);
                offset += 4;
                _data.WriteSpan(args, offset);
                offset += args.Length;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction ApplyWithSession(ApplyWithSessionAccounts accounts, byte[] args, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Buffer, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.BoltSystem, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Authority, true), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.CpiAuth, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.World, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SessionToken, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(7459768094276011477UL, offset);
                offset += 8;
                _data.WriteS32(args.Length, offset);
                offset += 4;
                _data.WriteSpan(args, offset);
                offset += args.Length;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction ApproveSystem(ApproveSystemAccounts accounts, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Authority, true), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.World, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.System, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(8777308090533520754UL, offset);
                offset += 8;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction DestroyComponent(DestroyComponentAccounts accounts, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Authority, true), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Receiver, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.ComponentProgram, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.ComponentProgramData, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.Entity, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Component, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.CpiAuth, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(5321952129328727336UL, offset);
                offset += 8;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction InitializeComponent(InitializeComponentAccounts accounts, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Payer, true), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Data, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.Entity, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.ComponentProgram, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.Authority, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.CpiAuth, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Buffer, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(2179155133888827172UL, offset);
                offset += 8;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction InitializeNewWorld(InitializeNewWorldAccounts accounts, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Payer, true), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.World, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Registry, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(7118163274173538327UL, offset);
                offset += 8;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction InitializeRegistry(InitializeRegistryAccounts accounts, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Registry, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Payer, true), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(4321548737212364221UL, offset);
                offset += 8;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction RemoveAuthority(RemoveAuthorityAccounts accounts, ulong world_id, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Authority, true), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.AuthorityToDelete, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.World, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(15585545156648003826UL, offset);
                offset += 8;
                _data.WriteU64(world_id, offset);
                offset += 8;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }

            public static Solana.Unity.Rpc.Models.TransactionInstruction RemoveSystem(RemoveSystemAccounts accounts, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Authority, true), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.World, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.System, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(8688994685429436634UL, offset);
                offset += 8;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }
        }
    }
}