using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using API.FurnitoreStore.API.Configuration;
using API.FurnitoreStore.Shared.Auth;
using API.FurnitoreStore.Shared.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace API.FurnitoreStore.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly JwtConfig _jwtConfig;

        public AuthenticationController(
            UserManager<IdentityUser> userManager,
            IOptions<JwtConfig> jwtConfig
        )
        {
            _userManager = userManager;
            _jwtConfig = jwtConfig.Value;
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] UserRegistrationRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            // Verifica si el email existe
            var emailExists = await _userManager.FindByEmailAsync(request.EmailAddress);

            if (emailExists != null)
                return BadRequest(
                    new AuthResult()
                    {
                        Result = false,
                        Errors = new List<String>() { "Email already exists" },
                    }
                );

            // Crear usuario
            var user = new IdentityUser()
            {
                Email = request.EmailAddress,
                UserName = request.EmailAddress,
            };

            var isCreated = await _userManager.CreateAsync(user, request.Password);

            if (isCreated.Succeeded)
            {
                var token = GenerateToken(user);
                return Ok(new AuthResult() { Result = true, Token = token });
            }
            else
            {
                var errors = new List<string>();
                foreach (var err in isCreated.Errors)
                    errors.Add(err.Description);

                return BadRequest(new AuthResult { Result = false, Errors = errors });
            }
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] UserLoginRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            // Chequear si el usuario existe
            var existingUser = await _userManager.FindByEmailAsync(request.Email);

            if (existingUser == null)
                return BadRequest(
                    new AuthResult()
                    {
                        Errors = new List<string> { "Invalid Payload" },
                        Result = false,
                    }
                );

            var checkUserAndPass = await _userManager.CheckPasswordAsync(
                existingUser,
                request.Password
            );

            if (!checkUserAndPass)
            {
                return BadRequest(
                    new AuthResult()
                    {
                        Errors = new List<string> { "Invalid Credentials" },
                        Result = false,
                    }
                );
            }

            var token = GenerateToken(existingUser);

            return Ok(new AuthResult { Token = token, Result = true });
        }

        private string GenerateToken(IdentityUser user)
        {
            var jwtTokenHandler = new JwtSecurityTokenHandler();

            var key = Encoding.UTF8.GetBytes(_jwtConfig.Secret);

            var tokenDescriptor = new SecurityTokenDescriptor()
            {
                Subject = new ClaimsIdentity(
                    new ClaimsIdentity(
                        new[]
                        {
                            new Claim("Id", user.Id),
                            new Claim(JwtRegisteredClaimNames.Sub, user.Email!),
                            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                            //  JWT ID, se usa para prevenir ataques de volver a utilizar el token, se agrega un identificador unico
                            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                            // Iat identifica la hora y el dia a la que fue emitida el token
                            new Claim(
                                JwtRegisteredClaimNames.Iat,
                                DateTime.Now.ToUniversalTime().ToString()
                            ),
                        }
                    )
                ),
                Expires = DateTime.UtcNow.AddHours(1),
                Issuer = _jwtConfig.Issuer,
                Audience = _jwtConfig.Audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256
                ),
            };

            var token = jwtTokenHandler.CreateToken(tokenDescriptor);

            return jwtTokenHandler.WriteToken(token);
        }
    }
}
