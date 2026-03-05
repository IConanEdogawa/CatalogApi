using CatalogApi.Data;
using CatalogApi.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:5138");



// -------------------- Services --------------------

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});



var app = builder.Build();



// -------------------- Middleware --------------------

app.UseCors("AllowAll");

app.UseStaticFiles();



// -------------------- Database Init --------------------

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}



// -------------------- Helpers --------------------

static bool IsValidUrl(string s) =>
    Uri.TryCreate(s, UriKind.Absolute, out _);



// -------------------- Routes --------------------

// root goes straight to the first catalog (site a) instead of an index file
app.MapGet("/", () => Results.Redirect("/f9b3c1a2.html"));


// future storefronts – use the obfuscated filenames so they can't be guessed
app.MapGet("/a", () => Results.Redirect("/f9b3c1a2.html"));
app.MapGet("/b", () => Results.Redirect("/q7r8s2t4.html"));
app.MapGet("/c", () => Results.Redirect("/k1m4n6p8.html"));



// -------------------- API: Get Products --------------------

app.MapGet("/api/products", async (HttpRequest req, AppDbContext db) =>
{
    var site = req.Query["site"].ToString().Trim().ToLowerInvariant();

    var q = db.Products.AsQueryable();

    if (!string.IsNullOrWhiteSpace(site))
        q = q.Where(p => p.Site == site);

    return await q
        .OrderByDescending(x => x.Id)
        .ToListAsync();
});



// -------------------- API: Create Product --------------------

app.MapPost("/api/products", async (HttpRequest request, AppDbContext db) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest("Expected multipart/form-data.");

    var form = await request.ReadFormAsync();

    var file = form.Files.GetFile("image");
    var linkUrl = form["linkUrl"].ToString();
    var text = form["text"].ToString();

    // NEW
    var site = form["site"].ToString().Trim().ToLowerInvariant();
    if (string.IsNullOrWhiteSpace(site))
        site = "a";

    if (site is not ("a" or "b" or "c"))
        return Results.BadRequest("Invalid site.");

    if (file is null || file.Length == 0)
        return Results.BadRequest("Image file required.");

    if (string.IsNullOrWhiteSpace(linkUrl) ||
        string.IsNullOrWhiteSpace(text))
        return Results.BadRequest("linkUrl and text are required.");

    if (!IsValidUrl(linkUrl))
        return Results.BadRequest("Invalid linkUrl.");

    var ext = Path.GetExtension(file.FileName);

    var allowed = new HashSet<string>(
        StringComparer.OrdinalIgnoreCase)
    { ".jpg", ".jpeg", ".png", ".webp" };

    if (string.IsNullOrWhiteSpace(ext) ||
        !allowed.Contains(ext))
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
        Site = site,
        CreatedAt = DateTime.UtcNow
    };

    db.Products.Add(product);

    await db.SaveChangesAsync();

    return Results.Created($"/api/products/{product.Id}", product);
});



// -------------------- API: Delete Product --------------------

app.MapDelete("/api/products/{id:int}", async (AppDbContext db, int id) =>
{
    var p = await db.Products.FindAsync(id);

    if (p is null)
        return Results.NotFound();

    db.Products.Remove(p);

    await db.SaveChangesAsync();

    return Results.NoContent();
});



// -------------------- Server --------------------

var port =
    Environment.GetEnvironmentVariable("PORT") ?? "5138";

app.Run($"http://0.0.0.0:{port}");

