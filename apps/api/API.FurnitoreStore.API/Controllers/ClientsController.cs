using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.FurnitoreStore.Data;
using API.FurnitoreStore.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.FurnitoreStore.API.Controllers
{   
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
         private readonly APIFurnitureStoreContext _context;

         public ClientsController(APIFurnitureStoreContext context)
         {
            _context = context;
         }

        [HttpGet]
        public async Task<IEnumerable<Client>> Get()
        {
            return await _context.Clients.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetails(int id)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.ID == id);

            if (client == null)
            {
                return NotFound();
            }

            return Ok(client);
        }

        [HttpPost]
        public async Task<IActionResult> Post(Client client)
        {
            
            await _context.Clients.AddAsync(client);
            await _context.SaveChangesAsync();

            return CreatedAtAction("Post", client.ID, client);
        }

         [HttpPut]
         public async Task<IActionResult> Put(Client client)
        {
            _context.Clients.Update(client);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(Client client)
        {
            if (client == null) return NotFound();

            _context.Clients.Remove(client);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}