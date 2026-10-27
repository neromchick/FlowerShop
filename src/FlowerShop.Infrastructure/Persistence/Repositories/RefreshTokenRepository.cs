using Dapper;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;
using FlowerShop.Domain.Entities;

namespace FlowerShop.Infrastructure.Persistence.Repositories;

public class RefreshTokenRepository(IDapperContext dapper) : IRefreshTokenRepository
{
    public async Task SaveTokenAsync(RefreshToken token, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            INSERT INTO ""RefreshTokens"" (""UserId"", ""Token"", ""ExpiresAt"", ""CreatedAt"", ""IsRevoked"")
            VALUES (@UserId, @Token, @ExpiresAt, @CreatedAt, @IsRevoked);";

        await connection.ExecuteAsync(sql, new
        {
            token.UserId,
            token.Token,
            token.ExpiresAt,
            token.CreatedAt,
            token.IsRevoked
        });
    }

    public async Task<RefreshToken?> GetActiveTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string selectTokenSql = @"
            SELECT ""Id"", ""UserId"", ""Token"", ""ExpiresAt"", ""CreatedAt"", ""IsRevoked""
            FROM ""RefreshTokens""
            WHERE ""Token"" = @Token AND ""IsRevoked"" = false;";

        return await connection.QueryFirstOrDefaultAsync<RefreshToken>(selectTokenSql, new { Token = token });
    }

    public async Task RevokeTokenAsync(int tokenId, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"UPDATE ""RefreshTokens"" SET ""IsRevoked"" = true WHERE ""Id"" = @Id;";
        await connection.ExecuteAsync(sql, new { Id = tokenId });
    }

    public async Task RevokeUserTokensAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"UPDATE ""RefreshTokens"" SET ""IsRevoked"" = true WHERE ""UserId"" = @UserId;";
        await connection.ExecuteAsync(sql, new { UserId = userId });
    }
}
