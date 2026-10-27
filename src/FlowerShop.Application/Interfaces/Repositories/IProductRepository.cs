using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;

namespace FlowerShop.Application.Interfaces.Repositories;

public interface IProductRepository
{
    Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductQuery query, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductListItemDto>> GetProductsByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);
    Task<ProductListItemDto?> GetProductByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResult<AdminProductDto>> GetAdminProductsAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<AdminProductDto?> GetAdminProductByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<int> CreateProductAsync(CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<bool> UpdateProductAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task<bool> UpdateProductImageAsync(int id, string imageUrl, CancellationToken cancellationToken = default);
    Task<bool> DeactivateProductAsync(int id, CancellationToken cancellationToken = default);
}
