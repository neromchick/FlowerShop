using System.Security.Claims;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlowerShop.WebAPI.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(IOrderService orderService, ICartService cartService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateOrderRequest request, CancellationToken cancellationToken)
    {
        try
        {
            Guid? userId = User.Identity?.IsAuthenticated == true
                ? Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!)
                : null;

            var order = await orderService.CreateOrderAsync(request, userId, cancellationToken);

            if (userId.HasValue)
                await cartService.ClearCartAsync(userId.Value, cancellationToken);

            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("my")]
    public async Task<IActionResult> MyOrders(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
        return Ok(await orderService.GetMyOrdersAsync(userId, cancellationToken));
    }

    [Authorize]
    [HttpGet("my/{id:int}")]
    public async Task<IActionResult> MyOrder(int id, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
        var order = await orderService.GetMyOrderByIdAsync(userId, id, cancellationToken);
        return order is null ? NotFound() : Ok(order);
    }
}
