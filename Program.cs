using CatalogApi.Data;
using CatalogApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);



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



// -------------------- Admin Security --------------------

const string ADMIN_FILE = "/5755nimda.html";

var adminPassword =
    Environment.GetEnvironmentVariable("9903Bekzod!") ?? "change-me";

bool IsAuthed(HttpRequest req)
{
    if (!req.Headers.TryGetValue("Authorization", out var auth))
        return false;

    var s = auth.ToString();

    if (!s.StartsWith("Basic "))
        return false;

    try
    {
        var raw = Convert.FromBase64String(s["Basic ".Length..]);
        var creds = Encoding.UTF8.GetString(raw);

        var parts = creds.Split(':', 2);

        if (parts.Length != 2)
            return false;

        return parts[0] == "admin" && parts[1] == adminPassword;
    }
    catch
    {
        return false;
    }
}

app.Use(async (ctx, next) =>
{
    var path = ctx.Request.Path.Value ?? "";

    var isAdminPage =
        path.Equals(ADMIN_FILE, StringComparison.OrdinalIgnoreCase);

    var isWriteApi =
        path.StartsWith("/api/products", StringComparison.OrdinalIgnoreCase)
        && (ctx.Request.Method == "POST" || ctx.Request.Method == "DELETE");

    if (isAdminPage || isWriteApi)
    {
        if (!IsAuthed(ctx.Request))
        {
            ctx.Response.Headers["WWW-Authenticate"] = "Basic realm=\"Admin\"";
            ctx.Response.StatusCode = 401;
            await ctx.Response.WriteAsync("Unauthorized");
            return;
        }
    }

    await next();
});



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

app.MapGet("/", () => Results.Redirect("/index.html"));



// -------------------- API: Get Products --------------------

app.MapGet("/api/products", async (AppDbContext db) =>
    await db.Products
        .OrderByDescending(x => x.Id)
        .ToListAsync());



// -------------------- API: Create Product --------------------

app.MapPost("/api/products", async (HttpRequest request, AppDbContext db) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest("Expected multipart/form-data.");

    var form = await request.ReadFormAsync();

    var file = form.Files.GetFile("image");
    var linkUrl = form["linkUrl"].ToString();
    var text = form["text"].ToString();

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