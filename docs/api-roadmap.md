# API — Pendientes y huecos para un ecommerce

Análisis del estado de `apps/api` frente a lo que necesita una tienda online real: qué endpoints existen pero están mal resueltos, y cuáles faltan por exponer.

Complementa a [`api.md`](./api.md), que documenta lo que la API hace **hoy**. Este documento apunta a lo que **debería** hacer.

> Fecha del análisis: 2026-09-05. Los puntos marcados como *verificado* se comprobaron ejecutando peticiones reales contra la API local (`http://localhost:5135`) con la base de datos de desarrollo; el resto sale de leer el código fuente.

---

## 1. Bloqueantes actuales

Cuatro cosas que ya están rotas, antes de hablar de funcionalidad nueva.

### 1.1 El registro devuelve 500 y aun así crea el usuario — *verificado*

`AuthenticationController.Register` llama a `SendVerificationEmail` **después** de que `_userManager.CreateAsync` ya guardó el usuario, y `EmailService.SendEmailAsync` relanza cualquier excepción. Como `SmtpSettings` tiene `UserName` y `Password` vacíos en `appsettings.json`, el envío falla siempre.

```bash
curl -X POST http://localhost:5135/api/Authentication/Register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","emailAddress":"probe@example.com","password":"Passw0rd123"}'
# → 500 con el stack trace completo de MailKit en el cuerpo
# → el usuario queda creado en AspNetUsers con EmailConfirmed = false
```

Consecuencia en cadena:

- Reintentar el registro → `"Email already exists"`.
- Hacer login → `"Email needs to be confirmed."`.
- No existe endpoint para reenviar la confirmación → **la cuenta queda inservible de forma permanente**.

Además se filtra el stack trace al cliente, con detalles de la cuenta SMTP.

**Qué hace falta:** envolver el envío en try/catch (el registro no debe fallar porque el correo no salga), no relanzar detalles al cliente, y exponer `ResendConfirmation` (ver §3.1).

### 1.2 Cualquier cliente registrado puede modificar el catálogo — *verificado*

`Program.cs` usa `AddDefaultIdentity<IdentityUser>()` sin `.AddRoles<IdentityRole>()`. No existe el concepto de rol, así que `[Authorize]` solo significa "trae un token válido".

Con un usuario recién registrado, sin ningún privilegio:

```bash
# crea un producto en el catálogo público
curl -X POST http://localhost:5135/api/Products -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"ZZ Prueba","price":1.23,"productCategoryId":1,"orderDetails":[]}'
# → 201 Created

# y lo borra
curl -X DELETE http://localhost:5135/api/Products -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"id":17, ...}'
# → 204 No Content
```

Aplica igual a `ProductCategories`. Es el agujero de seguridad más grave del backend.

**Qué hace falta:** rol `Admin` (`AddRoles<IdentityRole>()` + seed del rol), `[Authorize(Roles = "Admin")]` en toda mutación de catálogo, y un usuario administrador inicial.

### 1.3 `Client` no está conectado a `IdentityUser` — *verificado*

Registrarse crea un `IdentityUser`. Nunca crea un `Client`. `GET /api/Clients` devuelve `[]` después de un registro exitoso.

Como `Order.ClientId` apunta a `Client` y no hay ninguna relación entre `Client` y el usuario autenticado, **no hay forma de saber qué cliente es el usuario del token**. El flujo de compra completo es inalcanzable, y `POST /api/Orders` se ve obligado a confiar en el `ClientId` que mande el cliente (cualquiera puede crear órdenes a nombre de otro).

Es la falla estructural de la que cuelga casi todo lo demás de este documento.

**Qué hace falta:** FK `Client.UserId` → `AspNetUsers.Id`, y creación automática del `Client` al registrarse o en el primer checkout.

### 1.4 El refresh token no funciona en el único caso para el que existe

En `VerifyAndGenerateTokenAsync`:

```csharp
var tokenValidationParameters = _tokenValidationParameters.Clone();
tokenValidationParameters.ValidateLifetime = false;   // se prepara el clon...

var tokenBeingVerified = jwtTokenHandler.ValidateToken(
    tokenRequest.Token,
    _tokenValidationParameters,                        // ...y se pasa el original
    out var validatedToken
);
```

El clon con `ValidateLifetime = false` nunca se usa. Como el singleton registrado en `Program.cs` tiene `ValidateLifetime = true` y `ClockSkew = TimeSpan.Zero`, renovar con un JWT ya vencido lanza excepción y devuelve `"Internal Server Error"` — que es exactamente el escenario para el que sirve un refresh token.

Dos problemas adicionales en el mismo flujo:

- `RandomGenerator.GenerateRandomString` usa `new Random()`, que no es criptográficamente seguro. Un refresh token predecible es un problema real de seguridad; debe usar `RandomNumberGenerator`.
- El refresh dura 6 meses (`AddMonths(6)`), el propio comentario del código dice que el estándar son 30 días.

---

## 2. Endpoints existentes que deben mejorar

| Endpoint | Problema | Requisito |
|---|---|---|
| `GET /api/Products` | Devuelve la tabla entera sin paginar, filtrar ni buscar. Por eso `apps/web` pagina y busca en memoria sobre el listado completo | Aceptar `?page&pageSize&q&categoryId&minPrice&maxPrice&sort`; responder `{ items, total, page, pageSize }` |
| `POST` / `PUT /api/Products` | Usan la entidad de EF como DTO de entrada: `OrderDetails` (propiedad de navegación) es **obligatoria** para crear un producto — sin ella responde `400 The OrderDetails field is required`. Además permite over-posting de relaciones | DTOs propios de request y response; no exponer nunca propiedades de navegación |
| `PUT` y `DELETE` (todos los controladores) | Reciben la entidad completa en el body, sin id en la ruta. `DELETE` con cuerpo no es fiable en muchos clientes HTTP ni en proxies | `PUT /api/Products/{id}`, `DELETE /api/Products/{id}` |
| `POST` (todos los controladores) | `CreatedAtAction("Post", obj.Id, obj)` usa mal la sobrecarga: el segundo parámetro son `routeValues`, no el id. El header queda `Location: /api/Products` — apunta a la colección, no al recurso creado (*verificado*) | `CreatedAtAction(nameof(GetDetails), new { id = dto.Id }, dto)` |
| `GET /api/Orders` | No filtra por dueño: cualquier autenticado lista las órdenes de todos | Filtrar por el cliente derivado del token; la vista sin filtro solo para `Admin` |
| `GET /api/Orders/{id}` | Sin verificación de propiedad (IDOR) | Responder 404 si la orden no pertenece al usuario |
| `POST /api/Orders` | Confía en el `ClientId`, `OrderNumber` y fechas que envía el cliente; no calcula ni valida precios | Derivar el cliente del token, generar `OrderNumber` en servidor, calcular el total en servidor, validar stock |
| `PUT` / `DELETE /api/Orders` | Una orden es un registro financiero: no se edita ni se borra. El `PUT` actual además borra y recrea todos los `OrderDetails` | Sustituir por cancelación con transición de estado (§3.4) |
| `GET /api/Clients` | Expone PII de todos los clientes (nombre, teléfono, dirección, fecha de nacimiento) a cualquier autenticado | Restringir a `Admin`; el usuario accede a lo suyo vía `/Me` |
| `GET /api/Products/GetByCategory/{id}` | Verbo dentro de la ruta y segmento en PascalCase | `GET /api/ProductCategories/{id}/products` |
| `GET /api/Authentication/ConfirmEmail` | Devuelve un string plano, inservible para una SPA | Redirigir al frontend con el resultado en query string |
| `GET /api/Test` | Endpoint público que refleja input del usuario, sin propósito en producción | Eliminar el controlador |

---

## 3. Endpoints que faltan

### 3.1 Cuenta y sesión

| Endpoint | Requisitos |
|---|---|
| `GET /api/Authentication/Me` | Devuelve el usuario del token: id, email, nombre, rol, `emailConfirmed`. Hoy `apps/web` decodifica el JWT a mano en `lib/session.ts` justamente porque esto no existe |
| `POST /api/Authentication/Logout` | Recibe el refresh token y lo marca `IsRevoked = true`. El campo ya existe en la tabla `RefreshTokens` y **nada lo escribe nunca** |
| `POST /api/Authentication/ResendConfirmation` | Desbloquea el §1.1. Rate limit obligatorio; responder siempre 200 sin revelar si el email existe |
| `POST /api/Authentication/ForgotPassword` | Envía enlace de recuperación. Token de un solo uso, expiración corta, respuesta genérica |
| `POST /api/Authentication/ResetPassword` | Valida el token y cambia la contraseña. Debe invalidar todos los refresh tokens activos del usuario |
| `POST /api/Authentication/ChangePassword` | Autenticado. Exige la contraseña actual |

### 3.2 Perfil del cliente

| Endpoint | Requisitos |
|---|---|
| `GET /api/Clients/Me` | Datos del cliente asociado al token. Requiere primero el FK del §1.3 |
| `PUT /api/Clients/Me` | Actualiza nombre, teléfono, fecha de nacimiento. Nunca permite cambiar el `UserId` |
| `GET /api/Addresses` | Direcciones del cliente autenticado |
| `POST /api/Addresses` | Alta de dirección: calle, ciudad, provincia, código postal, país, alias, `isDefault` |
| `PUT /api/Addresses/{id}` · `DELETE /api/Addresses/{id}` | Con verificación de propiedad. No permitir borrar una dirección referenciada por una orden histórica |

Un ecommerce necesita varias direcciones por cliente con una marcada por defecto; el campo suelto `Client.Address` (string) no alcanza.

### 3.3 Carrito — no existe absolutamente nada

| Endpoint | Requisitos |
|---|---|
| `GET /api/Cart` | Carrito del usuario con líneas, subtotales y total **calculados en servidor** |
| `POST /api/Cart/Items` | `{ productId, quantity }`. Valida que el producto exista, esté activo y tenga stock. Si ya está en el carrito, suma cantidad |
| `PUT /api/Cart/Items/{productId}` | Cambia cantidad; cantidad 0 elimina la línea |
| `DELETE /api/Cart/Items/{productId}` | Elimina una línea |
| `DELETE /api/Cart` | Vacía el carrito |

Requisito transversal: **el precio nunca viaja desde el cliente**, siempre se lee de la base de datos en el momento de calcular. El botón "Comprar" del frontend está deshabilitado precisamente porque este módulo no existe.

### 3.4 Checkout y órdenes

| Endpoint | Requisitos |
|---|---|
| `POST /api/Orders/FromCart` | Convierte el carrito en orden dentro de una transacción: snapshot de precios unitarios, descuento de stock, dirección de envío copiada (no referenciada), estado inicial `Pending`. Falla completa si algún ítem quedó sin stock |
| `POST /api/Orders/{id}/Cancel` | Solo si el estado lo permite (`Pending`, `Paid`). Devuelve el stock reservado |
| `PATCH /api/Orders/{id}/Status` | Solo `Admin`. Transiciones válidas: `Pending → Paid → Shipped → Delivered`, y `Cancelled` desde los dos primeros |
| `GET /api/Orders/{id}/Invoice` | Comprobante de la orden. Debe reflejar los precios del momento de la compra, no los actuales |

### 3.5 Pagos y envíos

| Endpoint | Requisitos |
|---|---|
| `POST /api/Orders/{id}/PaymentIntent` | Crea la intención de pago contra la pasarela y devuelve el identificador al frontend. El monto se calcula en servidor |
| `POST /api/Payments/Webhook` | Público, pero **con verificación de firma** e **idempotente**: la pasarela puede reenviar el mismo evento. Es lo que mueve la orden a `Paid` |
| `GET /api/ShippingMethods` | Métodos disponibles con su costo base |
| `POST /api/Shipping/Quote` | Costo según dirección de destino y contenido del carrito |

### 3.6 Catálogo — contenido e inventario

| Endpoint | Requisitos |
|---|---|
| `POST /api/Products/{id}/Images` | Subida de imágenes (multipart), validación de tipo y tamaño, orden de visualización. Hoy las fotos están hardcodeadas en el frontend (`modules/products/list/product-images.ts`), no vienen de la API |
| `DELETE /api/Products/{id}/Images/{imageId}` | Solo `Admin` |
| `GET /api/Products/{id}/Stock` | Disponibilidad actual |
| `PATCH /api/Products/{id}/Stock` | Solo `Admin`. Ajuste de inventario con motivo |

### 3.7 Administración

| Endpoint | Requisitos |
|---|---|
| `GET /api/Admin/Orders` | Todas las órdenes con filtros por estado, rango de fechas y cliente. Paginado |
| `GET /api/Admin/Clients` | Listado de clientes, paginado. Sustituye al `GET /api/Clients` actual |

Prerrequisito de toda esta sección: que exista el rol `Admin` (§1.2).

### 3.8 Transversal

- `GET /health` — no existe ningún health check.
- **CORS** no está configurado en `Program.cs`. Hoy funciona solo porque Next.js actúa de proxy desde el servidor; cualquier llamada directa desde el navegador fallaría.
- **Middleware global de errores**: no hay `UseExceptionHandler`. En producción los 500 no deben filtrar stack traces (ver §1.1), y conviene un formato de error consistente (`ProblemDetails`) en todos los controladores.
- **Rate limiting** en login, registro y recuperación de contraseña.

---

## 4. Cambios de modelo de los que dependen esos endpoints

Sin estos cambios de esquema, buena parte de lo anterior no se puede implementar.

| Cambio | Por qué |
|---|---|
| `Client.UserId` → FK a `AspNetUsers.Id` | Desbloquea `/Me`, la propiedad de las órdenes y el checkout completo (§1.3) |
| `OrderDetail.UnitPrice` | **El más crítico.** Hoy el detalle solo guarda cantidad, así que si cambias el precio de un producto, el valor histórico de todas las órdenes pasadas cambia solo |
| `Order.Status` | No hay ciclo de vida de la orden |
| `Order.Total`, `Order.Currency` | El total debe quedar congelado en la orden, no recalcularse desde precios vivos |
| Snapshot de dirección de envío en `Order` | La dirección del cliente puede cambiar después de la compra; el envío ya realizado no |
| `Product`: `Description`, `Stock`, `IsActive`, `Sku`, `Slug`, `ImageUrl`, `CreatedAt` | El modelo actual solo tiene `Id`, `Name`, `Price`, `ProductCategoryId` |
| Entidades nuevas: `Cart`, `CartItem`, `Address`, `ProductImage` | No existen |
| `IdentityRole` | Sin roles no hay separación cliente/administrador |

---

## 5. Orden sugerido

1. **Bloqueantes**: §1.1 (registro), §1.2 (roles), §1.3 (`Client.UserId`), §1.4 (refresh token). Nada de lo demás es sólido sin esto.
2. **Catálogo utilizable**: paginación y búsqueda en `GET /api/Products`, DTOs propios, rutas con id, campos nuevos de `Product`.
3. **Cuenta**: `Me`, `Logout`, `ResendConfirmation`, recuperación de contraseña.
4. **Compra**: carrito → `OrderDetail.UnitPrice` y estados de orden → checkout.
5. **Pagos y envíos**.
6. **Administración** e imágenes de producto.
