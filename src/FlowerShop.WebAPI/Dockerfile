FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["FlowerShop.WebAPI/FlowerShop.WebAPI.csproj", "FlowerShop.WebAPI/"]
COPY ["FlowerShop.Application/FlowerShop.Application.csproj", "FlowerShop.Application/"]
COPY ["FlowerShop.Infrastructure/FlowerShop.Infrastructure.csproj", "FlowerShop.Infrastructure/"]
COPY ["FlowerShop.Domain/FlowerShop.Domain.csproj", "FlowerShop.Domain/"]
RUN dotnet restore "FlowerShop.WebAPI/FlowerShop.WebAPI.csproj"
COPY . .
WORKDIR "/src/FlowerShop.WebAPI"
RUN dotnet build "FlowerShop.WebAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FlowerShop.WebAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FlowerShop.WebAPI.dll"]