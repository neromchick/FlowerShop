using FlowerShop.Domain.Entities;
using FlowerShop.Infrastructure.Auth;
using FlowerShop.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FlowerShop.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        // Create tables if not exist (bypass migrations)
        await EnsureSchemaCreatedAsync(db);

        if (!await db.BusinessRoles.AnyAsync())
        {
            db.BusinessRoles.AddRange(
                new Role { Name = RoleNames.Customer },
                new Role { Name = RoleNames.Admin });
            await db.SaveChangesAsync();
        }

        foreach (var roleName in new[] { RoleNames.Customer, RoleNames.Admin })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
        }

        var adminRole = await db.BusinessRoles.FirstAsync(r => r.Name == RoleNames.Admin);
        if (!await userManager.Users.AnyAsync(u => u.Email == "admin@flowershop.local"))
        {
            var admin = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = "admin@flowershop.local",
                Email = "admin@flowershop.local",
                FullName = "Администратор",
                PhoneNumber = "+79990000000",
                RoleId = adminRole.Id,
                CreatedAt = DateTime.UtcNow,
                EmailConfirmed = true
            };
            await userManager.CreateAsync(admin, "Admin123!");
            await userManager.AddToRoleAsync(admin, RoleNames.Admin);
        }

        if (!await db.Categories.AnyAsync())
        {
            var categories = new[]
            {
                new Category { Name = "Букеты", IsActive = true },
                new Category { Name = "Комнатные растения", IsActive = true },
                new Category { Name = "Подарочные наборы", IsActive = true }
            };
            db.Categories.AddRange(categories);
            await db.SaveChangesAsync();

            var now = DateTime.UtcNow;
            db.Products.AddRange(
                new Product
                {
                    Title = "Букет «Весенний»",
                    Price = 2490,
                    StockQuantity = 15,
                    Description = "Тюльпаны и эустома в нежной упаковке.",
                    CategoryId = categories[0].Id,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Product
                {
                    Title = "Букет «Классика»",
                    Price = 3190,
                    StockQuantity = 10,
                    Description = "25 красных роз, лента, открытка.",
                    CategoryId = categories[0].Id,
                    IsActive = true,
                    CreatedAt = now.AddMinutes(-5),
                    UpdatedAt = now.AddMinutes(-5)
                },
                new Product
                {
                    Title = "Монстера Deliciosa",
                    Price = 1890,
                    StockQuantity = 8,
                    Description = "Комнатное растение в декоративном горшке.",
                    CategoryId = categories[1].Id,
                    IsActive = true,
                    CreatedAt = now.AddMinutes(-10),
                    UpdatedAt = now.AddMinutes(-10)
                },
                new Product
                {
                    Title = "Набор «Чай и цветы»",
                    Price = 2790,
                    StockQuantity = 12,
                    Description = "Мини-букет и набор элитного чая.",
                    CategoryId = categories[2].Id,
                    IsActive = true,
                    CreatedAt = now.AddMinutes(-15),
                    UpdatedAt = now.AddMinutes(-15)
                });
            await db.SaveChangesAsync();
            logger.LogInformation("База данных заполнена начальными данными.");
        }
    }

    private static async Task EnsureSchemaCreatedAsync(ApplicationDbContext db)
    {
        // Check if tables exist using ExecuteSqlRaw
        var connection = db.Database.GetDbConnection();
        await connection.OpenAsync();
        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Roles' LIMIT 1";
            var result = await command.ExecuteScalarAsync();
            if (result != null && result != DBNull.Value) return; // Schema already exists
        }
        finally
        {
            await connection.CloseAsync();
        }

        // Create schema using raw SQL
        var sql = @"
-- Business Roles
CREATE TABLE IF NOT EXISTS ""Roles"" (
    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
    ""Name"" character varying(50) NOT NULL,
    CONSTRAINT ""PK_Roles"" PRIMARY KEY (""Id""),
    CONSTRAINT ""AK_Roles_Name"" UNIQUE (""Name"")
);

-- Users (Identity + custom fields)
CREATE TABLE IF NOT EXISTS ""AspNetUsers"" (
    ""Id"" uuid NOT NULL,
    ""UserName"" character varying(256),
    ""NormalizedUserName"" character varying(256),
    ""Email"" character varying(256),
    ""NormalizedEmail"" character varying(256),
    ""EmailConfirmed"" boolean NOT NULL,
    ""PasswordHash"" text,
    ""SecurityStamp"" text,
    ""ConcurrencyStamp"" text,
    ""PhoneNumber"" text,
    ""PhoneNumberConfirmed"" boolean NOT NULL,
    ""TwoFactorEnabled"" boolean NOT NULL,
    ""LockoutEnd"" timestamp with time zone,
    ""LockoutEnabled"" boolean NOT NULL,
    ""AccessFailedCount"" integer NOT NULL,
    ""FullName"" character varying(200) NOT NULL,
    ""RoleId"" integer NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_AspNetUsers"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_AspNetUsers_Roles_RoleId"" FOREIGN KEY (""RoleId"") REFERENCES ""Roles"" (""Id"") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ""IX_AspNetUsers_RoleId"" ON ""AspNetUsers"" (""RoleId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""UserNameIndex"" ON ""AspNetUsers"" (""NormalizedUserName"");
CREATE INDEX IF NOT EXISTS ""EmailIndex"" ON ""AspNetUsers"" (""NormalizedEmail"");

-- Identity Roles
CREATE TABLE IF NOT EXISTS ""AspNetRoles"" (
    ""Id"" uuid NOT NULL,
    ""Name"" character varying(256),
    ""NormalizedName"" character varying(256),
    ""ConcurrencyStamp"" text,
    CONSTRAINT ""PK_AspNetRoles"" PRIMARY KEY (""Id"")
);

CREATE UNIQUE INDEX IF NOT EXISTS ""RoleNameIndex"" ON ""AspNetRoles"" (""NormalizedName"");

-- Identity UserRoles
CREATE TABLE IF NOT EXISTS ""AspNetUserRoles"" (
    ""UserId"" uuid NOT NULL,
    ""RoleId"" uuid NOT NULL,
    CONSTRAINT ""PK_AspNetUserRoles"" PRIMARY KEY (""UserId"", ""RoleId""),
    CONSTRAINT ""FK_AspNetUserRoles_AspNetRoles_RoleId"" FOREIGN KEY (""RoleId"") REFERENCES ""AspNetRoles"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_AspNetUserRoles_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ""IX_AspNetUserRoles_RoleId"" ON ""AspNetUserRoles"" (""RoleId"");

-- Identity UserClaims
CREATE TABLE IF NOT EXISTS ""AspNetUserClaims"" (
    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
    ""UserId"" uuid NOT NULL,
    ""ClaimType"" text,
    ""ClaimValue"" text,
    CONSTRAINT ""PK_AspNetUserClaims"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_AspNetUserClaims_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ""IX_AspNetUserClaims_UserId"" ON ""AspNetUserClaims"" (""UserId"");

-- Identity UserLogins
CREATE TABLE IF NOT EXISTS ""AspNetUserLogins"" (
    ""LoginProvider"" text NOT NULL,
    ""ProviderKey"" text NOT NULL,
    ""ProviderDisplayName"" text,
    ""UserId"" uuid NOT NULL,
    CONSTRAINT ""PK_AspNetUserLogins"" PRIMARY KEY (""LoginProvider"", ""ProviderKey""),
    CONSTRAINT ""FK_AspNetUserLogins_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ""IX_AspNetUserLogins_UserId"" ON ""AspNetUserLogins"" (""UserId"");

-- Identity UserTokens
CREATE TABLE IF NOT EXISTS ""AspNetUserTokens"" (
    ""UserId"" uuid NOT NULL,
    ""LoginProvider"" text NOT NULL,
    ""Name"" text NOT NULL,
    ""Value"" text,
    CONSTRAINT ""PK_AspNetUserTokens"" PRIMARY KEY (""UserId"", ""LoginProvider"", ""Name""),
    CONSTRAINT ""FK_AspNetUserTokens_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE
);

-- Identity RoleClaims
CREATE TABLE IF NOT EXISTS ""AspNetRoleClaims"" (
    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
    ""RoleId"" uuid NOT NULL,
    ""ClaimType"" text,
    ""ClaimValue"" text,
    CONSTRAINT ""PK_AspNetRoleClaims"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_AspNetRoleClaims_AspNetRoles_RoleId"" FOREIGN KEY (""RoleId"") REFERENCES ""AspNetRoles"" (""Id"") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ""IX_AspNetRoleClaims_RoleId"" ON ""AspNetRoleClaims"" (""RoleId"");

-- Categories
CREATE TABLE IF NOT EXISTS ""Categories"" (
    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
    ""Name"" character varying(100) NOT NULL,
    ""IsActive"" boolean NOT NULL DEFAULT true,
    CONSTRAINT ""PK_Categories"" PRIMARY KEY (""Id""),
    CONSTRAINT ""AK_Categories_Name"" UNIQUE (""Name"")
);

-- Products
CREATE TABLE IF NOT EXISTS ""Products"" (
    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
    ""Title"" character varying(200) NOT NULL,
    ""Price"" numeric(18,2) NOT NULL,
    ""StockQuantity"" integer NOT NULL,
    ""Description"" text,
    ""ImageUrl"" text,
    ""CategoryId"" integer NOT NULL,
    ""IsActive"" boolean NOT NULL DEFAULT true,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Products"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_Products_Categories_CategoryId"" FOREIGN KEY (""CategoryId"") REFERENCES ""Categories"" (""Id"") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ""IX_Products_CategoryId"" ON ""Products"" (""CategoryId"");

-- Orders
CREATE TABLE IF NOT EXISTS ""Orders"" (
    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
    ""UserId"" uuid,
    ""CustomerName"" character varying(200) NOT NULL,
    ""CustomerPhone"" character varying(30) NOT NULL,
    ""CustomerEmail"" character varying(256),
    ""DeliveryAddress"" character varying(500) NOT NULL,
    ""OrderDate"" timestamp with time zone NOT NULL,
    ""Status"" integer NOT NULL,
    ""TotalAmount"" numeric(18,2) NOT NULL,
    CONSTRAINT ""PK_Orders"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_Orders_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ""IX_Orders_UserId"" ON ""Orders"" (""UserId"");

-- OrderItems
CREATE TABLE IF NOT EXISTS ""OrderItems"" (
    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
    ""OrderId"" integer NOT NULL,
    ""ProductId"" integer NOT NULL,
    ""ProductTitleSnapshot"" character varying(200) NOT NULL,
    ""Quantity"" integer NOT NULL,
    ""UnitPrice"" numeric(18,2) NOT NULL,
    CONSTRAINT ""PK_OrderItems"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_OrderItems_Orders_OrderId"" FOREIGN KEY (""OrderId"") REFERENCES ""Orders"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_OrderItems_Products_ProductId"" FOREIGN KEY (""ProductId"") REFERENCES ""Products"" (""Id"") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ""IX_OrderItems_OrderId"" ON ""OrderItems"" (""OrderId"");
CREATE INDEX IF NOT EXISTS ""IX_OrderItems_ProductId"" ON ""OrderItems"" (""ProductId"");

-- CartItems
CREATE TABLE IF NOT EXISTS ""CartItems"" (
    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
    ""UserId"" uuid NOT NULL,
    ""ProductId"" integer NOT NULL,
    ""Quantity"" integer NOT NULL,
    CONSTRAINT ""PK_CartItems"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_CartItems_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_CartItems_Products_ProductId"" FOREIGN KEY (""ProductId"") REFERENCES ""Products"" (""Id"") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ""IX_CartItems_UserId_ProductId"" ON ""CartItems"" (""UserId"", ""ProductId"");

-- RefreshTokens
CREATE TABLE IF NOT EXISTS ""RefreshTokens"" (
    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
    ""UserId"" uuid NOT NULL,
    ""Token"" character varying(256) NOT NULL,
    ""ExpiresAt"" timestamp with time zone NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""IsRevoked"" boolean NOT NULL,
    CONSTRAINT ""PK_RefreshTokens"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_RefreshTokens_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ""IX_RefreshTokens_Token"" ON ""RefreshTokens"" (""Token"");
CREATE INDEX IF NOT EXISTS ""IX_RefreshTokens_UserId"" ON ""RefreshTokens"" (""UserId"");

-- OrderStatusLogs
CREATE TABLE IF NOT EXISTS ""OrderStatusLogs"" (
    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
    ""OrderId"" integer NOT NULL,
    ""OldStatus"" integer NOT NULL,
    ""NewStatus"" integer NOT NULL,
    ""ChangedByUserId"" uuid NOT NULL,
    ""ChangedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_OrderStatusLogs"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_OrderStatusLogs_Orders_OrderId"" FOREIGN KEY (""OrderId"") REFERENCES ""Orders"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_OrderStatusLogs_AspNetUsers_ChangedByUserId"" FOREIGN KEY (""ChangedByUserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ""IX_OrderStatusLogs_OrderId"" ON ""OrderStatusLogs"" (""OrderId"");
CREATE INDEX IF NOT EXISTS ""IX_OrderStatusLogs_ChangedByUserId"" ON ""OrderStatusLogs"" (""ChangedByUserId"");
";

        await db.Database.ExecuteSqlRawAsync(sql);
    }
}