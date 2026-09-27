using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Services;
using FlowerShop.Application.Validators;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace FlowerShop.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IAdminCategoryService, AdminCategoryService>();
        services.AddScoped<IAdminProductService, AdminProductService>();
        services.AddScoped<IAdminOrderService, OrderService>();
        return services;
    }
}
