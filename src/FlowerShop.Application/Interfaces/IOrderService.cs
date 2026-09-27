using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;

namespace FlowerShop.Application.Interfaces;

public interface IOrderService
{
    Task<OrderDetailDto> CreateOrderAsync(CreateOrderRequest request, Guid? userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OrderSummaryDto>> GetMyOrdersAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<OrderDetailDto?> GetMyOrderByIdAsync(Guid userId, int orderId, CancellationToken cancellationToken = default);
}

public interface IAdminOrderService
{
    Task<PagedResult<OrderSummaryDto>> GetOrdersAsync(AdminOrderQuery query, CancellationToken cancellationToken = default);
    Task<OrderDetailDto?> GetOrderByIdAsync(int orderId, CancellationToken cancellationToken = default);
    Task<OrderDetailDto> UpdateStatusAsync(int orderId, UpdateOrderStatusRequest request, Guid adminUserId, CancellationToken cancellationToken = default);
}
