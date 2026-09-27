using FlowerShop.Application.Interfaces;
using Microsoft.Extensions.Hosting;

namespace FlowerShop.Infrastructure.Storage;

public class LocalFileStorageService(IHostEnvironment environment) : IFileStorageService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    public async Task<string> SaveProductImageAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var ext = Path.GetExtension(fileName);
        if (!AllowedExtensions.Contains(ext))
            throw new InvalidOperationException("Допустимы только jpg, png, webp.");

        var imagesDir = Path.Combine(environment.ContentRootPath, "wwwroot", "images", "products");
        Directory.CreateDirectory(imagesDir);

        var safeName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var fullPath = Path.Combine(imagesDir, safeName);

        await using var output = File.Create(fullPath);
        await fileStream.CopyToAsync(output, cancellationToken);

        return $"/images/products/{safeName}";
    }

    public Task DeleteIfExistsAsync(string? relativeUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl))
            return Task.CompletedTask;

        var path = relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(environment.ContentRootPath, "wwwroot", path);
        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }
}
