using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;

namespace FlowerShop.Application.Services;

public class AdminCategoryService(ICategoryRepository categoryRepository) : IAdminCategoryService
{
    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await categoryRepository.GetAllCategoriesAsync(cancellationToken);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();

        if (await categoryRepository.ExistsByNameAsync(name, null, cancellationToken))
            throw new InvalidOperationException("Категория с таким названием уже существует.");

        return await categoryRepository.CreateCategoryAsync(name, cancellationToken);
    }

    public async Task<CategoryDto> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();

        var existing = await categoryRepository.GetCategoryByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Категория не найдена.");

        if (await categoryRepository.ExistsByNameAsync(name, id, cancellationToken))
            throw new InvalidOperationException("Категория с таким названием уже существует.");

        var updated = await categoryRepository.UpdateCategoryAsync(id, name, request.IsActive, cancellationToken);
        return updated ?? throw new KeyNotFoundException("Категория не найдена.");
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var existing = await categoryRepository.GetCategoryByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Категория не найдена.");

        if (await categoryRepository.HasProductsAsync(id, cancellationToken))
            throw new InvalidOperationException("Нельзя удалить категорию, в которой есть товары.");

        var deleted = await categoryRepository.DeleteCategoryAsync(id, cancellationToken);
        if (!deleted)
            throw new KeyNotFoundException("Категория не найдена.");
    }
}
