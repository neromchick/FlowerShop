using FlowerShop.Domain.Enums;

namespace FlowerShop.Application.Services;

public static class OrderStatusRules
{
    public static bool CanTransition(OrderStatus current, OrderStatus next)
    {
        if (current == next)
            return false;

        if (next == OrderStatus.Cancelled)
            return current is OrderStatus.New or OrderStatus.Processing;

        return current switch
        {
            OrderStatus.New => next == OrderStatus.Processing,
            OrderStatus.Processing => next == OrderStatus.Shipped,
            OrderStatus.Shipped => next == OrderStatus.Delivered,
            _ => false
        };
    }
}
