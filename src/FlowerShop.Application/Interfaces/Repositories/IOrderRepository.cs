using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;
using FlowerShop.Domain.Enums;

namespace FlowerShop.Application.Interfaces.Repositories;

public interface IOrderRepository
{
    Task<OrderDetailDto> CreateOrderTransactionalAsync(CreateOrderRequest request, Guid? userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OrderSummaryDto>> GetOrdersByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<OrderDetailDto?> GetOrderByIdAsync(int orderId, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<PagedResult<OrderSummaryDto>> GetAdminOrdersAsync(AdminOrderQuery query, CancellationToken cancellationToken = default);
    Task<bool> UpdateOrderStatusAsync(int orderId, OrderStatus newStatus, string? comment = null, Guid? changedByUserId = null, CancellationToken cancellationToken = default);
    Task<OrderStatus?> GetCurrentStatusAsync(int orderId, CancellationToken cancellationToken = default);
}
