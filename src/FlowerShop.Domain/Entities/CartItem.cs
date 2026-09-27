namespace FlowerShop.Domain.Entities;

public class CartItem
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }

    public Product Product { get; set; } = null!;
}
