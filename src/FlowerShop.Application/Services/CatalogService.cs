using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;

namespace FlowerShop.Application.Services;

public class CatalogService(
    ICategoryRepository categoryRepository,
    IProductRepository productRepository) : ICatalogService
{
    public async Task<IReadOnlyList<CategoryDto>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await categoryRepository.GetActiveCategoriesAsync(cancellationToken);
    }

    public async Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductQuery query, CancellationToken cancellationToken = default)
    {
        return await productRepository.GetProductsAsync(query, cancellationToken);
    }

    public async Task<ProductListItemDto?> GetProductByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await productRepository.GetProductByIdAsync(id, cancellationToken);
    }

    public async Task<IReadOnlyList<ProductListItemDto>> GetProductsByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default)
    {
        return await productRepository.GetProductsByIdsAsync(ids, cancellationToken);
    }
}
