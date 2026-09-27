namespace FlowerShop.Application.DTOs;

public record RegisterRequest(string FullName, string Email, string Password, string? Phone);
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record AuthResponse(
    Guid UserId,
    string FullName,
    string Email,
    string? Phone,
    string Role,
    string AccessToken,
    DateTime AccessTokenExpires,
    string RefreshToken);
public record UserProfileDto(Guid Id, string FullName, string Email, string? Phone, string Role);
