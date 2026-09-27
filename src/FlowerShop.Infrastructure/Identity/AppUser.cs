using FlowerShop.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace FlowerShop.Infrastructure.Identity;

public class AppUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Role Role { get; set; } = null!;
}
