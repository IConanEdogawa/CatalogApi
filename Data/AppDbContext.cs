using Microsoft.EntityFrameworkCore;
using CatalogApi.Models;

namespace CatalogApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Product> Products => Set<Product>();
}