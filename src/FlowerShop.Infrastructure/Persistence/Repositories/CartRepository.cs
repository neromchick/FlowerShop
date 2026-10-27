using Dapper;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;

namespace FlowerShop.Infrastructure.Persistence.Repositories;

public class CartRepository(IDapperContext dapper) : ICartRepository
{
    public async Task<IReadOnlyList<CartItemDto>> GetCartAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            SELECT c.""ProductId"", p.""Title"", p.""Price"", c.""Quantity"", p.""StockQuantity"", p.""ImageUrl""
            FROM ""CartItems"" c
            JOIN ""Products"" p ON c.""ProductId"" = p.""Id""
            WHERE c.""UserId"" = @UserId
            ORDER BY c.""CreatedAt"" ASC;";

        var items = await connection.QueryAsync<CartItemDto>(sql, new { UserId = userId });
        return items.ToList();
    }

    public async Task MergeCartAsync(Guid userId, IEnumerable<CartLineDto> items, CancellationToken cancellationToken = default)
    {
        var incoming = items
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) })
            .Where(x => x.Quantity > 0)
            .ToList();

        if (incoming.Count == 0)
            return;

        using var connection = dapper.CreateConnection();
        const string sql = @"
            INSERT INTO ""CartItems"" (""UserId"", ""ProductId"", ""Quantity"", ""CreatedAt"")
            VALUES (@UserId, @ProductId, @Quantity, @CreatedAt)
            ON CONFLICT (""UserId"", ""ProductId"")
            DO UPDATE SET ""Quantity"" = GREATEST(""CartItems"".""Quantity"", EXCLUDED.""Quantity"");";

        var now = DateTime.UtcNow;
        var batch = incoming.Select(x => new
        {
            UserId = userId,
            ProductId = x.ProductId,
            Quantity = x.Quantity,
            CreatedAt = now
        });

        await connection.ExecuteAsync(sql, batch);
    }

    public async Task SetItemQuantityAsync(Guid userId, int productId, int quantity, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        if (quantity <= 0)
        {
            await RemoveItemAsync(userId, productId, cancellationToken);
            return;
        }

        const string sql = @"
            INSERT INTO ""CartItems"" (""UserId"", ""ProductId"", ""Quantity"", ""CreatedAt"")
            VALUES (@UserId, @ProductId, @Quantity, @CreatedAt)
            ON CONFLICT (""UserId"", ""ProductId"")
            DO UPDATE SET ""Quantity"" = EXCLUDED.""Quantity"";";

        await connection.ExecuteAsync(sql, new
        {
            UserId = userId,
            ProductId = productId,
            Quantity = quantity,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task RemoveItemAsync(Guid userId, int productId, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"DELETE FROM ""CartItems"" WHERE ""UserId"" = @UserId AND ""ProductId"" = @ProductId;";
        await connection.ExecuteAsync(sql, new { UserId = userId, ProductId = productId });
    }

    public async Task ClearCartAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"DELETE FROM ""CartItems"" WHERE ""UserId"" = @UserId;";
        await connection.ExecuteAsync(sql, new { UserId = userId });
    }
}
