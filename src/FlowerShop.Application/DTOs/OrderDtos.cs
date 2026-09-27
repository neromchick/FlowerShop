using FlowerShop.Domain.Enums;

namespace FlowerShop.Application.DTOs;

public record CreateOrderItemRequest(int ProductId, int Quantity);
public record CreateOrderRequest(
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string DeliveryAddress,
    IReadOnlyList<CreateOrderItemRequest> Items);

public record OrderItemDto(string ProductTitleSnapshot, int Quantity, decimal UnitPrice, decimal LineTotal);
public record OrderSummaryDto(
    int Id,
    DateTime OrderDate,
    OrderStatus Status,
    decimal TotalAmount,
    string CustomerName,
    string DeliveryAddress);
public record OrderDetailDto(
    int Id,
    DateTime OrderDate,
    OrderStatus Status,
    decimal TotalAmount,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string DeliveryAddress,
    IReadOnlyList<OrderItemDto> Items);

public record AdminOrderQuery(
    OrderStatus? Status,
    DateTime? From,
    DateTime? To,
    int Page = 1,
    int PageSize = 20);

public record UpdateOrderStatusRequest(OrderStatus NewStatus);
