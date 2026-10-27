namespace FlowerShop.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public string? PhoneNumber { get; set; }
    public int RoleId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Role? Role { get; set; }
}
