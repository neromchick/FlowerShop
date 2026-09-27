namespace FlowerShop.Application.Interfaces;

public interface IJwtTokenService
{
    (string AccessToken, DateTime AccessExpires) CreateAccessToken(Guid userId, string email, string roleName);
    string CreateRefreshToken();
}
