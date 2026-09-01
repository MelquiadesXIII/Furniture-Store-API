using System.Text;
using API.FurnitoreStore.API.Configuration;
using API.FurnitoreStore.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Furniture_Store_API",
        Version = "v1"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. \n\n Enter prefix (Bearer), space, and then your token. Example 'Bearer 2287386hfdfhj'"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var connectionString =
    Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("APIFurnitoreStoreContext")
    ?? throw new InvalidOperationException("DATABASE_URL not configured");

builder.Services.AddDbContext<APIFurnitureStoreContext>(options =>
    options.UseNpgsql(connectionString)
);

//Configurar JWT
var jwtSecret =
    Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["JwtConfig:Secret"]
    ?? throw new InvalidOperationException("JWT_SECRET not configured");

var jwtIssuer =
    Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["JwtConfig:Issuer"]
    ?? throw new InvalidOperationException("JWT_ISSUER not configured");

var jwtAudience =
    Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? builder.Configuration["JwtConfig:Audience"]
    ?? throw new InvalidOperationException("JWT_AUDIENCE not configured");

builder.Services.Configure<JwtConfig>(config =>
{
    config.Secret = jwtSecret;
    config.Issuer = jwtIssuer;
    config.Audience = jwtAudience;
});

builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(jwt =>
    {
        //Aqui se guarda el valor del secret jwt
        var key = Encoding.UTF8.GetBytes(jwtSecret);

        jwt.SaveToken = true;
        jwt.TokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),

            //Esto en produccion debe ser verdadero, esto valida quien emitio el token
            // para asegurarse q no hubo nadie intermedio que cambiara el token
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            //Esto en produccion debe ser verdadero, que el destinatario
            // de este token debe ser el mismo que lo esta recibiendo
            ValidateAudience = true,
            ValidAudience = jwtAudience,

            RequireExpirationTime = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
    });

builder
    .Services.AddDefaultIdentity<IdentityUser>(options =>
    {
        options.SignIn.RequireConfirmedAccount = false;
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<APIFurnitureStoreContext>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
