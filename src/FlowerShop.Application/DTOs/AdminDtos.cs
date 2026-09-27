namespace FlowerShop.Application.DTOs;

public record CreateCategoryRequest(string Name);
public record UpdateCategoryRequest(string Name, bool IsActive);

public record CreateProductRequest(
    string Title,
    decimal Price,
    int StockQuantity,
    string? Description,
    int CategoryId,
    bool IsActive);

public record UpdateProductRequest(
    string Title,
    decimal Price,
    int StockQuantity,
    string? Description,
    int CategoryId,
    bool IsActive);

public record AdminProductDto(
    int Id,
    string Title,
    decimal Price,
    int StockQuantity,
    string? Description,
    string? ImageUrl,
    int CategoryId,
    string CategoryName,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt);
