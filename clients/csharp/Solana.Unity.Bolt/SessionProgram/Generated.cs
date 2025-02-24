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
using GplSession;
using GplSession.Program;
using GplSession.Errors;
using GplSession.Accounts;
using GplSession.Types;

namespace GplSession
{
    namespace Accounts
    {
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
    }

    namespace Errors
    {
        public enum GplSessionErrorKind : uint
        {
            ValidityTooLong = 6000U,
            InvalidToken = 6001U,
            NoToken = 6002U
        }
    }

    namespace Types
    {
    }

    public partial class GplSessionClient : TransactionalBaseClient<GplSessionErrorKind>
    {
        public GplSessionClient(IRpcClient rpcClient, IStreamingRpcClient streamingRpcClient, PublicKey programId = null) : base(rpcClient, streamingRpcClient, programId ?? new PublicKey(GplSessionProgram.ID))
        {
        }

        public async Task<Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<SessionToken>>> GetSessionTokensAsync(string programAddress = GplSessionProgram.ID, Commitment commitment = Commitment.Confirmed)
        {
            var list = new List<Solana.Unity.Rpc.Models.MemCmp>{new Solana.Unity.Rpc.Models.MemCmp{Bytes = SessionToken.ACCOUNT_DISCRIMINATOR_B58, Offset = 0}};
            var res = await RpcClient.GetProgramAccountsAsync(programAddress, commitment, memCmpList: list);
            if (!res.WasSuccessful || !(res.Result?.Count > 0))
                return new Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<SessionToken>>(res);
            List<SessionToken> resultingAccounts = new List<SessionToken>(res.Result.Count);
            resultingAccounts.AddRange(res.Result.Select(result => SessionToken.Deserialize(Convert.FromBase64String(result.Account.Data[0]))));
            return new Solana.Unity.Programs.Models.ProgramAccountsResultWrapper<List<SessionToken>>(res, resultingAccounts);
        }

        public async Task<Solana.Unity.Programs.Models.AccountResultWrapper<SessionToken>> GetSessionTokenAsync(string accountAddress, Commitment commitment = Commitment.Finalized)
        {
            var res = await RpcClient.GetAccountInfoAsync(accountAddress, commitment);
            if (!res.WasSuccessful)
                return new Solana.Unity.Programs.Models.AccountResultWrapper<SessionToken>(res);
            var resultingAccount = SessionToken.Deserialize(Convert.FromBase64String(res.Result.Value.Data[0]));
            return new Solana.Unity.Programs.Models.AccountResultWrapper<SessionToken>(res, resultingAccount);
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

        protected override Dictionary<uint, ProgramError<GplSessionErrorKind>> BuildErrorsDictionary()
        {
            return new Dictionary<uint, ProgramError<GplSessionErrorKind>>{{6000U, new ProgramError<GplSessionErrorKind>(GplSessionErrorKind.ValidityTooLong, "Requested validity is too long")}, {6001U, new ProgramError<GplSessionErrorKind>(GplSessionErrorKind.InvalidToken, "Invalid session token")}, {6002U, new ProgramError<GplSessionErrorKind>(GplSessionErrorKind.NoToken, "No session token provided")}, };
        }
    }

    namespace Program
    {
        public class CreateSessionAccounts
        {
            public PublicKey SessionToken { get; set; }

            public PublicKey SessionSigner { get; set; }

            public PublicKey Authority { get; set; }

            public PublicKey TargetProgram { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public class RevokeSessionAccounts
        {
            public PublicKey SessionToken { get; set; }

            public PublicKey Authority { get; set; }

            public PublicKey SystemProgram { get; set; } = new PublicKey("11111111111111111111111111111111");
        }

        public static class GplSessionProgram
        {
            public const string ID = "KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5";
            public static Solana.Unity.Rpc.Models.TransactionInstruction CreateSession(CreateSessionAccounts accounts, bool? top_up, long? valid_until, ulong? lamports, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.SessionToken, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.SessionSigner, true), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Authority, true), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.TargetProgram, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(16391441928816673266UL, offset);
                offset += 8;
                if (top_up != null)
                {
                    _data.WriteU8(1, offset);
                    offset += 1;
                    _data.WriteBool(top_up.Value, offset);
                    offset += 1;
                }
                else
                {
                    _data.WriteU8(0, offset);
                    offset += 1;
                }

                if (valid_until != null)
                {
                    _data.WriteU8(1, offset);
                    offset += 1;
                    _data.WriteS64(valid_until.Value, offset);
                    offset += 8;
                }
                else
                {
                    _data.WriteU8(0, offset);
                    offset += 1;
                }

                if (lamports != null)
                {
                    _data.WriteU8(1, offset);
                    offset += 1;
                    _data.WriteU64(lamports.Value, offset);
                    offset += 8;
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

            public static Solana.Unity.Rpc.Models.TransactionInstruction RevokeSession(RevokeSessionAccounts accounts, PublicKey programId = null)
            {
                programId ??= new(ID);
                List<Solana.Unity.Rpc.Models.AccountMeta> keys = new()
                {Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.SessionToken, false), Solana.Unity.Rpc.Models.AccountMeta.Writable(accounts.Authority, false), Solana.Unity.Rpc.Models.AccountMeta.ReadOnly(accounts.SystemProgram, false)};
                byte[] _data = new byte[1200];
                int offset = 0;
                _data.WriteU64(13981146387719806038UL, offset);
                offset += 8;
                byte[] resultData = new byte[offset];
                Array.Copy(_data, resultData, offset);
                return new Solana.Unity.Rpc.Models.TransactionInstruction{Keys = keys, ProgramId = programId.KeyBytes, Data = resultData};
            }
        }
    }
}