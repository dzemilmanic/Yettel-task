# Yettel Task Management API

REST API za upravljanje taskovima sa autentifikacijom i role-based kontrolom pristupa (basic/admin). Aplikacija koristi Express.js, PostgreSQL i JWT autentifikaciju.

## 📋 Sadržaj

- [Tehnologije](#tehnologije)
- [Funkcionalnosti](#funkcionalnosti)
- [Instalacija](#instalacija)
- [Konfiguracija](#konfiguracija)
- [Pokretanje](#pokretanje)
- [Migracije](#migracije)
- [API Dokumentacija](#api-dokumentacija)
- [Testiranje](#testiranje)

## 🛠️ Tehnologije

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relaciona baza podataka
- **JWT** - Autentifikacija
- **bcryptjs** - Hashing lozinki
- **express-validator** - Validacija input podataka

## ✨ Funkcionalnosti

### User Roles

**Basic User:**
- ✅ Kreiranje, ažuriranje i brisanje sopstvenih taskova
- ✅ Pregled liste sopstvenih taskova
- ✅ Ažuriranje sopstvenog profila

**Admin User:**
- ✅ Sve osnovne funkcionalnosti
- ✅ Pregled svih taskova svih korisnika
- ✅ Ažuriranje taskova svih korisnika
- ✅ Upravljanje korisnicima (CRUD operacije)

## 📦 Instalacija

### Preduslovi

- Node.js 22.x ili noviji
- PostgreSQL 12+ (lokalna ili hostovana baza)
- npm ili yarn

### 1. Kloniraj projekat

```bash
git clone [<repository-url>](https://github.com/dzemilmanic/Yettel-task)
```

### 2. Instaliraj zavisnosti

```bash
npm install
```

## ⚙️ Konfiguracija

### 1. Kreiraj `.env` fajl u root folderu:

```env
PORT=3000

# PostgreSQL connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/task_management



# JWT Secret - promeni ovo!
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Environment
NODE_ENV=development

# Opciono: automatski pokreni migracije pri startu
AUTO_MIGRATE=false
```

### 2. Kreiraj PostgreSQL bazu

```bash
# Uloguj se u PostgreSQL
psql -U postgres

# Kreiraj bazu
CREATE DATABASE task_management;

# Izađi
\q
```

## 🚀 Pokretanje

### 1. Pokreni migracije (prvi put)

```bash
npm run migrate:up
```

Ovo će kreirati sve potrebne tabele u bazi podataka.

### 2. Pokreni server

**Development mode (sa auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run dev
```

Server će biti pokrenut na `http://localhost:3000`

## 🗃️ Migracije

### Dostupne komande:

```bash
# Pokreni sve pending migracije
npm run migrate:up

# Rollback poslednje migracije
npm run migrate:down

# Proveri status migracija
npm run migrate:status

# Kreiraj novu migraciju
npm run migrate:create naziv_migracije
```

### Primer kreiranja nove migracije:

```bash
# Kreira fajl: 004_add_task_priority.js
npm run migrate:create add_task_priority
```

Edituj kreirani fajl:

```javascript
exports.up = async (client) => {
  await client.query(`
    ALTER TABLE tasks 
    ADD COLUMN priority VARCHAR(10) DEFAULT 'medium' 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
  `);
};

exports.down = async (client) => {
  await client.query(`
    ALTER TABLE tasks 
    DROP COLUMN IF EXISTS priority
  `);
};
```

Zatim pokreni:
```bash
npm run migrate:up
```

## 📚 API Dokumentacija

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "basic"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "basic"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "role": "basic"
  }
}
```

### User Endpoints

#### Get All Users (Admin only)
```http
GET /api/users
Authorization: Bearer <token>
```

#### Get User By ID
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com"
}
```

#### Delete User (Admin only)
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

### Task Endpoints

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "body": "Završiti projekat do petka"
}
```

#### Get All Tasks
```http
GET /api/tasks
Authorization: Bearer <token>
```
- Basic users: Vraća samo njihove taskove
- Admin users: Vraća sve taskove

#### Get Task By ID
```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

#### Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "body": "Ažurirani opis taska"
}
```
- Basic users: Mogu ažurirati samo svoje taskove
- Admin users: Mogu ažurirati bilo čiji task

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```
- Basic users: Mogu obrisati samo svoje taskove
- Admin users: Mogu obrisati bilo čiji task

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## 🧪 Testiranje

### Postman

1. Importuj `postman_collection.json` u Postman
2. Kreiraj environment sa:
   - `baseUrl`: `http://localhost:3000`
   - `token`: (ostaviće se prazno, popuniće se nakon login-a)
3. Prvo testuj Register
4. Zatim Login (kopiraj dobijeni token)
5. Postavi token u environment varijablu
6. Testuj ostale endpoint-e

### cURL primeri

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "role": "basic"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

**Create Task:**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Završiti projekat"
  }'
```

**Get Tasks:**
```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📁 Struktura projekta

```
yettel-task/
├── src/
│   ├── config/
│   │   └── database.js              # PostgreSQL konfiguracija
│   ├── controllers/
│   │   ├── authController.js        # Auth logika
│   │   ├── userController.js        # User CRUD
│   │   └── taskController.js        # Task CRUD
│   ├── middleware/
│   │   ├── auth.js                  # JWT middleware
│   │   └── errorHandler.js          # Error handling
│   ├── migrations/
│   │   ├── migrationManager.js      # Migration engine
│   │   ├── migrate.js               # CLI tool
│   │   ├── 001_create_users_table.js
│   │   ├── 002_create_tasks_table.js
│   │   └── 003_add_update_triggers.js
│   ├── models/
│   │   ├── User.js                  # User model
│   │   └── Task.js                  # Task model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── taskRoutes.js
│   └── app.js                       # Main application file
├── .env                             # Environment varijable
├── .gitignore
├── package.json
├── postman_collection.json          # Postman kolekcija
└── README.md
```

## 🔒 Sigurnost

- ✅ Lozinke se hash-uju sa bcrypt
- ✅ JWT tokeni za autentifikaciju
- ✅ Role-based autorizacija
- ✅ Validacija input podataka
- ✅ SQL injection zaštita (parameterized queries)
- ✅ CORS konfiguracija

## 🐛 Troubleshooting

### Problem: "Migration failed"
**Rešenje:** Proveri da li je PostgreSQL pokrenut i da li je `DATABASE_URL` ispravan u `.env` fajlu.

### Problem: "Invalid token"
**Rešenje:** Token je istekao (traje 24h). Ponovo se prijavi da dobiješ novi token.

### Problem: "Access denied" pri update-u taska
**Rešenje:** Basic korisnik može update-ovati samo svoje taskove. Proveri da li task pripada tom korisniku.

### Problem: "Connection refused"
**Rešenje:** Proveri da li je PostgreSQL server pokrenut:
```bash
# Windows (ako koristiš lokalni PostgreSQL)
pg_ctl status

# Ili proveri systemctl (Linux)
sudo systemctl status postgresql
```

## 📄 Licenca

MIT

## 👤 Autor

[Džemil Manić]

## 🤝 Contributing

Pull requests su dobrodošli. Za veće izmene, molimo vas da prvo otvorite issue da diskutujemo šta biste želeli da promenite.

---

**Happy Coding!** 🚀
