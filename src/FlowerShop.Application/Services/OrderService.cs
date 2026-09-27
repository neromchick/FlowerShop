using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Domain.Entities;
using FlowerShop.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FlowerShop.Application.Services;

public class OrderService(IApplicationDbContext db) : IOrderService, IAdminOrderService
{
    public async Task<OrderDetailDto> CreateOrderAsync(CreateOrderRequest request, Guid? userId, CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0)
            throw new InvalidOperationException("Корзина пуста.");

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await db.Products
                .Where(p => productIds.Contains(p.Id) && p.IsActive)
                .ToDictionaryAsync(p => p.Id, cancellationToken);

            if (products.Count != productIds.Count)
                throw new InvalidOperationException("Некоторые товары недоступны.");

            var orderItems = new List<OrderItem>();
            decimal total = 0;

            foreach (var line in request.Items.GroupBy(i => i.ProductId).Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) }))
            {
                if (!products.TryGetValue(line.ProductId, out var product))
                    throw new InvalidOperationException($"Товар {line.ProductId} не найден.");

                if (line.Quantity <= 0)
                    throw new InvalidOperationException("Количество должно быть больше нуля.");

                if (product.StockQuantity < line.Quantity)
                    throw new InvalidOperationException($"Недостаточно товара «{product.Title}» на складе.");

                product.StockQuantity -= line.Quantity;
                product.UpdatedAt = DateTime.UtcNow;

                var unitPrice = product.Price;
                total += unitPrice * line.Quantity;
                orderItems.Add(new OrderItem
                {
                    ProductId = product.Id,
                    ProductTitleSnapshot = product.Title,
                    Quantity = line.Quantity,
                    UnitPrice = unitPrice
                });
            }

            var order = new Order
            {
                UserId = userId,
                CustomerName = request.CustomerName.Trim(),
                CustomerPhone = request.CustomerPhone.Trim(),
                CustomerEmail = string.IsNullOrWhiteSpace(request.CustomerEmail) ? null : request.CustomerEmail.Trim(),
                DeliveryAddress = request.DeliveryAddress.Trim(),
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.New,
                TotalAmount = total,
                Items = orderItems
            };

            db.Orders.Add(order);
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return MapDetail(order);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IReadOnlyList<OrderSummaryDto>> GetMyOrdersAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await db.Orders.AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.OrderDate,
                o.Status,
                o.TotalAmount,
                o.CustomerName,
                o.DeliveryAddress))
            .ToListAsync(cancellationToken);
    }

    public async Task<OrderDetailDto?> GetMyOrderByIdAsync(Guid userId, int orderId, CancellationToken cancellationToken = default)
    {
        var order = await db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId, cancellationToken);

        return order is null ? null : MapDetail(order);
    }

    public async Task<PagedResult<OrderSummaryDto>> GetOrdersAsync(AdminOrderQuery query, CancellationToken cancellationToken = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize is < 1 or > 100 ? 20 : query.PageSize;

        var orders = db.Orders.AsNoTracking().AsQueryable();

        if (query.Status.HasValue)
            orders = orders.Where(o => o.Status == query.Status.Value);
        if (query.From.HasValue)
            orders = orders.Where(o => o.OrderDate >= query.From.Value);
        if (query.To.HasValue)
            orders = orders.Where(o => o.OrderDate <= query.To.Value);

        orders = orders.OrderByDescending(o => o.OrderDate);

        var total = await orders.CountAsync(cancellationToken);
        var items = await orders.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.OrderDate,
                o.Status,
                o.TotalAmount,
                o.CustomerName,
                o.DeliveryAddress))
            .ToListAsync(cancellationToken);

        return new PagedResult<OrderSummaryDto> { Items = items, Page = page, PageSize = pageSize, TotalCount = total };
    }

    public async Task<OrderDetailDto?> GetOrderByIdAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var order = await db.Orders.AsNoTracking().Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        return order is null ? null : MapDetail(order);
    }

    public async Task<OrderDetailDto> UpdateStatusAsync(int orderId, UpdateOrderStatusRequest request, Guid adminUserId, CancellationToken cancellationToken = default)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Заказ не найден.");

        if (!OrderStatusRules.CanTransition(order.Status, request.NewStatus))
            throw new InvalidOperationException($"Нельзя сменить статус с {order.Status} на {request.NewStatus}.");

        var log = new OrderStatusLog
        {
            OrderId = order.Id,
            OldStatus = order.Status,
            NewStatus = request.NewStatus,
            ChangedByUserId = adminUserId,
            ChangedAt = DateTime.UtcNow
        };

        order.Status = request.NewStatus;
        db.OrderStatusLogs.Add(log);
        await db.SaveChangesAsync(cancellationToken);

        return MapDetail(order);
    }

    private static OrderDetailDto MapDetail(Order order) =>
        new(
            order.Id,
            order.OrderDate,
            order.Status,
            order.TotalAmount,
            order.CustomerName,
            order.CustomerPhone,
            order.CustomerEmail,
            order.DeliveryAddress,
            order.Items.Select(i => new OrderItemDto(
                i.ProductTitleSnapshot,
                i.Quantity,
                i.UnitPrice,
                i.UnitPrice * i.Quantity)).ToList());
}
