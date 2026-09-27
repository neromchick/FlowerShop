using FlowerShop.Application.DTOs;
using FlowerShop.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FlowerShop.WebAPI.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController(ICatalogService catalogService) : ControllerBase
{
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken) =>
        Ok(await catalogService.GetActiveCategoriesAsync(cancellationToken));

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery] ProductQuery query, CancellationToken cancellationToken) =>
        Ok(await catalogService.GetProductsAsync(query, cancellationToken));
}
