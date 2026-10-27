namespace FlowerShop.Application.DTOs;

public record RegisterRequest(string FullName, string Email, string Password, string? Phone);

public record LoginRequest(string Email, string Password);

public record GoogleAuthRequest(string IdToken);

public record UpdateProfileRequest(string FullName, string? Phone);

public record RefreshRequest(string RefreshToken);

public record AuthResponse(string AccessToken, string RefreshToken, UserProfileDto User);

public record UserProfileDto(Guid Id, string FullName, string Email, string? Phone, string Role);

public record UserWithRoleRow(
    Guid Id,
    string FullName,
    string Email,
    string? PasswordHash,
    string? PhoneNumber,
    int RoleId,
    DateTime CreatedAt,
    string RoleName);
