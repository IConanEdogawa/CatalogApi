using CatalogApi.Data;
using CatalogApi.Models;
using Microsoft.EntityFrameworkCore;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// -------------------- Services --------------------

// DB
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Default")));

// CORS
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// -------------------- Admin Auth Config --------------------
// Server-only file (NOT in repo). Set via env on VPS.
var adminFilePath =
    Environment.GetEnvironmentVariable("ADMIN_FILE_PATH")
    ?? "/var/lib/catalogapi/admins.json";

// JWT secret (server-only). Set via env on VPS.
var jwtSecret =
    Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? throw new Exception("JWT_SECRET is not set (set it in systemd env).");

const string AdminCookieName = "admin_token";
const string AdminPagePath = "/z3x9v7w1.html";
const string LoginPagePath = "/login.html";

var jwtKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        // Read token from HttpOnly cookie
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                if (ctx.Request.Cookies.TryGetValue(AdminCookieName, out var token))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };

        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = jwtKey,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// -------------------- Middleware --------------------

app.UseCors("AllowAll");

app.Use(async (ctx, next) =>
{
    var path = ctx.Request.Path.Value ?? "";

    if (path.Equals(AdminPagePath, StringComparison.OrdinalIgnoreCase))
    {
        if (!HasValidAdminCookie(ctx.Request, AdminCookieName, jwtKey))
        {
            ctx.Response.Redirect(LoginPagePath);
            return;
        }
    }

    await next();
});

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

// -------------------- Database Init --------------------

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// -------------------- Helpers --------------------

static bool IsValidUrl(string s) =>
    Uri.TryCreate(s, UriKind.Absolute, out _);

static async Task<AdminsFile> LoadAdminsAsync(string path)
{
    try
    {
        if (!File.Exists(path))
            return new AdminsFile();

        var json = await File.ReadAllTextAsync(path);
        return JsonSerializer.Deserialize<AdminsFile>(
    json,
    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
) ?? new AdminsFile();

    }
    catch
    {
        // If admins file is broken — treat as no admins
        return new AdminsFile();
    }
}

// constant-time сравнение, чтобы без “таймингов”
static bool FixedEquals(string a, string b)
{
    var ba = Encoding.UTF8.GetBytes(a ?? "");
    var bb = Encoding.UTF8.GetBytes(b ?? "");
    return ba.Length == bb.Length && CryptographicOperations.FixedTimeEquals(ba, bb);
}

static bool HasValidAdminCookie(
    HttpRequest req,
    string cookieName,
    SecurityKey signingKey)
{
    if (!req.Cookies.TryGetValue(cookieName, out var token) ||
        string.IsNullOrWhiteSpace(token))
        return false;

    var handler = new JwtSecurityTokenHandler();

    try
    {
        var principal = handler.ValidateToken(token, new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromMinutes(2)
        }, out _);

        if (principal.Identity?.IsAuthenticated != true)
            return false;

        return principal.Claims.Any(c =>
            (c.Type == "role" || c.Type == ClaimTypes.Role) &&
            string.Equals(c.Value, "admin", StringComparison.Ordinal));
    }
    catch
    {
        return false;
    }
}

// -------------------- Routes --------------------

// root goes straight to the first catalog (site a) instead of an index file
app.MapGet("/", () => Results.Redirect("/f9b3c1a2.html"));

// future storefronts – use the obfuscated filenames so they can't be guessed
app.MapGet("/a", () => Results.Redirect("/f9b3c1a2.html"));
app.MapGet("/b", () => Results.Redirect("/q7r8s2t4.html"));
app.MapGet("/c", () => Results.Redirect("/k1m4n6p8.html"));

// -------------------- Admin API: Auth --------------------

app.MapPost("/api/admin/login", async (HttpContext ctx, LoginRequest req) =>
{
    var email = (req.Email ?? "").Trim().ToLowerInvariant();
    var key = (req.Key ?? "").Trim();

    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(key))
        return Results.BadRequest("Email и key обязательны.");

    var admins = await LoadAdminsAsync(adminFilePath);

    var admin = admins.Admins.FirstOrDefault(a =>
        string.Equals(a.Email?.Trim(), email, StringComparison.OrdinalIgnoreCase));

    if (admin is null)
        return Results.Unauthorized();

    if (!FixedEquals(key, admin.Key))
        return Results.Unauthorized();

    var expires = DateTime.UtcNow.AddDays(30);

    var claims = new[]
    {
        new Claim(ClaimTypes.Name, email),
        new Claim("role", "admin")
    };

    var token = new JwtSecurityToken(
        claims: claims,
        expires: expires,
        signingCredentials: new SigningCredentials(jwtKey, SecurityAlgorithms.HmacSha256));

    var jwt = new JwtSecurityTokenHandler().WriteToken(token);

    ctx.Response.Cookies.Append(AdminCookieName, jwt, new CookieOptions
    {
        HttpOnly = true,
        Secure = true, // you are on HTTPS
        SameSite = SameSiteMode.Lax,
        Expires = expires,
        Path = "/"
    });

    return Results.Json(new { ok = true, redirect = AdminPagePath });
});

app.MapPost("/api/admin/logout", (HttpContext ctx) =>
{
    ctx.Response.Cookies.Delete(AdminCookieName, new CookieOptions { Path = "/" });
    return Results.Json(new { ok = true });
});

app.MapGet("/api/admin/me", (ClaimsPrincipal user) =>
{
    var ok = user.Identity?.IsAuthenticated == true;
    return Results.Json(new { ok, email = ok ? user.Identity!.Name : null });
}).RequireAuthorization();

// -------------------- API: Get Products (PUBLIC) --------------------

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

// -------------------- API: Create Product (ADMIN ONLY) --------------------

app.MapPost("/api/products", async (HttpRequest request, AppDbContext db) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest("Expected multipart/form-data.");

    var form = await request.ReadFormAsync();

    var file = form.Files.GetFile("image");
    var linkUrl = form["linkUrl"].ToString();
    var cost = form["cost"].ToString();
    var text = form["text"].ToString();

    var site = form["site"].ToString().Trim().ToLowerInvariant();
    if (string.IsNullOrWhiteSpace(site))
        site = "a";

    if (site is not ("a" or "b" or "c"))
        return Results.BadRequest("Invalid site.");

    if (file is null || file.Length == 0)
        return Results.BadRequest("Image file required.");

    if (string.IsNullOrWhiteSpace(linkUrl) ||
        string.IsNullOrWhiteSpace(cost) ||
        string.IsNullOrWhiteSpace(text))
        return Results.BadRequest("linkUrl, cost and text are required.");

    if (!IsValidUrl(linkUrl))
        return Results.BadRequest("Invalid linkUrl.");

    var ext = Path.GetExtension(file.FileName);

    var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    { ".jpg", ".jpeg", ".png", ".webp" };

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
        Cost = cost.Trim(),
        Text = text.Trim(),
        Site = site,
        CreatedAt = DateTime.UtcNow
    };

    db.Products.Add(product);
    await db.SaveChangesAsync();

    return Results.Created($"/api/products/{product.Id}", product);
}).RequireAuthorization();

// -------------------- API: Delete Product (ADMIN ONLY) --------------------

app.MapDelete("/api/products/{id:int}", async (AppDbContext db, int id) =>
{
    var p = await db.Products.FindAsync(id);

    if (p is null)
        return Results.NotFound();

    db.Products.Remove(p);
    await db.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization();

// -------------------- Server --------------------

var port = Environment.GetEnvironmentVariable("PORT") ?? "5138";
app.Run($"http://0.0.0.0:{port}");

// -------------------- Types --------------------

class AdminsFile
{
    public List<AdminEntry> Admins { get; set; } = new();
}

class AdminEntry
{
    public string Email { get; set; } = "";
    public string Key { get; set; } = ""; // прямой “сложный пароль”
}

record LoginRequest(string Email, string Key);
