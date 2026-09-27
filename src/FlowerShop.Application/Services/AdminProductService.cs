using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowerShop.Application.Services;

public class AdminProductService(IApplicationDbContext db, IFileStorageService fileStorage) : IAdminProductService
{
    public async Task<PagedResult<AdminProductDto>> GetProductsAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var query = db.Products.AsNoTracking().OrderByDescending(p => p.CreatedAt);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new AdminProductDto(
                p.Id,
                p.Title,
                p.Price,
                p.StockQuantity,
                p.Description,
                p.ImageUrl,
                p.CategoryId,
                p.Category.Name,
                p.IsActive,
                p.CreatedAt,
                p.UpdatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminProductDto> { Items = items, Page = page, PageSize = pageSize, TotalCount = total };
    }

    public async Task<AdminProductDto> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureCategoryExists(request.CategoryId, cancellationToken);
        var now = DateTime.UtcNow;
        var product = new Product
        {
            Title = request.Title.Trim(),
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            Description = request.Description,
            CategoryId = request.CategoryId,
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now 
        };
        db.Products.Add(product);
        await db.SaveChangesAsync(cancellationToken);
        return await GetAdminDto(product.Id, cancellationToken);
    }

    public async Task<AdminProductDto> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Товар не найден.");

        await EnsureCategoryExists(request.CategoryId, cancellationToken);

        product.Title = request.Title.Trim();
        product.Price = request.Price;
        product.StockQuantity = request.StockQuantity;
        product.Description = request.Description;
        product.CategoryId = request.CategoryId;
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return await GetAdminDto(product.Id, cancellationToken);
    }

    public async Task<AdminProductDto> SetImageAsync(int id, Stream imageStream, string fileName, CancellationToken cancellationToken = default)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Товар не найден.");

        await fileStorage.DeleteIfExistsAsync(product.ImageUrl, cancellationToken);
        product.ImageUrl = await fileStorage.SaveProductImageAsync(imageStream, fileName, cancellationToken);
        product.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return await GetAdminDto(product.Id, cancellationToken);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Товар не найден.");

        if (await db.OrderItems.AnyAsync(i => i.ProductId == id, cancellationToken))
        {
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            await fileStorage.DeleteIfExistsAsync(product.ImageUrl, cancellationToken);
            db.Products.Remove(product);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureCategoryExists(int categoryId, CancellationToken cancellationToken)
    {
        if (!await db.Categories.AnyAsync(c => c.Id == categoryId, cancellationToken))
            throw new InvalidOperationException("Категория не найдена.");
    }

    private async Task<AdminProductDto> GetAdminDto(int id, CancellationToken cancellationToken)
    {
        return await db.Products.AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new AdminProductDto(
                p.Id,
                p.Title,
                p.Price,
                p.StockQuantity,
                p.Description,
                p.ImageUrl,
                p.CategoryId,
                p.Category.Name,
                p.IsActive,
                p.CreatedAt,
                p.UpdatedAt))
            .FirstAsync(cancellationToken);
    }
}
