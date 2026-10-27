using Dapper;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;
using FlowerShop.Domain.Entities;

namespace FlowerShop.Infrastructure.Persistence.Repositories;

public class RoleRepository(IDapperContext dapper) : IRoleRepository
{
    public async Task<Role?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string selectRoleSql = @"SELECT ""Id"", ""Name"" FROM ""Roles"" WHERE ""Name"" = @RoleName;";
        return await connection.QueryFirstOrDefaultAsync<Role>(selectRoleSql, new { RoleName = name });
    }

    public async Task<Role?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string selectRoleSql = @"SELECT ""Id"", ""Name"" FROM ""Roles"" WHERE ""Id"" = @Id;";
        return await connection.QueryFirstOrDefaultAsync<Role>(selectRoleSql, new { Id = id });
    }
}
