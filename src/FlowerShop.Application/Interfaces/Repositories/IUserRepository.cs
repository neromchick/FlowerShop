using FlowerShop.Application.DTOs;
using FlowerShop.Domain.Entities;

namespace FlowerShop.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<UserWithRoleRow?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<UserWithRoleRow?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task CreateUserAsync(User user, CancellationToken cancellationToken = default);
    Task UpdateProfileAsync(Guid id, string fullName, string? phoneNumber, CancellationToken cancellationToken = default);
}
