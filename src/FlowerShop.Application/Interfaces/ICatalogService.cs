using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;

namespace FlowerShop.Application.Interfaces;

public interface ICatalogService
{
    Task<IReadOnlyList<CategoryDto>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductQuery query, CancellationToken cancellationToken = default);
    Task<ProductListItemDto?> GetProductByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductListItemDto>> GetProductsByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);
}
