namespace FlowerShop.Application.DTOs;

public record CategoryDto(int Id, string Name, bool IsActive);
public record ProductListItemDto(
    int Id,
    string Title,
    decimal Price,
    int StockQuantity,
    string? Description,
    string? ImageUrl,
    int CategoryId,
    string CategoryName,
    DateTime CreatedAt);
public record ProductQuery(
    int? CategoryId,
    string? Search,
    string Sort = "newest",
    int Page = 1,
    int PageSize = 20);
