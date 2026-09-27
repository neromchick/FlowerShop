using FlowerShop.Domain.Enums;

namespace FlowerShop.Domain.Entities;

public class OrderStatusLog
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public OrderStatus OldStatus { get; set; }
    public OrderStatus NewStatus { get; set; }
    public Guid ChangedByUserId { get; set; }
    public DateTime ChangedAt { get; set; }

    public Order Order { get; set; } = null!;
}
