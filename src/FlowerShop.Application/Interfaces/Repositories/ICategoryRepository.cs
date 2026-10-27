using FlowerShop.Application.DTOs;

namespace FlowerShop.Application.Interfaces.Repositories;

public interface ICategoryRepository
{
    Task<IReadOnlyList<CategoryDto>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CategoryDto>> GetAllCategoriesAsync(CancellationToken cancellationToken = default);
    Task<CategoryDto?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsByNameAsync(string name, int? excludeId = null, CancellationToken cancellationToken = default);
    Task<CategoryDto> CreateCategoryAsync(string name, CancellationToken cancellationToken = default);
    Task<CategoryDto?> UpdateCategoryAsync(int id, string name, bool isActive, CancellationToken cancellationToken = default);
    Task<bool> DeleteCategoryAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> HasProductsAsync(int id, CancellationToken cancellationToken = default);
}
