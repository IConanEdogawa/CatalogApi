using CatalogApi.Data;
using CatalogApi.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// DB
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Default")));

// CORS (чтобы html с другого порта/домена мог fetch делать)
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("AllowAll");

// чтобы отдавать /uploads/....
app.UseStaticFiles();

// создать базу автоматически
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

static bool IsValidUrl(string s) => Uri.TryCreate(s, UriKind.Absolute, out _);
app.MapGet("/", () => Results.Redirect("/index.html"));

// GET all
app.MapGet("/api/products", async (AppDbContext db) =>
    await db.Products.OrderByDescending(x => x.Id).ToListAsync());

// POST create (multipart/form-data: image + linkUrl + text)
app.MapPost("/api/products", async (HttpRequest request, AppDbContext db) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest("Expected multipart/form-data.");

    var form = await request.ReadFormAsync();

    var file = form.Files.GetFile("image");
    var linkUrl = form["linkUrl"].ToString();
    var text = form["text"].ToString();

    if (file is null || file.Length == 0) return Results.BadRequest("Image file required.");
    if (string.IsNullOrWhiteSpace(linkUrl) || string.IsNullOrWhiteSpace(text))
        return Results.BadRequest("linkUrl and text are required.");
    if (!IsValidUrl(linkUrl)) return Results.BadRequest("Invalid linkUrl.");

    var ext = Path.GetExtension(file.FileName);
    var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };
    if (string.IsNullOrWhiteSpace(ext) || !allowed.Contains(ext))
        return Results.BadRequest("Only jpg/jpeg/png/webp allowed.");

    var webRoot = app.Environment.WebRootPath ?? "wwwroot";
    var uploadsDir = Path.Combine(webRoot, "uploads");
    Directory.CreateDirectory(uploadsDir);

    var fileName = $"{Guid.NewGuid():N}{ext}";
    var filePath = Path.Combine(uploadsDir, fileName);

    await using (var stream = File.Create(filePath))
        await file.CopyToAsync(stream);

    var product = new Product
    {
        ImageUrl = $"/uploads/{fileName}",
        LinkUrl = linkUrl.Trim(),
        Text = text.Trim(),
        CreatedAt = DateTime.UtcNow
    };

    db.Products.Add(product);
    await db.SaveChangesAsync();

    return Results.Created($"/api/products/{product.Id}", product);
});

// DELETE (на будущее)
app.MapDelete("/api/products/{id:int}", async (AppDbContext db, int id) =>
{
    var p = await db.Products.FindAsync(id);
    if (p is null) return Results.NotFound();
    db.Products.Remove(p);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

var port = Environment.GetEnvironmentVariable("PORT") ?? "5138";
app.Run($"http://0.0.0.0:{port}");