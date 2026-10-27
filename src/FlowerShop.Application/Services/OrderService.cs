using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using FlowerShop.Application.Interfaces.Repositories;
using FlowerShop.Domain.Enums;

namespace FlowerShop.Application.Services;

public class OrderService(IOrderRepository orderRepository) : IOrderService, IAdminOrderService
{
    public async Task<OrderDetailDto> CreateOrderAsync(CreateOrderRequest request, Guid? userId, CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0)
            throw new InvalidOperationException("Корзина пуста.");

        return await orderRepository.CreateOrderTransactionalAsync(request, userId, cancellationToken);
    }

    public async Task<IReadOnlyList<OrderSummaryDto>> GetMyOrdersAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await orderRepository.GetOrdersByUserIdAsync(userId, cancellationToken);
    }

    public async Task<OrderDetailDto?> GetMyOrderByIdAsync(Guid userId, int orderId, CancellationToken cancellationToken = default)
    {
        return await orderRepository.GetOrderByIdAsync(orderId, userId, cancellationToken);
    }

    public async Task<PagedResult<OrderSummaryDto>> GetOrdersAsync(AdminOrderQuery query, CancellationToken cancellationToken = default)
    {
        return await orderRepository.GetAdminOrdersAsync(query, cancellationToken);
    }

    public async Task<OrderDetailDto?> GetOrderByIdAsync(int orderId, CancellationToken cancellationToken = default)
    {
        return await orderRepository.GetOrderByIdAsync(orderId, null, cancellationToken);
    }

    public async Task<OrderDetailDto> UpdateStatusAsync(int orderId, UpdateOrderStatusRequest request, Guid adminUserId, CancellationToken cancellationToken = default)
    {
        var currentStatus = await orderRepository.GetCurrentStatusAsync(orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Заказ не найден.");

        if (!OrderStatusRules.CanTransition(currentStatus, request.NewStatus))
            throw new InvalidOperationException($"Нельзя сменить статус с {currentStatus} на {request.NewStatus}.");

        var success = await orderRepository.UpdateOrderStatusAsync(orderId, request.NewStatus, null, adminUserId, cancellationToken);
        if (!success)
            throw new KeyNotFoundException("Заказ не найден.");

        return (await orderRepository.GetOrderByIdAsync(orderId, null, cancellationToken))!;
    }
}
