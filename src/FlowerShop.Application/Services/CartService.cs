using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowerShop.Application.Services;

public class CartService(IApplicationDbContext db) : ICartService
{
    public async Task<IReadOnlyList<CartItemDto>> GetCartAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await db.CartItems
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .Select(c => new CartItemDto(
                c.ProductId,
                c.Product.Title,
                c.Product.Price,
                c.Quantity,
                c.Product.StockQuantity,
                c.Product.ImageUrl))
            .ToListAsync(cancellationToken);
    }

    public async Task MergeCartAsync(Guid userId, MergeCartRequest request, CancellationToken cancellationToken = default)
    {
        var incoming = request.Items
            .GroupBy(i => i.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity));

        if (incoming.Count == 0)
            return;

        var existing = await db.CartItems
            .Where(c => c.UserId == userId)
            .ToListAsync(cancellationToken);

        foreach (var line in incoming)
        {
            var item = existing.FirstOrDefault(e => e.ProductId == line.Key);
            if (item is null)
            {
                db.CartItems.Add(new CartItem
                {
                    UserId = userId,
                    ProductId = line.Key,
                    Quantity = line.Value
                });
            }
            else
            {
                item.Quantity += line.Value;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task ClearCartAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var items = await db.CartItems.Where(c => c.UserId == userId).ToListAsync(cancellationToken);
        if (items.Count == 0)
            return;

        db.CartItems.RemoveRange(items);
        await db.SaveChangesAsync(cancellationToken);
    }
}
