using System.Data;
using Dapper;
using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;
using FlowerShop.Domain.Entities;
using FlowerShop.Domain.Enums;

namespace FlowerShop.Infrastructure.Persistence.Repositories;

public class OrderRepository(IDapperContext dapper) : IOrderRepository
{
    public async Task<OrderDetailDto> CreateOrderTransactionalAsync(CreateOrderRequest request, Guid? userId, CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0)
            throw new InvalidOperationException("Корзина пуста.");

        using var connection = dapper.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction(IsolationLevel.ReadCommitted);

        try
        {
            var productIds = request.Items.Select(i => i.ProductId).Distinct().ToArray();

            // Блокировка строк товаров для предотвращения race condition при списании остатков
            const string selectProductsSql = @"
                SELECT ""Id"", ""Title"", ""Price"", ""StockQuantity""
                FROM ""Products""
                WHERE ""Id"" = ANY(@ProductIds) AND ""IsActive"" = true
                FOR UPDATE;";

            var products = (await connection.QueryAsync<Product>(selectProductsSql, new { ProductIds = productIds }, transaction))
                .ToDictionary(p => p.Id);

            if (products.Count != productIds.Length)
                throw new InvalidOperationException("Некоторые товары недоступны.");

            var orderItems = new List<OrderItem>();
            decimal total = 0;
            var now = DateTime.UtcNow;

            var aggregatedLines = request.Items
                .GroupBy(i => i.ProductId)
                .Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) })
                .ToList();

            foreach (var line in aggregatedLines)
            {
                if (!products.TryGetValue(line.ProductId, out var product))
                    throw new InvalidOperationException($"Товар {line.ProductId} не найден.");

                if (line.Quantity <= 0)
                    throw new InvalidOperationException("Количество должно быть больше нуля.");

                if (product.StockQuantity < line.Quantity)
                    throw new InvalidOperationException($"Недостаточно товара «{product.Title}» на складе. Доступно: {product.StockQuantity}.");

                const string updateStockSql = @"
                    UPDATE ""Products""
                    SET ""StockQuantity"" = ""StockQuantity"" - @Quantity,
                        ""UpdatedAt"" = @UpdatedAt
                    WHERE ""Id"" = @Id;";

                await connection.ExecuteAsync(updateStockSql, new
                {
                    Quantity = line.Quantity,
                    UpdatedAt = now,
                    Id = product.Id
                }, transaction);

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

            const string insertOrderSql = @"
                INSERT INTO ""Orders"" (
                    ""UserId"", ""CustomerName"", ""CustomerPhone"", ""CustomerEmail"", ""DeliveryAddress"",
                    ""OrderDate"", ""Status"", ""TotalAmount"",
                    ""RecipientName"", ""RecipientPhone"", ""DeliveryDate"", ""GreetingCardText"", ""PaymentMethod""
                )
                VALUES (
                    @UserId, @CustomerName, @CustomerPhone, @CustomerEmail, @DeliveryAddress,
                    @OrderDate, @Status, @TotalAmount,
                    @RecipientName, @RecipientPhone, @DeliveryDate, @GreetingCardText, @PaymentMethod
                )
                RETURNING ""Id"";";

            var orderId = await connection.ExecuteScalarAsync<int>(insertOrderSql, new
            {
                UserId = userId,
                CustomerName = request.CustomerName.Trim(),
                CustomerPhone = request.CustomerPhone.Trim(),
                CustomerEmail = string.IsNullOrWhiteSpace(request.CustomerEmail) ? null : request.CustomerEmail.Trim().ToLowerInvariant(),
                DeliveryAddress = request.DeliveryAddress.Trim(),
                OrderDate = now,
                Status = (int)OrderStatus.New,
                TotalAmount = total,
                RecipientName = string.IsNullOrWhiteSpace(request.RecipientName) ? null : request.RecipientName.Trim(),
                RecipientPhone = string.IsNullOrWhiteSpace(request.RecipientPhone) ? null : request.RecipientPhone.Trim(),
                DeliveryDate = request.DeliveryDate,
                GreetingCardText = string.IsNullOrWhiteSpace(request.GreetingCardText) ? null : request.GreetingCardText.Trim(),
                PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? null : request.PaymentMethod.Trim()
            }, transaction);

            const string insertItemSql = @"
                INSERT INTO ""OrderItems"" (""OrderId"", ""ProductId"", ""ProductTitleSnapshot"", ""Quantity"", ""UnitPrice"")
                VALUES (@OrderId, @ProductId, @ProductTitleSnapshot, @Quantity, @UnitPrice);";

            var itemsBatch = orderItems.Select(i => new
            {
                OrderId = orderId,
                i.ProductId,
                i.ProductTitleSnapshot,
                i.Quantity,
                i.UnitPrice
            });

            await connection.ExecuteAsync(insertItemSql, itemsBatch, transaction);

            const string insertLogSql = @"
                INSERT INTO ""OrderStatusLogs"" (""OrderId"", ""OldStatus"", ""NewStatus"", ""ChangedByUserId"", ""ChangedAt"", ""Comment"")
                VALUES (@OrderId, @OldStatus, @NewStatus, @ChangedByUserId, @ChangedAt, @Comment);";

            await connection.ExecuteAsync(insertLogSql, new
            {
                OrderId = orderId,
                OldStatus = (int)OrderStatus.New,
                NewStatus = (int)OrderStatus.New,
                ChangedByUserId = userId,
                ChangedAt = now,
                Comment = "Заказ создан"
            }, transaction);

            if (userId.HasValue)
            {
                const string clearCartSql = @"DELETE FROM ""CartItems"" WHERE ""UserId"" = @UserId;";
                await connection.ExecuteAsync(clearCartSql, new { UserId = userId.Value }, transaction);
            }

            transaction.Commit();

            return new OrderDetailDto(
                orderId,
                now,
                OrderStatus.New,
                total,
                request.CustomerName.Trim(),
                request.CustomerPhone.Trim(),
                string.IsNullOrWhiteSpace(request.CustomerEmail) ? null : request.CustomerEmail.Trim().ToLowerInvariant(),
                request.DeliveryAddress.Trim(),
                orderItems.Select(i => new OrderItemDto(i.ProductTitleSnapshot, i.Quantity, i.UnitPrice, i.Quantity * i.UnitPrice)).ToList(),
                request.RecipientName,
                request.RecipientPhone,
                request.DeliveryDate,
                request.GreetingCardText,
                request.PaymentMethod);
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<IReadOnlyList<OrderSummaryDto>> GetOrdersByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string sql = @"
            SELECT ""Id"", ""OrderDate"", ""Status"", ""TotalAmount"", ""CustomerName"", ""DeliveryAddress""
            FROM ""Orders""
            WHERE ""UserId"" = @UserId
            ORDER BY ""OrderDate"" DESC;";

        var orders = await connection.QueryAsync<OrderSummaryDto>(sql, new { UserId = userId });
        return orders.ToList();
    }

    public async Task<OrderDetailDto?> GetOrderByIdAsync(int orderId, Guid? userId = null, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        var sql = userId.HasValue
            ? @"SELECT ""Id"", ""OrderDate"", ""Status"", ""TotalAmount"", ""CustomerName"", ""CustomerPhone"", 
                       ""CustomerEmail"", ""DeliveryAddress"", ""RecipientName"", ""RecipientPhone"", 
                       ""DeliveryDate"", ""GreetingCardText"", ""PaymentMethod""
                FROM ""Orders""
                WHERE ""Id"" = @OrderId AND ""UserId"" = @UserId;"
            : @"SELECT ""Id"", ""OrderDate"", ""Status"", ""TotalAmount"", ""CustomerName"", ""CustomerPhone"", 
                       ""CustomerEmail"", ""DeliveryAddress"", ""RecipientName"", ""RecipientPhone"", 
                       ""DeliveryDate"", ""GreetingCardText"", ""PaymentMethod""
                FROM ""Orders""
                WHERE ""Id"" = @OrderId;";

        var order = await connection.QueryFirstOrDefaultAsync<Order>(sql, new { OrderId = orderId, UserId = userId });
        if (order is null) return null;

        const string itemsSql = @"
            SELECT ""ProductTitleSnapshot"", ""Quantity"", ""UnitPrice"", (""Quantity"" * ""UnitPrice"") AS ""LineTotal""
            FROM ""OrderItems""
            WHERE ""OrderId"" = @OrderId;";

        var items = (await connection.QueryAsync<OrderItemDto>(itemsSql, new { OrderId = orderId })).ToList();

        return new OrderDetailDto(
            order.Id,
            order.OrderDate,
            order.Status,
            order.TotalAmount,
            order.CustomerName,
            order.CustomerPhone,
            order.CustomerEmail,
            order.DeliveryAddress,
            items,
            order.RecipientName,
            order.RecipientPhone,
            order.DeliveryDate,
            order.GreetingCardText,
            order.PaymentMethod);
    }

    public async Task<PagedResult<OrderSummaryDto>> GetAdminOrdersAsync(AdminOrderQuery query, CancellationToken cancellationToken = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize is < 1 or > 100 ? 20 : query.PageSize;
        var offset = (page - 1) * pageSize;

        using var connection = dapper.CreateConnection();

        var where = new List<string>();
        var parameters = new DynamicParameters();

        if (query.Status.HasValue)
        {
            where.Add(@"""Status"" = @Status");
            parameters.Add("Status", (int)query.Status.Value);
        }

        if (query.From.HasValue)
        {
            where.Add(@"""OrderDate"" >= @From");
            parameters.Add("From", query.From.Value);
        }

        if (query.To.HasValue)
        {
            where.Add(@"""OrderDate"" <= @To");
            parameters.Add("To", query.To.Value);
        }

        var whereSql = where.Count > 0 ? "WHERE " + string.Join(" AND ", where) : "";

        var countSql = $@"SELECT COUNT(*) FROM ""Orders"" {whereSql};";
        var total = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        parameters.Add("Limit", pageSize);
        parameters.Add("Offset", offset);

        var sql = $@"
            SELECT ""Id"", ""OrderDate"", ""Status"", ""TotalAmount"", ""CustomerName"", ""DeliveryAddress""
            FROM ""Orders""
            {whereSql}
            ORDER BY ""OrderDate"" DESC
            LIMIT @Limit OFFSET @Offset;";

        var items = (await connection.QueryAsync<OrderSummaryDto>(sql, parameters)).ToList();

        return new PagedResult<OrderSummaryDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<OrderStatus?> GetCurrentStatusAsync(int orderId, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        const string selectSql = @"SELECT ""Status"" FROM ""Orders"" WHERE ""Id"" = @OrderId;";
        var status = await connection.ExecuteScalarAsync<int?>(selectSql, new { OrderId = orderId });
        return status.HasValue ? (OrderStatus)status.Value : null;
    }

    public async Task<bool> UpdateOrderStatusAsync(int orderId, OrderStatus newStatus, string? comment = null, Guid? changedByUserId = null, CancellationToken cancellationToken = default)
    {
        using var connection = dapper.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            const string selectSql = @"SELECT ""Status"" FROM ""Orders"" WHERE ""Id"" = @OrderId FOR UPDATE;";
            var currentStatus = await connection.ExecuteScalarAsync<int?>(selectSql, new { OrderId = orderId }, transaction);
            if (!currentStatus.HasValue) return false;

            const string logSql = @"
                INSERT INTO ""OrderStatusLogs"" (""OrderId"", ""OldStatus"", ""NewStatus"", ""ChangedByUserId"", ""ChangedAt"", ""Comment"")
                VALUES (@OrderId, @OldStatus, @NewStatus, @ChangedByUserId, @ChangedAt, @Comment);";

            await connection.ExecuteAsync(logSql, new
            {
                OrderId = orderId,
                OldStatus = currentStatus.Value,
                NewStatus = (int)newStatus,
                ChangedByUserId = changedByUserId,
                ChangedAt = DateTime.UtcNow,
                Comment = comment
            }, transaction);

            const string updateOrderSql = @"UPDATE ""Orders"" SET ""Status"" = @NewStatus WHERE ""Id"" = @OrderId;";
            await connection.ExecuteAsync(updateOrderSql, new
            {
                OrderId = orderId,
                NewStatus = (int)newStatus
            }, transaction);

            transaction.Commit();
            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}
