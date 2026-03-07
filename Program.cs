using CatalogApi.Data;
using CatalogApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.Features;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Net;
using System.Collections.Generic;

var builder = WebApplication.CreateBuilder(args);

// -------------------- Services --------------------

// DB
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Default")));

// Upload limits for multipart/form-data (images from admin panel)
builder.WebHost.ConfigureKestrel(o =>
{
    o.Limits.MaxRequestBodySize = 50 * 1024 * 1024; // 50 MB
});
builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 50 * 1024 * 1024; // 50 MB
});

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

// Site settings storage (JSON file). Keeps theme/text config outside DB schema.
var siteSettingsFilePath =
    Environment.GetEnvironmentVariable("SITE_SETTINGS_FILE_PATH")
    ?? "/var/lib/catalogapi/site-settings.json";
var siteSettingsIoLock = new SemaphoreSlim(1, 1);

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
        if (!IsLocalDevRequest(ctx.Request) &&
            !HasValidAdminCookie(ctx.Request, AdminCookieName, jwtKey))
        {
            ctx.Response.Redirect(LoginPagePath);
            return;
        }
    }

    await next();
});

app.UseStaticFiles();

app.UseAuthentication();
app.Use(async (ctx, next) =>
{
    if (IsLocalDevRequest(ctx.Request))
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "local-dev"),
            new Claim("role", "admin"),
            new Claim(ClaimTypes.Role, "admin")
        };
        ctx.User = new ClaimsPrincipal(new ClaimsIdentity(claims, authenticationType: "local-dev"));
    }

    await next();
});
app.UseAuthorization();

app.Use(async (ctx, next) =>
{
    await next();

    if (ctx.Response.HasStarted)
        return;

    if (ctx.Response.StatusCode != StatusCodes.Status404NotFound)
        return;

    var path = ctx.Request.Path;
    if (path.StartsWithSegments("/api") || path.StartsWithSegments("/404.html"))
        return;

    ctx.Response.Redirect("/404.html");
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

static bool IsLocalDevRequest(HttpRequest req)
{
    var host = req.Host.Host ?? "";
    if (string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase))
        return true;

    if (host == "127.0.0.1" || host == "::1")
        return true;

    var ip = req.HttpContext.Connection.RemoteIpAddress;
    if (ip is null)
        return false;

    return IPAddress.IsLoopback(ip);
}

static string? NormalizeSite(string? raw)
{
    var site = (raw ?? "").Trim().ToLowerInvariant();

    if (string.IsNullOrWhiteSpace(site))
        return "a";

    return site switch
    {
        "a" or "catalog-a" or "site-a" => "a",
        "b" or "catalog-b" or "site-b" => "b",
        "c" or "catalog-c" or "site-c" => "c",
        _ => null
    };
}

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

static async Task<Dictionary<string, JsonElement>> LoadSiteSettingsMapAsync(string path)
{
    try
    {
        if (!File.Exists(path))
            return new Dictionary<string, JsonElement>(StringComparer.OrdinalIgnoreCase);

        var json = await File.ReadAllTextAsync(path);
        var map = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return map ?? new Dictionary<string, JsonElement>(StringComparer.OrdinalIgnoreCase);
    }
    catch
    {
        return new Dictionary<string, JsonElement>(StringComparer.OrdinalIgnoreCase);
    }
}

static async Task SaveSiteSettingsMapAsync(string path, Dictionary<string, JsonElement> map)
{
    var dir = Path.GetDirectoryName(path);
    if (!string.IsNullOrWhiteSpace(dir))
        Directory.CreateDirectory(dir);

    var json = JsonSerializer.Serialize(map, new JsonSerializerOptions { WriteIndented = true });
    await File.WriteAllTextAsync(path, json);
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
    var site = NormalizeSite(req.Query["site"].ToString());

    var q = db.Products.AsQueryable();

    if (site is null)
        return Results.BadRequest("Invalid site.");

    if (!string.IsNullOrWhiteSpace(req.Query["site"]))
        q = q.Where(p => p.Site == site);

    var items = await q
        .OrderByDescending(x => x.Id)
        .ToListAsync();
    
    return Results.Json(items);
});

// -------------------- API: Get Product by Id (PUBLIC) --------------------

app.MapGet("/api/products/{id:int}", async (HttpRequest req, AppDbContext db, int id) =>
{
    var siteFilterRaw = req.Query["site"].ToString();
    var siteFilter = string.IsNullOrWhiteSpace(siteFilterRaw) ? null : NormalizeSite(siteFilterRaw);

    if (!string.IsNullOrWhiteSpace(siteFilterRaw) && siteFilter is null)
        return Results.BadRequest("Invalid site.");

    var q = db.Products.Where(x => x.Id == id);

    if (siteFilter is not null)
        q = q.Where(x => x.Site == siteFilter);

    var item = await q.FirstOrDefaultAsync();
    return item is null ? Results.NotFound() : Results.Json(item);
});

// -------------------- API: Site Settings (Theme/Text) --------------------

app.MapGet("/api/site-settings", async (HttpRequest req) =>
{
    var site = NormalizeSite(req.Query["site"].ToString());
    if (site is null)
        return Results.BadRequest("Invalid site.");

    await siteSettingsIoLock.WaitAsync();
    try
    {
        var map = await LoadSiteSettingsMapAsync(siteSettingsFilePath);
        if (map.TryGetValue(site, out var settings))
            return Results.Json(settings);

        // Default payload for site a (client can still keep local fallback).
        return Results.Json(new
        {
            themePreset = "legacy",
            texts = new
            {
                title = "Opanot com",
                notice = "이 게시물은 쿠팡파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
                footer = "Catalog viewer • Images and links are provided by the product source."
            },
            dev = new
            {
                enabled = false,
                manualTheme = new
                {
                    bodyBg = "#020617",
                    cardBg = "#0f172a",
                    accent = "#059669",
                    borderColor = "#1e293b",
                    circleColor = "transparent",
                    circleSize = "340px",
                    circleOpacity = "0",
                    flat = true
                },
                textOverrides = new
                {
                    searchPlaceholder = "Search products...",
                    refresh = "Refresh",
                    admin = "Admin",
                    openProduct = "Open Product",
                    productInfo = "Product info",
                    sortNew = "Newest",
                    sortOld = "Oldest"
                },
                allowEmpty = false
            }
        });
    }
    finally
    {
        siteSettingsIoLock.Release();
    }
});

app.MapPut("/api/site-settings/{site}", async (string site, HttpRequest request) =>
{
    var normalized = NormalizeSite(site);
    if (normalized is null)
        return Results.BadRequest("Invalid site.");

    JsonElement payload;
    try
    {
        payload = await request.ReadFromJsonAsync<JsonElement>();
    }
    catch (Exception ex)
    {
        return Results.BadRequest($"Invalid JSON payload: {ex.Message}");
    }

    if (payload.ValueKind != JsonValueKind.Object)
        return Results.BadRequest("Settings payload must be a JSON object.");

    await siteSettingsIoLock.WaitAsync();
    try
    {
        var map = await LoadSiteSettingsMapAsync(siteSettingsFilePath);
        map[normalized] = payload.Clone();
        await SaveSiteSettingsMapAsync(siteSettingsFilePath, map);
        return Results.Json(new { ok = true, site = normalized });
    }
    finally
    {
        siteSettingsIoLock.Release();
    }
}).RequireAuthorization();

// -------------------- API: Create Product (ADMIN ONLY) --------------------

app.MapPost("/api/products", async (HttpRequest request, AppDbContext db, ILogger<Program> logger) =>
{
    if (!request.HasFormContentType)
    {
        logger.LogWarning("Create product rejected: Expected multipart/form-data. Content-Type={ContentType}", request.ContentType);
        return Results.BadRequest("Expected multipart/form-data.");
    }

    IFormCollection form;
    try
    {
        form = await request.ReadFormAsync();
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Create product rejected while parsing form-data.");
        return Results.BadRequest($"Invalid multipart/form-data: {ex.Message}");
    }

    var file = form.Files.GetFile("image");
    var linkUrl = form["linkUrl"].ToString();
    if (string.IsNullOrWhiteSpace(linkUrl))
        linkUrl = form["url"].ToString();

    var cost = form["cost"].ToString();
    if (string.IsNullOrWhiteSpace(cost))
        cost = form["price"].ToString();

    var costRaw = form["costRaw"].ToString();
    if (string.IsNullOrWhiteSpace(cost) && !string.IsNullOrWhiteSpace(costRaw))
        cost = new string(costRaw.Where(char.IsDigit).ToArray());

    var text = form["text"].ToString();

    var siteRaw = form["site"].ToString();
    if (string.IsNullOrWhiteSpace(siteRaw))
        siteRaw = form["catalog"].ToString();

    var site = NormalizeSite(siteRaw);
    if (site is null)
    {
        logger.LogWarning("Create product rejected: invalid site '{SiteRaw}'", siteRaw);
        return Results.BadRequest("Invalid site.");
    }

    if (file is null || file.Length == 0)
    {
        logger.LogWarning("Create product rejected: image missing.");
        return Results.BadRequest("Image file required.");
    }

    if (string.IsNullOrWhiteSpace(linkUrl) ||
        string.IsNullOrWhiteSpace(cost) ||
        string.IsNullOrWhiteSpace(text))
    {
        logger.LogWarning("Create product rejected: required fields missing. linkUrl={HasLink} cost={HasCost} text={HasText}",
            !string.IsNullOrWhiteSpace(linkUrl), !string.IsNullOrWhiteSpace(cost), !string.IsNullOrWhiteSpace(text));
        logger.LogWarning("Create product form keys: {Keys}", string.Join(", ", form.Keys));
        return Results.BadRequest("linkUrl, cost and text are required.");
    }

    if (!IsValidUrl(linkUrl))
    {
        logger.LogWarning("Create product rejected: invalid linkUrl '{LinkUrl}'", linkUrl);
        return Results.BadRequest("Invalid linkUrl.");
    }

    var ext = Path.GetExtension(file.FileName);

    var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".jpe", ".jfif", ".pjpeg", ".pjp",
        ".png", ".webp", ".avif", ".gif", ".bmp",
        ".tif", ".tiff", ".heic", ".heif"
    };

    if (string.IsNullOrWhiteSpace(ext) || !allowed.Contains(ext))
    {
        logger.LogWarning("Create product rejected: unsupported extension '{Ext}'", ext);
        return Results.BadRequest("Unsupported image format.");
    }

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
    logger.LogInformation("Product created. Id={Id}, Site={Site}, Image={ImageUrl}", product.Id, product.Site, product.ImageUrl);

    return Results.Created($"/api/products/{product.Id}", product);
}).RequireAuthorization();

// -------------------- API: Update Product (ADMIN ONLY) --------------------

app.MapPut("/api/products/{id:int}", async (AppDbContext db, int id, UpdateProductRequest req) =>
{
    var p = await db.Products.FindAsync(id);
    if (p is null)
        return Results.NotFound();

    var linkUrl = (req.LinkUrl ?? "").Trim();
    var cost = new string((req.Cost ?? "").Where(char.IsDigit).ToArray());
    var text = (req.Text ?? "").Trim();
    var site = NormalizeSite(req.Site);

    if (string.IsNullOrWhiteSpace(linkUrl) ||
        string.IsNullOrWhiteSpace(cost) ||
        string.IsNullOrWhiteSpace(text))
        return Results.BadRequest("linkUrl, cost and text are required.");

    if (!IsValidUrl(linkUrl))
        return Results.BadRequest("Invalid linkUrl.");

    if (site is null)
        return Results.BadRequest("Invalid site.");

    p.LinkUrl = linkUrl;
    p.Cost = cost;
    p.Text = text;
    p.Site = site;

    await db.SaveChangesAsync();
    return Results.Json(p);
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
record UpdateProductRequest(string LinkUrl, string Cost, string Text, string Site);
