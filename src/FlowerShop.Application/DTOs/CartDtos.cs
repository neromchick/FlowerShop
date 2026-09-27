namespace FlowerShop.Application.DTOs;

public record CartLineDto(int ProductId, int Quantity);
public record CartItemDto(
    int ProductId,
    string Title,
    decimal Price,
    int Quantity,
    int StockQuantity,
    string? ImageUrl);
public record MergeCartRequest(IReadOnlyList<CartLineDto> Items);
