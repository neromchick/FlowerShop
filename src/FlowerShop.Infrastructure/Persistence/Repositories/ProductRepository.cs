using Dapper;
using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;

namespace FlowerShop.Infrastructure.Persistence.Repositories;

public class ProductRepository(IDapperContext dapper) : IProductRepository
{
    public async Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductQuery query, CancellationToken cancellationToken = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize is < 1 or > 100 ? 20 : query.PageSize;
        var offset = (page - 1) * pageSize;

        using var connection = dapper.CreateConnection();

        var where = new List<string> { @"p.""IsActive"" = true" };
        var parameters = new DynamicParameters();

        if (query.CategoryId is > 0)
        {
            where.Add(@"p.""CategoryId"" = @CategoryId");
            parameters.Add("CategoryId", query.CategoryId);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            where.Add(@"p.""Title"" ILIKE @Search");
            parameters.Add("Search", $"%{query.Search.Trim()}%");
        }

        var whereSql = string.Join(" AND ", where);

        var orderBy = query.Sort?.ToLowerInvariant() switch
        {
            "price_asc" => @"p.""Price"" ASC",
            "price_desc" => @"p.""Price"" DESC",
            _ => @"p.""CreatedAt"" DESC"
        };

        var countSql = $@"SELECT COUNT(*) FROM ""Products"" p WHERE {whereSql};";
        var total = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        parameters.Add("Limit", pageSize);
        parameters.Add("Offset", offset);

        var sql = $@"
            SELECT p.""Id"", p.""Title"", p.""Price"", p.""StockQuantity"", p.""Description"", 
                   p.""ImageUrl"", p.""CategoryId"", c.""Name"" AS ""CategoryName"", p.""CreatedAt""
            FROM ""Products"" p
            JOIN ""Categories"" c ON p.""CategoryId"" = c.""Id""
            WHERE {whereSql}
            ORDER BY {orderBy}
            LIMIT @Limit OFFSET @Offset;";

        var items = (await connection.QueryAsync<ProductListItemDto>(sql, parameters)).ToList();

        return new PagedResult<ProductListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<IReadOnlyList<ProductListItemDto>> GetProductsByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default)
    {
        var idList = ids.Distinct().ToArray();
        if (idList.Length == 0) return [];

        using var connection = dapper.CreateConnection();
        const string sql = @"
            SELECT p.""Id"", p.""Title"", p.""Price"", p.""StockQuantity"", p.""Description"", 
                   p.""ImageUrl"", p.""CategoryId"", c.""Name"" AS ""CategoryName"", p.""CreatedAt""
            FROM ""Products"" p
            JOIN ""Categories"" c ON p.""CategoryId"" = c.""Id""
            WHERE p.""Id"" = ANY(@Ids);";

        var items = await connection.QueryAsync<ProductListItemDto>(sql, new { Ids = idList });
        return items.ToList();
    }

    public async Task<ProductListItemDto?> GetProductByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            SELECT p.""Id"", p.""Title"", p.""Price"", p.""StockQuantity"", p.""Description"", 
                   p.""ImageUrl"", p.""CategoryId"", c.""Name"" AS ""CategoryName"", p.""CreatedAt""
            FROM ""Products"" p
            JOIN ""Categories"" c ON p.""CategoryId"" = c.""Id""
            WHERE p.""Id"" = @Id;";

        return await connection.QueryFirstOrDefaultAsync<ProductListItemDto>(sql, new { Id = id });
    }

    public async Task<PagedResult<AdminProductDto>> GetAdminProductsAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;
        var offset = (page - 1) * pageSize;

        using var connection = dapper.CreateConnection();

        const string countSql = @"SELECT COUNT(*) FROM ""Products"";";
        var total = await connection.ExecuteScalarAsync<int>(countSql);

        const string sql = @"
            SELECT p.""Id"", p.""Title"", p.""Price"", p.""StockQuantity"", p.""Description"", 
                   p.""ImageUrl"", p.""CategoryId"", c.""Name"" AS ""CategoryName"", 
                   p.""IsActive"", p.""CreatedAt"", p.""UpdatedAt""
            FROM ""Products"" p
            JOIN ""Categories"" c ON p.""CategoryId"" = c.""Id""
            ORDER BY p.""CreatedAt"" DESC
            LIMIT @Limit OFFSET @Offset;";

        var items = (await connection.QueryAsync<AdminProductDto>(sql, new { Limit = pageSize, Offset = offset })).ToList();

        return new PagedResult<AdminProductDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<AdminProductDto?> GetAdminProductByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            SELECT p.""Id"", p.""Title"", p.""Price"", p.""StockQuantity"", p.""Description"", 
                   p.""ImageUrl"", p.""CategoryId"", c.""Name"" AS ""CategoryName"", 
                   p.""IsActive"", p.""CreatedAt"", p.""UpdatedAt""
            FROM ""Products"" p
            JOIN ""Categories"" c ON p.""CategoryId"" = c.""Id""
            WHERE p.""Id"" = @Id;";

        return await connection.QueryFirstOrDefaultAsync<AdminProductDto>(sql, new { Id = id });
    }

    public async Task<int> CreateProductAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        var now = DateTime.UtcNow;
        const string sql = @"
            INSERT INTO ""Products"" (
                ""Title"", ""Price"", ""StockQuantity"", ""Description"", ""CategoryId"", ""IsActive"", ""CreatedAt"", ""UpdatedAt""
            )
            VALUES (
                @Title, @Price, @StockQuantity, @Description, @CategoryId, @IsActive, @CreatedAt, @UpdatedAt
            )
            RETURNING ""Id"";";

        return await connection.ExecuteScalarAsync<int>(sql, new
        {
            Title = request.Title.Trim(),
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            Description = request.Description?.Trim(),
            CategoryId = request.CategoryId,
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        });
    }

    public async Task<bool> UpdateProductAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            UPDATE ""Products""
            SET ""Title"" = @Title,
                ""Price"" = @Price,
                ""StockQuantity"" = @StockQuantity,
                ""Description"" = @Description,
                ""CategoryId"" = @CategoryId,
                ""IsActive"" = @IsActive,
                ""UpdatedAt"" = @UpdatedAt
            WHERE ""Id"" = @Id;";

        var affected = await connection.ExecuteAsync(sql, new
        {
            Id = id,
            Title = request.Title.Trim(),
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            Description = request.Description?.Trim(),
            CategoryId = request.CategoryId,
            IsActive = request.IsActive,
            UpdatedAt = DateTime.UtcNow
        });

        return affected > 0;
    }

    public async Task<bool> UpdateProductImageAsync(int id, string imageUrl, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            UPDATE ""Products""
            SET ""ImageUrl"" = @ImageUrl, ""UpdatedAt"" = @UpdatedAt
            WHERE ""Id"" = @Id;";

        var affected = await connection.ExecuteAsync(sql, new
        {
            Id = id,
            ImageUrl = imageUrl,
            UpdatedAt = DateTime.UtcNow
        });

        return affected > 0;
    }

    public async Task<bool> DeactivateProductAsync(int id, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            UPDATE ""Products""
            SET ""IsActive"" = false, ""UpdatedAt"" = @UpdatedAt
            WHERE ""Id"" = @Id;";

        var affected = await connection.ExecuteAsync(sql, new
        {
            Id = id,
            UpdatedAt = DateTime.UtcNow
        });

        return affected > 0;
    }
}
