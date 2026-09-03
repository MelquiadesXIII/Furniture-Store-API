using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using API.FurnitoreStore.API.Configuration;
using API.FurnitoreStore.Shared.Auth;
using API.FurnitoreStore.Shared.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
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
        private readonly IEmailSender _emailSender;

        public AuthenticationController(
            UserManager<IdentityUser> userManager,
            IOptions<JwtConfig> jwtConfig,
            IEmailSender emailSender
        )
        {
            _userManager = userManager;
            _jwtConfig = jwtConfig.Value;
            _emailSender = emailSender;
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
                EmailConfirmed = false,
            };

            var isCreated = await _userManager.CreateAsync(user, request.Password);

            if (isCreated.Succeeded)
            {
                await SendVerificationEmail(user);

                return Ok(new AuthResult() { Result = true });
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

            if (!existingUser.EmailConfirmed)
                return BadRequest(
                    new AuthResult()
                    {
                        Errors = new List<string> { "Email needs to be confirmed." },
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

        [HttpGet("ConfirmEmail")]
        public async Task<IActionResult> ConfirmEmail(string userId, string code)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(code))
                return BadRequest(
                    new AuthResult
                    {
                        Errors = new List<string> { "Invalid email confirmation url" },
                        Result = false,
                    }
                );

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound($"Unable to load user with ID '{userId}'.");

            code = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(code));

            var result = await _userManager.ConfirmEmailAsync(user, code);

            var status = result.Succeeded
                ? "Thanks you for confirming your email."
                : "There has been an error confirming your email";

            return Ok(status);
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

        private async Task SendVerificationEmail(IdentityUser user)
        {
            var verificationCode = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            verificationCode = WebEncoders.Base64UrlEncode(
                Encoding.UTF8.GetBytes(verificationCode)
            );

            var callbackUrl =
                $"{Request.Scheme}://{Request.Host}{Url.Action("ConfirmEmail", controller: "Authentication", new { userId = user.Id, code = verificationCode })}";

            var emailBody =
                $"Please confirm your account by <a href='{HtmlEncoder.Default.Encode(callbackUrl)}'>clicking here</a>";

            await _emailSender.SendEmailAsync(user.Email, "Confirm your email", emailBody);
        }
    }
}
