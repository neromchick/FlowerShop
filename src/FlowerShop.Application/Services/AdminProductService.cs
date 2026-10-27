using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;

namespace FlowerShop.Application.Services;

public class AdminProductService(
    IProductRepository productRepository,
    ICategoryRepository categoryRepository,
    IFileStorageService fileStorage) : IAdminProductService
{
    public async Task<PagedResult<AdminProductDto>> GetProductsAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        return await productRepository.GetAdminProductsAsync(page, pageSize, cancellationToken);
    }

    public async Task<AdminProductDto> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        var id = await productRepository.CreateProductAsync(request, cancellationToken);
        var product = await productRepository.GetAdminProductByIdAsync(id, cancellationToken);
        return product ?? throw new InvalidOperationException("Не удалось создать товар.");
    }

    public async Task<AdminProductDto> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        var updated = await productRepository.UpdateProductAsync(id, request, cancellationToken);
        if (!updated)
            throw new KeyNotFoundException("Товар не найден.");

        var product = await productRepository.GetAdminProductByIdAsync(id, cancellationToken);
        return product ?? throw new KeyNotFoundException("Товар не найден.");
    }

    public async Task<AdminProductDto> SetImageAsync(int id, Stream imageStream, string fileName, CancellationToken cancellationToken = default)
    {
        var existing = await productRepository.GetAdminProductByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Товар не найден.");

        var relativeUrl = await fileStorage.SaveProductImageAsync(imageStream, fileName, cancellationToken);

        await productRepository.UpdateProductImageAsync(id, relativeUrl, cancellationToken);

        var product = await productRepository.GetAdminProductByIdAsync(id, cancellationToken);
        return product ?? throw new KeyNotFoundException("Товар не найден.");
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var affected = await productRepository.DeactivateProductAsync(id, cancellationToken);
        if (!affected)
            throw new KeyNotFoundException("Товар не найден.");
    }

    private async Task EnsureCategoryExistsAsync(int categoryId, CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetCategoryByIdAsync(categoryId, cancellationToken);
        if (category is null)
            throw new InvalidOperationException("Указанная категория не существует.");
    }
}
