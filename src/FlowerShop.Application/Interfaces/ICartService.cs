using FlowerShop.Application.DTOs;

namespace FlowerShop.Application.Interfaces;

public interface ICartService
{
    Task<IReadOnlyList<CartItemDto>> GetCartAsync(Guid userId, CancellationToken cancellationToken = default);
    Task MergeCartAsync(Guid userId, MergeCartRequest request, CancellationToken cancellationToken = default);
    Task ClearCartAsync(Guid userId, CancellationToken cancellationToken = default);
}
