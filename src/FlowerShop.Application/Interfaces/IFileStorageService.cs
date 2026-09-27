namespace FlowerShop.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveProductImageAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);
    Task DeleteIfExistsAsync(string? relativeUrl, CancellationToken cancellationToken = default);
}
