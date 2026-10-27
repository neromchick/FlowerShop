using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;
using FlowerShop.Domain.Entities;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace FlowerShop.Infrastructure.Auth;

public class AuthService(
    IUserRepository userRepository,
    IRoleRepository roleRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IJwtTokenService jwtTokenService,
    IConfiguration configuration,
    IPasswordHasher<User> passwordHasher)
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await userRepository.EmailExistsAsync(email, cancellationToken))
            throw new InvalidOperationException("Пользователь с таким email уже зарегистрирован.");

        var role = await roleRepository.GetByNameAsync(RoleNames.Customer, cancellationToken)
            ?? throw new InvalidOperationException("Роль Customer не найдена.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = email,
            PhoneNumber = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            RoleId = role.Id,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        await userRepository.CreateUserAsync(user, cancellationToken);

        return await IssueTokensAsync(user, role.Name, cancellationToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var row = await userRepository.GetByEmailAsync(email, cancellationToken)
            ?? throw new UnauthorizedAccessException("Неверный email или пароль.");

        if (string.IsNullOrEmpty(row.PasswordHash))
            throw new UnauthorizedAccessException("Этот аккаунт зарегистрирован через Google. Пожалуйста, выполните вход через Google.");

        var user = new User
        {
            Id = row.Id,
            FullName = row.FullName,
            Email = row.Email,
            PasswordHash = row.PasswordHash,
            PhoneNumber = row.PhoneNumber,
            RoleId = row.RoleId,
            CreatedAt = row.CreatedAt
        };

        var verificationResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
            throw new UnauthorizedAccessException("Неверный email или пароль.");

        return await IssueTokensAsync(user, row.RoleName, cancellationToken);
    }

    public async Task<AuthResponse> GoogleAuthAsync(GoogleAuthRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
            throw new InvalidOperationException("Токен Google обязателен.");

        var clientId = configuration["GoogleAuth:ClientId"] 
            ?? "23953000961-5oq63rktq4q3a5opragbmh4rllfvceo1.apps.googleusercontent.com";

        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId]
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
        }
        catch (Exception ex)
        {
            throw new UnauthorizedAccessException($"Ошибка проверки Google токена: {ex.Message}");
        }

        var email = payload.Email.Trim().ToLowerInvariant();
        var row = await userRepository.GetByEmailAsync(email, cancellationToken);
        User user;
        string roleName;

        if (row is null)
        {
            var role = await roleRepository.GetByNameAsync(RoleNames.Customer, cancellationToken)
                ?? throw new InvalidOperationException("Роль Customer не найдена.");

            user = new User
            {
                Id = Guid.NewGuid(),
                FullName = string.IsNullOrWhiteSpace(payload.Name) ? email.Split('@')[0] : payload.Name.Trim(),
                Email = email,
                PasswordHash = null,
                PhoneNumber = null,
                RoleId = role.Id,
                CreatedAt = DateTime.UtcNow
            };

            await userRepository.CreateUserAsync(user, cancellationToken);
            roleName = role.Name;
        }
        else
        {
            user = new User
            {
                Id = row.Id,
                FullName = row.FullName,
                Email = row.Email,
                PasswordHash = row.PasswordHash,
                PhoneNumber = row.PhoneNumber,
                RoleId = row.RoleId,
                CreatedAt = row.CreatedAt
            };
            roleName = row.RoleName;
        }

        return await IssueTokensAsync(user, roleName, cancellationToken);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default)
    {
        var stored = await refreshTokenRepository.GetActiveTokenAsync(request.RefreshToken, cancellationToken)
            ?? throw new UnauthorizedAccessException("Refresh-токен недействителен.");

        if (stored.ExpiresAt <= DateTime.UtcNow)
            throw new UnauthorizedAccessException("Refresh-токен истёк.");

        await refreshTokenRepository.RevokeTokenAsync(stored.Id, cancellationToken);

        var row = await userRepository.GetByIdAsync(stored.UserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Пользователь не найден.");

        var user = new User
        {
            Id = row.Id,
            FullName = row.FullName,
            Email = row.Email,
            PasswordHash = row.PasswordHash,
            PhoneNumber = row.PhoneNumber,
            RoleId = row.RoleId,
            CreatedAt = row.CreatedAt
        };

        return await IssueTokensAsync(user, row.RoleName, cancellationToken);
    }

    public async Task<UserProfileDto?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var row = await userRepository.GetByIdAsync(userId, cancellationToken);
        if (row is null) return null;

        return new UserProfileDto(row.Id, row.FullName, row.Email, row.PhoneNumber, row.RoleName);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var row = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Пользователь не найден.");

        await userRepository.UpdateProfileAsync(userId, request.FullName, request.Phone, cancellationToken);

        var updated = await userRepository.GetByIdAsync(userId, cancellationToken);
        return new UserProfileDto(updated!.Id, updated.FullName, updated.Email, updated.PhoneNumber, updated.RoleName);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, string roleName, CancellationToken cancellationToken)
    {
        var (accessToken, expires) = jwtTokenService.CreateAccessToken(user.Id, user.Email, roleName);
        var refreshToken = jwtTokenService.CreateRefreshToken();
        var refreshDays = int.Parse(configuration["Jwt:RefreshTokenDays"] ?? "7");
        var now = DateTime.UtcNow;

        var tokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = now.AddDays(refreshDays),
            CreatedAt = now,
            IsRevoked = false
        };

        await refreshTokenRepository.SaveTokenAsync(tokenEntity, cancellationToken);

        return new AuthResponse(
            accessToken,
            refreshToken,
            new UserProfileDto(user.Id, user.FullName, user.Email, user.PhoneNumber, roleName));
    }
}
