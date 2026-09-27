using FlowerShop.Application.Common;
using FlowerShop.Application.DTOs;

namespace FlowerShop.Application.Interfaces;

public interface IAdminProductService
{
    Task<PagedResult<AdminProductDto>> GetProductsAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<AdminProductDto> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<AdminProductDto> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task<AdminProductDto> SetImageAsync(int id, Stream imageStream, string fileName, CancellationToken cancellationToken = default);
    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
