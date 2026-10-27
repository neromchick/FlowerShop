using System.Security.Claims;
using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlowerShop.WebAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/cart")]
public class CartController(ICartService cartService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) =>
        Ok(await cartService.GetCartAsync(GetUserId(), cancellationToken));

    [HttpPost("merge")]
    public async Task<IActionResult> Merge(MergeCartRequest request, CancellationToken cancellationToken)
    {
        await cartService.MergeCartAsync(GetUserId(), request, cancellationToken);
        return Ok(await cartService.GetCartAsync(GetUserId(), cancellationToken));
    }

    [HttpPut("items/{productId:int}")]
    public async Task<IActionResult> UpdateItem(int productId, [FromBody] UpdateCartItemRequest request, CancellationToken cancellationToken)
    {
        await cartService.SetItemQuantityAsync(GetUserId(), productId, request.Quantity, cancellationToken);
        return Ok(await cartService.GetCartAsync(GetUserId(), cancellationToken));
    }

    [HttpDelete("items/{productId:int}")]
    public async Task<IActionResult> RemoveItem(int productId, CancellationToken cancellationToken)
    {
        await cartService.RemoveItemAsync(GetUserId(), productId, cancellationToken);
        return Ok(await cartService.GetCartAsync(GetUserId(), cancellationToken));
    }

    [HttpDelete]
    public async Task<IActionResult> Clear(CancellationToken cancellationToken)
    {
        await cartService.ClearCartAsync(GetUserId(), cancellationToken);
        return NoContent();
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
}
