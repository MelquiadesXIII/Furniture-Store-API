using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.FurnitoreStore.Shared;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.FurnitoreStore.Data
{
    public class APIFurnitureStoreContext : IdentityDbContext
    {
        public APIFurnitureStoreContext(DbContextOptions options) : base(options) { }

        public DbSet<Client> Clients { get; set; }

        public DbSet<Product> Products { get; set; }

        public DbSet<Order> Orders { get; set; }

        public DbSet<ProductCategory> ProductCategories { get; set; }

        public DbSet<OrderDetail> OrderDetails { get; set; }

        public DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseNpgsql();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<OrderDetail>()
                .HasKey(od => new { od.OrderId, od.ProductId});
        }
     }
}