using Dapper;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;

namespace FlowerShop.Infrastructure.Persistence.Repositories;

public class CategoryRepository(IDapperContext dapper) : ICategoryRepository
{
    public async Task<IReadOnlyList<CategoryDto>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            SELECT ""Id"", ""Name"", ""IsActive""
            FROM ""Categories""
            WHERE ""IsActive"" = true
            ORDER BY ""Name"";";

        var categories = await connection.QueryAsync<CategoryDto>(sql);
        return categories.ToList();
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllCategoriesAsync(CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            SELECT ""Id"", ""Name"", ""IsActive""
            FROM ""Categories""
            ORDER BY ""Name"";";

        var categories = await connection.QueryAsync<CategoryDto>(sql);
        return categories.ToList();
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            SELECT ""Id"", ""Name"", ""IsActive""
            FROM ""Categories""
            WHERE ""Id"" = @Id;";

        return await connection.QueryFirstOrDefaultAsync<CategoryDto>(sql, new { Id = id });
    }

    public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        var sql = excludeId.HasValue
            ? @"SELECT 1 FROM ""Categories"" WHERE ""Name"" = @Name AND ""Id"" != @ExcludeId LIMIT 1;"
            : @"SELECT 1 FROM ""Categories"" WHERE ""Name"" = @Name LIMIT 1;";

        var exists = await connection.ExecuteScalarAsync<int?>(sql, new { Name = name, ExcludeId = excludeId });
        return exists.HasValue;
    }

    public async Task<CategoryDto> CreateCategoryAsync(string name, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string insertSql = @"
            INSERT INTO ""Categories"" (""Name"", ""IsActive"")
            VALUES (@Name, true)
            RETURNING ""Id"", ""Name"", ""IsActive"";";

        return await connection.QuerySingleAsync<CategoryDto>(insertSql, new { Name = name });
    }

    public async Task<CategoryDto?> UpdateCategoryAsync(int id, string name, bool isActive, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string updateSql = @"
            UPDATE ""Categories""
            SET ""Name"" = @Name, ""IsActive"" = @IsActive
            WHERE ""Id"" = @Id
            RETURNING ""Id"", ""Name"", ""IsActive"";";

        return await connection.QueryFirstOrDefaultAsync<CategoryDto>(updateSql, new { Id = id, Name = name, IsActive = isActive });
    }

    public async Task<bool> DeleteCategoryAsync(int id, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"DELETE FROM ""Categories"" WHERE ""Id"" = @Id;";
        var affected = await connection.ExecuteAsync(sql, new { Id = id });
        return affected > 0;
    }

    public async Task<bool> HasProductsAsync(int id, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"SELECT 1 FROM ""Products"" WHERE ""CategoryId"" = @CategoryId LIMIT 1;";
        var exists = await connection.ExecuteScalarAsync<int?>(sql, new { CategoryId = id });
        return exists.HasValue;
    }
}
