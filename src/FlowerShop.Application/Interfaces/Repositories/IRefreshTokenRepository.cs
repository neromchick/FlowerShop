using FlowerShop.Domain.Entities;

namespace FlowerShop.Application.Interfaces.Repositories;

public interface IRefreshTokenRepository
{
    Task SaveTokenAsync(RefreshToken token, CancellationToken cancellationToken = default);
    Task<RefreshToken?> GetActiveTokenAsync(string token, CancellationToken cancellationToken = default);
    Task RevokeTokenAsync(int tokenId, CancellationToken cancellationToken = default);
    Task RevokeUserTokensAsync(Guid userId, CancellationToken cancellationToken = default);
}
