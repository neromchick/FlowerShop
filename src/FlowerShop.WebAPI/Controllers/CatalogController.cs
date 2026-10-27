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

    [HttpGet("products/{id:int}")]
    public async Task<IActionResult> GetProductById(int id, CancellationToken cancellationToken)
    {
        var product = await catalogService.GetProductByIdAsync(id, cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet("products/batch")]
    public async Task<IActionResult> GetProductsBatch([FromQuery] int[] ids, CancellationToken cancellationToken) =>
        Ok(await catalogService.GetProductsByIdsAsync(ids, cancellationToken));
}
