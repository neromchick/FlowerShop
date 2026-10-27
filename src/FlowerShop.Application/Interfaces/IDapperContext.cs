using System.Data;

namespace FlowerShop.Application.Interfaces;

public interface IDapperContext
{
    IDbConnection CreateConnection();
}
