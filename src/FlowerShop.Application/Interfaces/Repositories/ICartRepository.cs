using FlowerShop.Application.DTOs;

namespace FlowerShop.Application.Interfaces.Repositories;

public interface ICartRepository
{
    Task<IReadOnlyList<CartItemDto>> GetCartAsync(Guid userId, CancellationToken cancellationToken = default);
    Task MergeCartAsync(Guid userId, IEnumerable<CartLineDto> items, CancellationToken cancellationToken = default);
    Task SetItemQuantityAsync(Guid userId, int productId, int quantity, CancellationToken cancellationToken = default);
    Task RemoveItemAsync(Guid userId, int productId, CancellationToken cancellationToken = default);
    Task ClearCartAsync(Guid userId, CancellationToken cancellationToken = default);
}
