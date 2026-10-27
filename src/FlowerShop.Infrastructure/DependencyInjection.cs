using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;
using FlowerShop.Domain.Entities;
using FlowerShop.Infrastructure.Auth;
using FlowerShop.Infrastructure.Persistence;
using FlowerShop.Infrastructure.Persistence.Repositories;
using FlowerShop.Infrastructure.Storage;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FlowerShop.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Контекст соединений Dapper над Npgsql
        services.AddSingleton<DapperContext>();
        services.AddSingleton<IDapperContext>(sp => sp.GetRequiredService<DapperContext>());

        // Репозитории доступа к данным (Controller -> Service -> Repository)
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

        // Хеширование паролей пользователей (PBKDF2)
        services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

        // Сервисы авторизации и токенов JWT
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<AuthService>();

        // Локальное файловое хранилище изображений
        services.AddSingleton<IFileStorageService, LocalFileStorageService>();

        return services;
    }
}
