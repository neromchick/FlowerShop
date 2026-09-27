using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Domain.Entities;
using FlowerShop.Infrastructure.Identity;
using FlowerShop.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FlowerShop.Infrastructure.Auth;

public class AuthService(
    UserManager<AppUser> userManager,
    ApplicationDbContext db,
    IJwtTokenService jwtTokenService,
    IConfiguration configuration)
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var customerRole = await db.BusinessRoles.FirstAsync(r => r.Name == RoleNames.Customer, cancellationToken);

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email.Trim().ToLowerInvariant(),
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = request.FullName.Trim(),
            PhoneNumber = request.Phone,
            RoleId = customerRole.Id,
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(user, RoleNames.Customer);
        return await IssueTokensAsync(user, customerRole.Name, cancellationToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(email)
            ?? throw new UnauthorizedAccessException("Неверный email или пароль.");

        if (!await userManager.CheckPasswordAsync(user, request.Password))
            throw new UnauthorizedAccessException("Неверный email или пароль.");

        var role = await db.BusinessRoles.AsNoTracking().FirstAsync(r => r.Id == user.RoleId, cancellationToken);
        return await IssueTokensAsync(user, role.Name, cancellationToken);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default)
    {
        var stored = await db.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && !t.IsRevoked, cancellationToken)
            ?? throw new UnauthorizedAccessException("Refresh-токен недействителен.");

        if (stored.ExpiresAt <= DateTime.UtcNow)
            throw new UnauthorizedAccessException("Refresh-токен истёк.");

        stored.IsRevoked = true;

        var user = await userManager.FindByIdAsync(stored.UserId.ToString())
            ?? throw new UnauthorizedAccessException("Пользователь не найден.");

        var role = await db.BusinessRoles.AsNoTracking().FirstAsync(r => r.Id == user.RoleId, cancellationToken);
        return await IssueTokensAsync(user, role.Name, cancellationToken);
    }

    public async Task<UserProfileDto?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            return null;

        var role = await db.BusinessRoles.AsNoTracking().FirstAsync(r => r.Id == user.RoleId, cancellationToken);
        return new UserProfileDto(user.Id, user.FullName, user.Email!, user.PhoneNumber, role.Name);
    }

    private async Task<AuthResponse> IssueTokensAsync(AppUser user, string roleName, CancellationToken cancellationToken)
    {
        var (accessToken, expires) = jwtTokenService.CreateAccessToken(user.Id, user.Email!, roleName);
        var refreshToken = jwtTokenService.CreateRefreshToken();
        var refreshDays = int.Parse(configuration["Jwt:RefreshTokenDays"] ?? "7");

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshDays),
            IsRevoked = false
        });

        await db.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            user.Id,
            user.FullName,
            user.Email!,
            user.PhoneNumber,
            roleName,
            accessToken,
            expires,
            refreshToken);
    }
}

public static class RoleNames
{
    public const string Customer = "Customer";
    public const string Admin = "Admin";
}
