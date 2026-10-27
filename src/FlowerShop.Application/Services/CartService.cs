using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;

namespace FlowerShop.Application.Services;

public class CartService(ICartRepository cartRepository) : ICartService
{
    public async Task<IReadOnlyList<CartItemDto>> GetCartAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await cartRepository.GetCartAsync(userId, cancellationToken);
    }

    public async Task MergeCartAsync(Guid userId, MergeCartRequest request, CancellationToken cancellationToken = default)
    {
        await cartRepository.MergeCartAsync(userId, request.Items, cancellationToken);
    }

    public async Task SetItemQuantityAsync(Guid userId, int productId, int quantity, CancellationToken cancellationToken = default)
    {
        await cartRepository.SetItemQuantityAsync(userId, productId, quantity, cancellationToken);
    }

    public async Task RemoveItemAsync(Guid userId, int productId, CancellationToken cancellationToken = default)
    {
        await cartRepository.RemoveItemAsync(userId, productId, cancellationToken);
    }

    public async Task ClearCartAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await cartRepository.ClearCartAsync(userId, cancellationToken);
    }
}
