using System.Data;
using FlowerShop.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace FlowerShop.Infrastructure.Persistence;

public class DapperContext : IDapperContext
{
    private readonly string _connectionString;

    public DapperContext(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Строка подключения DefaultConnection не найдена в конфигурации.");
    }

    public IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public NpgsqlConnection CreateNpgsqlConnection() => new NpgsqlConnection(_connectionString);
}
