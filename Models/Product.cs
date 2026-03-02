namespace CatalogApi.Models;

public class Product
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = ""; // будет /uploads/xxx.jpg
    public string LinkUrl { get; set; } = "";
    public string Text { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string Site { get; set; } = "a"; // default
}