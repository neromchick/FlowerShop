using Dapper;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;
using FlowerShop.Domain.Entities;

namespace FlowerShop.Infrastructure.Persistence.Repositories;

public class UserRepository(IDapperContext dapper) : IUserRepository
{
    public async Task<UserWithRoleRow?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            SELECT u.""Id"", u.""FullName"", u.""Email"", u.""PasswordHash"", u.""PhoneNumber"", u.""RoleId"", u.""CreatedAt"",
                   r.""Name"" AS ""RoleName""
            FROM ""Users"" u
            JOIN ""Roles"" r ON u.""RoleId"" = r.""Id""
            WHERE LOWER(u.""Email"") = LOWER(@Email);";

        return await connection.QueryFirstOrDefaultAsync<UserWithRoleRow>(sql, new { Email = email.Trim() });
    }

    public async Task<UserWithRoleRow?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            SELECT u.""Id"", u.""FullName"", u.""Email"", u.""PasswordHash"", u.""PhoneNumber"", u.""RoleId"", u.""CreatedAt"",
                   r.""Name"" AS ""RoleName""
            FROM ""Users"" u
            JOIN ""Roles"" r ON u.""RoleId"" = r.""Id""
            WHERE u.""Id"" = @Id;";

        return await connection.QueryFirstOrDefaultAsync<UserWithRoleRow>(sql, new { Id = id });
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"SELECT 1 FROM ""Users"" WHERE LOWER(""Email"") = LOWER(@Email) LIMIT 1;";
        var exists = await connection.ExecuteScalarAsync<int?>(sql, new { Email = email.Trim() });
        return exists.HasValue;
    }

    public async Task CreateUserAsync(User user, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            INSERT INTO ""Users"" (""Id"", ""FullName"", ""Email"", ""PasswordHash"", ""PhoneNumber"", ""RoleId"", ""CreatedAt"")
            VALUES (@Id, @FullName, @Email, @PasswordHash, @PhoneNumber, @RoleId, @CreatedAt);";

        await connection.ExecuteAsync(sql, new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.PasswordHash,
            user.PhoneNumber,
            user.RoleId,
            user.CreatedAt
        });
    }

    public async Task UpdateProfileAsync(Guid id, string fullName, string? phoneNumber, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            UPDATE ""Users""
            SET ""FullName"" = @FullName,
                ""PhoneNumber"" = @PhoneNumber
            WHERE ""Id"" = @Id;";

        await connection.ExecuteAsync(sql, new
        {
            Id = id,
            FullName = fullName.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim()
        });
    }
}
