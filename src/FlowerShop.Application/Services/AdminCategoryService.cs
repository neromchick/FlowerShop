using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowerShop.Application.Services;

public class AdminCategoryService(IApplicationDbContext db) : IAdminCategoryService
{
    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await db.Categories.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        if (await db.Categories.AnyAsync(c => c.Name == name, cancellationToken))
            throw new InvalidOperationException("Категория с таким названием уже существует.");

        var category = new Category { Name = name, IsActive = true };
        db.Categories.Add(category);
        await db.SaveChangesAsync(cancellationToken);
        return new CategoryDto(category.Id, category.Name, category.IsActive);
    }

    public async Task<CategoryDto> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Категория не найдена.");

        var name = request.Name.Trim();
        if (await db.Categories.AnyAsync(c => c.Id != id && c.Name == name, cancellationToken))
            throw new InvalidOperationException("Категория с таким названием уже существует.");

        category.Name = name;
        category.IsActive = request.IsActive;
        await db.SaveChangesAsync(cancellationToken);
        return new CategoryDto(category.Id, category.Name, category.IsActive);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Категория не найдена.");

        if (await db.Products.AnyAsync(p => p.CategoryId == id, cancellationToken))
            throw new InvalidOperationException("Нельзя удалить категорию, в которой есть товары.");

        db.Categories.Remove(category);
        await db.SaveChangesAsync(cancellationToken);
    }
}
