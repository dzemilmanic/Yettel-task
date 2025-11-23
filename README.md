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
git clone https://github.com/dzemilmanic/Yettel-task
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

# Za hostovane servise (Neon, Supabase, Railway):
# DATABASE_URL=postgresql://user:pass@host.region.provider.com:5432/dbname

# JWT Secret - promeni ovo!
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Environment
NODE_ENV=development

# Opciono: automatski pokreni migracije pri startu
AUTO_MIGRATE=false
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
npm start
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

### Preduslovi za testiranje

Projekat koristi **Jest** i **Supertest** za E2E (end-to-end) testove.

### Setup test okruženja

#### 1. Instaliraj test zavisnosti

```bash
npm install --save-dev jest supertest cross-env
```

#### 2. Kreiraj test bazu podataka

**VAŽNO**: Ne koristite istu bazu za development i testove! Testovi brišu sve podatke pri svakom pokretanju.

#### 3. Kreiraj `test.env` fajl

```env
PORT=3001
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/task_management_test
JWT_SECRET=test_jwt_secret_key_for_testing
NODE_ENV=test
AUTO_MIGRATE=false
```

#### 4. Pokreni migracije na test bazi

```bash
# Koristi cross-env za Windows kompatibilnost
cross-env NODE_ENV=test npm run migrate:up
```

### Pokretanje testova

```bash
# Pokreni sve testove
npm test

# Pokreni testove u watch mode (automatski rerun pri promeni)
npm run test:watch

# Pokreni testove sa coverage reportom
npm run test:coverage
```

### Test struktura

```
test/
├── setup.js              # Helper funkcije za testove
├── auth.test.js          # Authentication testovi
├── tasks.test.js         # Task CRUD testovi
├── users.test.js         # User CRUD testovi
└── integration.test.js   # Full workflow testovi
```

### Šta testovi pokrivaju

#### **Authentication Tests** (9 testova)
- ✅ Uspešna registracija korisnika
- ✅ Neuspešna registracija (duplikat username/email)
- ✅ Validacija input podataka
- ✅ Uspešan i neuspešan login
- ✅ Weak password validacija

#### **Task Tests** (17 testova)
- ✅ Kreiranje taskova
- ✅ Dobijanje liste taskova (basic vs admin)
- ✅ Dobijanje pojedinačnog taska
- ✅ Ažuriranje taskova sa permission checks
- ✅ Brisanje taskova sa permission checks
- ✅ Provera vlasništva taskova

#### **User Tests** (15 testova)
- ✅ Admin može da vidi sve usere
- ✅ Basic user ne može da vidi sve usere
- ✅ Dobijanje i ažuriranje sopstvenog profila
- ✅ Promena passworda
- ✅ Brisanje usera (admin only)
- ✅ Cascade delete (taskovi se brišu sa userom)

#### **Integration Tests** (15 testova)
- ✅ Kompletan user journey (register → login → CRUD)
- ✅ Admin vs Basic user permissions
- ✅ Error handling (invalid JSON, expired tokens)
- ✅ Security testovi (SQL injection, XSS attempts)
- ✅ Edge cases

### Primer output-a

```bash
$ npm test

PASS  test/auth.test.js
  Authentication E2E Tests
    POST /api/auth/register
      ✓ should register a new user successfully (250ms)
      ✓ should fail with duplicate username (120ms)
      ✓ should fail with duplicate email (115ms)
    POST /api/auth/login
      ✓ should login successfully (180ms)
      ✓ should fail with invalid credentials (90ms)

PASS  test/tasks.test.js (6.627 s)
PASS  test/users.test.js (6.259 s)
PASS  test/integration.test.js (9.182 s)

Test Suites: 4 passed, 4 total
Tests:       56 passed, 56 total
Snapshots:   0 total
Time:        28.404 s
Ran all test suites.
```

### Coverage Report

```bash
npm run test:coverage
```

Generiše detaljni coverage report:

```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   92.45 |    85.71 |   95.23 |   93.12 |
 controllers        |   95.12 |    87.50 |   97.14 |   96.23 |
  authController.js |   98.23 |    92.30 |  100.00 |   99.12 |
  taskController.js |   94.56 |    85.71 |   95.83 |   95.67 |
  userController.js |   93.45 |    84.61 |   94.73 |   94.12 |
--------------------|---------|----------|---------|---------|
```

### Troubleshooting testova

#### Problem: "EADDRINUSE: address already in use"
**Rešenje**: Port je već zauzet. Promenite port u `test.env`:
```env
PORT=3001
```

#### Problem: "clearDatabase() error"
**Rešenje**: Proverite da li je `NODE_ENV=test` setovan. Test helper ne dozvoljava brisanje dev baze.

#### Problem: Testovi spori na Windows-u
**Rešenje**: Isključite Windows Defender za projekat folder ili dodajte folder u exclusions.

#### Problem: "Cannot find module"
**Rešenje**: Reinstalirajte zavisnosti:
```bash
rm -rf node_modules
npm install
```

### CI/CD sa GitHub Actions (Opciono)

Za automatsko testiranje na svakom push-u, kreirajte `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: task_management_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '22'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run migrations
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/task_management_test
        JWT_SECRET: test_secret_key
        NODE_ENV: test
      run: npm run migrate:up
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/task_management_test
        JWT_SECRET: test_secret_key
        NODE_ENV: test
      run: npm test
```

### Best Practices

1. **Uvek koristite posebnu test bazu** - nikad development bazu
2. **Pokrenite testove pre svakog commit-a** - sprečava bugove
3. **Ažurirajte testove** kada dodajete nove feature-e
4. **Proveravajte coverage** - cilj je 80%+ pokrivenos
5. **Mock eksterne servise** ako postoje (email, payment, itd.)

---

## 🔧 Manuelno testiranje

### Postman

1. Importuj `postman_collection.json` u Postman
2. Kreiraj environment sa:
   - `baseUrl`: `http://localhost:3000`
   - `token`: (ostaviće se prazno, popuniće se nakon login-a)
3. Prvo testuj Register
4. Zatim Login (kopiraj dobijeni token)
5. Postavi token u environment varijablu
6. Testuj ostale endpoint-e

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

Džemil Manić

## 🤝 Contributing

Pull requests su dobrodošli. Za veće izmene, molimo vas da prvo otvorite issue da diskutujemo šta biste želeli da promenite.

---

**Happy Coding!** 🚀