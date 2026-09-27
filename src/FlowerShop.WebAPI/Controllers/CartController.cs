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

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
}
