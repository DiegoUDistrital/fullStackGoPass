# Sistema de Gestión de Proyectos y Tareas

Aplicación web full-stack para la gestión de proyectos, tareas, usuarios y comentarios, con un dashboard de indicadores calculados dinámicamente.

Este documento permite instalar, configurar, ejecutar y demostrar la solución completa sin conocimiento previo del desarrollo. Para el guion de demostración funcional, ver [`DEMO.md`](./DEMO.md).

## Tabla de contenidos

1. [Stack tecnológico](#stack-tecnológico)
2. [Arquitectura](#arquitectura)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Requisitos previos](#requisitos-previos)
5. [Variables de entorno](#variables-de-entorno)
6. [Puesta en marcha desde cero](#puesta-en-marcha-desde-cero)
7. [Scripts disponibles](#scripts-disponibles)
8. [Pruebas](#pruebas)
9. [Build de producción](#build-de-producción)
10. [Contrato de la API](#contrato-de-la-api)
11. [Modelo funcional y reglas de negocio](#modelo-funcional-y-reglas-de-negocio)
12. [Flujo end-to-end del sistema](#flujo-end-to-end-del-sistema)
13. [Solución de problemas](#solución-de-problemas)

## Stack tecnológico

**Frontend:** React, TypeScript, Vite, Material UI, React Router, TanStack Query, React Hook Form, Context API.

**Backend:** Node.js, Express, TypeScript, Sequelize, JWT, Pino.

**Base de datos:** PostgreSQL.

## Arquitectura

El frontend nunca accede directamente a PostgreSQL: toda interacción con la base de datos pasa exclusivamente por la API.

```
React (apps/web) → Express API (apps/api) → PostgreSQL
```

**Backend:** `Route → Middleware → Controller → Service → Repository → Sequelize → PostgreSQL`

- **Route:** registra endpoints y asocia middlewares. No contiene lógica de negocio ni accede a la base de datos.
- **Middleware:** autenticación, autorización, validación y manejo global de errores.
- **Controller:** recibe la solicitud HTTP, invoca el Service y construye la respuesta.
- **Service:** reglas de negocio, flujo de estados, permisos y orquestación.
- **Repository:** única capa que consulta Sequelize/PostgreSQL.

**Frontend:** `Pages → Components → Hooks → Services → API`

- **Pages:** representan una pantalla y coordinan componentes.
- **Components:** elementos de interfaz reutilizables, sin lógica de negocio.
- **Hooks:** comportamiento reutilizable (por ejemplo, consultas y mutaciones de TanStack Query).
- **Services:** consumen la API y transforman las respuestas.

**Gestión de estado en el frontend:**

| Herramienta | Uso |
|---|---|
| Context API | Sesión |
| TanStack Query | Estado remoto |
| React Hook Form | Formularios |
| `useState` | Estado local |

## Estructura del proyecto

```
fullStackGoPass/
├── apps/
│   ├── api/                  # Backend Express + TypeScript + Sequelize
│   │   ├── migrations/       # Migraciones SQL versionadas
│   │   ├── scripts/          # migrate.ts, seed-admin.ts
│   │   ├── src/
│   │   │   ├── config/       # env, logger (Pino)
│   │   │   ├── controllers/
│   │   │   ├── database/     # conexión Sequelize
│   │   │   ├── middlewares/
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── tests/            # pruebas de integración (node:test) contra PostgreSQL real
│   └── web/                  # Frontend React + TypeScript + Vite
│       └── src/
│           ├── pages/
│           ├── components/
│           ├── hooks/
│           ├── services/
│           ├── api/           # cliente HTTP genérico
│           ├── contexts/      # sesión (Context API)
│           └── router/        # rutas y guardas de ruta
├── docker-compose.yml         # PostgreSQL para desarrollo local
├── INSTRUCTIONS.md            # alcance, stack y reglas de negocio cerradas
├── PLAN.md                    # plan de implementación por fases
└── package.json               # scripts orquestadores (workspaces npm)
```

## Requisitos previos

- Node.js 20 o superior (verificado con Node 26).
- npm 10 o superior.
- Docker (para levantar PostgreSQL localmente). Alternativamente, cualquier instancia de PostgreSQL 16 accesible.

## Variables de entorno

El backend (`apps/api`) lee las siguientes variables de entorno. Todas tienen un valor por defecto pensado para desarrollo local, por lo que **no es obligatorio crear un archivo `.env`** para levantar el proyecto con la configuración por defecto.

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgres://postgres:postgres@localhost:5432/fullstack_gopass` |
| `PORT` | Puerto donde escucha la API | `3001` |
| `JWT_SECRET` | Secreto usado para firmar los tokens JWT | `change-this-secret` |
| `JWT_EXPIRES_IN` | Vigencia del token JWT | `12h` |
| `APP_NAME` | Nombre usado en los logs de Pino | `fullstack-gopass-api` |
| `NODE_ENV` | Entorno de ejecución (`development` \| `production`) | `development` |
| `ADMIN_ACCESS_IDENTIFIER` | Identificador del administrador inicial creado por el seed | `admin` |
| `ADMIN_NAME` | Nombre del administrador inicial | `Administrador Inicial` |
| `ADMIN_PROFILE` | Perfil profesional del administrador inicial | `Administrador` |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial | `admin1234` |

Para sobrescribir alguna, crear un archivo `apps/api/.env` (ignorado por git) o exportarlas en la sesión de terminal antes de ejecutar los scripts. Si se usa un archivo `.env`, cargarlo con la herramienta de tu preferencia (por ejemplo `node --env-file=.env`) al invocar los scripts de `apps/api`.

El frontend (`apps/web`) no requiere variables de entorno: en desarrollo, Vite redirige las peticiones a `/api/*` hacia `http://localhost:3001` mediante un proxy configurado en `vite.config.ts`.

**Importante:** el `JWT_SECRET` y el `ADMIN_PASSWORD` por defecto son únicamente para desarrollo local. Cambiarlos antes de cualquier despliegue real.

## Puesta en marcha desde cero

Estos pasos permiten levantar el proyecto completo partiendo de un clon limpio del repositorio.

### 1. Instalar dependencias

```bash
npm install --prefix apps/api
npm install --prefix apps/web
```

### 2. Levantar PostgreSQL con Docker

```bash
docker compose up -d
```

Esto crea un contenedor PostgreSQL 16 con la base de datos `fullstack_gopass`, usuario `postgres` y contraseña `postgres`, publicado en el puerto `5432`, con un volumen nombrado (`db-data`) que persiste los datos entre reinicios.

Para verificar que está arriba:

```bash
docker compose ps
```

### 3. Ejecutar migraciones y seed del administrador inicial

```bash
npm run db:setup --prefix apps/api
```

Este comando ejecuta, en orden:

1. `db:migrate`: aplica todas las migraciones SQL en `apps/api/migrations/`, dejando registro de cuáles ya se aplicaron en la tabla `schema_migrations` (es seguro ejecutarlo varias veces).
2. `db:seed:admin`: crea el usuario administrador inicial (`admin` / `admin1234` por defecto) únicamente si no existe.

### 4. Levantar el backend y el frontend

En dos terminales separadas, desde la raíz del repositorio:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

- API disponible en `http://localhost:3001` (verificar con `GET http://localhost:3001/api/health`).
- Frontend disponible en `http://localhost:5173`.

### 5. Iniciar sesión

Abrir `http://localhost:5173` e iniciar sesión con el administrador inicial creado por el seed (`admin` / `admin1234` con la configuración por defecto).

## Scripts disponibles

Desde la raíz del repositorio (orquestan ambos workspaces vía npm workspaces):

| Script | Descripción |
|---|---|
| `npm run dev:api` | Levanta el backend en modo desarrollo con recarga automática |
| `npm run dev:web` | Levanta el frontend en modo desarrollo con Vite |
| `npm run build` | Compila backend y frontend para producción |
| `npm run lint` | Ejecuta el linter (backend: `tsc --noEmit`; frontend: `oxlint`) |
| `npm run typecheck` | Verifica tipos en backend y frontend |
| `npm run test` | Ejecuta las pruebas de backend y frontend |

Scripts específicos de `apps/api` (ejecutar con `--prefix apps/api` desde la raíz, o directamente dentro de `apps/api`):

| Script | Descripción |
|---|---|
| `npm run db:migrate` | Aplica las migraciones SQL pendientes |
| `npm run db:seed:admin` | Crea el administrador inicial si no existe |
| `npm run db:setup` | Ejecuta migraciones y seed en un solo paso |
| `npm run start` | Ejecuta el build compilado (`dist/server.js`) |

## Pruebas

Las pruebas del backend (`apps/api/tests`) son de integración: levantan una instancia efímera del servidor Express y ejecutan las consultas contra una base de datos PostgreSQL real. **Requieren que PostgreSQL esté arriba y con las migraciones aplicadas** (pasos 2 y 3 de la puesta en marcha).

```bash
npm run test --prefix apps/api
```

El frontend no cuenta con un runner de pruebas automatizadas propio (decisión de alcance de fases previas, no se agregaron dependencias de testing); su validación funcional se realiza mediante verificación manual guiada por [`DEMO.md`](./DEMO.md).

## Build de producción

```bash
npm run build
```

- `apps/api`: compila TypeScript a `apps/api/dist` (ejecutar luego con `npm run start --prefix apps/api`).
- `apps/web`: genera el bundle estático optimizado en `apps/web/dist`, listo para servir con cualquier servidor de archivos estáticos.

## Contrato de la API

Todas las rutas están montadas bajo el prefijo `/api`. Las rutas protegidas requieren la cabecera `Authorization: Bearer <token>` obtenida en el login.

**Formato estándar de respuesta:**

- Éxito: `{ "data": ... }`
- Error: `{ "error": { "message": "..." } }`

| Método y ruta | Autenticación | Rol | Descripción |
|---|---|---|---|
| `GET /api/health` | No | — | Estado de la API |
| `POST /api/auth/login` | No | — | Inicia sesión con `accessIdentifier` y `password`, devuelve JWT |
| `GET /api/auth/me` | Sí | Cualquiera | Devuelve el usuario autenticado |
| `GET /api/users` | Sí | Admin | Lista usuarios |
| `POST /api/users` | Sí | Admin | Crea un usuario |
| `GET /api/users/:id` | Sí | Admin | Consulta un usuario |
| `PATCH /api/users/:id` | Sí | Admin | Edita un usuario |
| `PATCH /api/users/:id/activate` | Sí | Admin | Activa un usuario |
| `PATCH /api/users/:id/deactivate` | Sí | Admin | Desactiva un usuario |
| `PATCH /api/users/me/password` | Sí | Cualquiera | Cambia la contraseña propia |
| `GET /api/projects` | Sí | Cualquiera | Lista proyectos (admin ve todos; usuario solo con tareas asignadas) |
| `POST /api/projects` | Sí | Admin | Crea un proyecto |
| `GET /api/projects/:id` | Sí | Cualquiera | Consulta un proyecto |
| `PATCH /api/projects/:id` | Sí | Admin | Edita un proyecto |
| `PATCH /api/projects/:id/archive` | Sí | Admin | Archiva un proyecto (comentario obligatorio) |
| `DELETE /api/projects/:id` | Sí | Admin | Elimina lógicamente un proyecto archivado (comentario obligatorio) |
| `GET /api/projects/:id/comments` | Sí | Cualquiera | Lista comentarios de un proyecto |
| `POST /api/projects/:id/comments` | Sí | Cualquiera | Crea un comentario en un proyecto |
| `GET /api/projects/:projectId/tasks` | Sí | Cualquiera | Lista tareas de un proyecto (`open` solo visible para admin) |
| `POST /api/projects/:projectId/tasks` | Sí | Admin | Crea una tarea (inicia en `open`) |
| `GET /api/tasks/:id` | Sí | Cualquiera | Consulta una tarea |
| `PATCH /api/tasks/:id` | Sí | Admin | Edita una tarea |
| `PATCH /api/tasks/:id/assign` | Sí | Admin | Asigna/reasigna un usuario (pasa a `to_do`; comentario obligatorio si estaba `finished`) |
| `PATCH /api/tasks/:id/unassign` | Sí | Admin | Desasigna (vuelve a `open`; comentario obligatorio si estaba `finished`) |
| `PATCH /api/tasks/:id/state` | Sí | Admin o usuario asignado | Cambia el estado (comentario obligatorio al reabrir una tarea `finished`) |
| `DELETE /api/tasks/:id` | Sí | Admin | Elimina lógicamente una tarea (comentario obligatorio) |
| `GET /api/tasks/:id/comments` | Sí | Cualquiera | Lista comentarios de una tarea |
| `POST /api/tasks/:id/comments` | Sí | Cualquiera | Crea un comentario en una tarea |
| `GET /api/dashboard` | Sí | Admin | Indicadores calculados dinámicamente |

## Modelo funcional y reglas de negocio

Ver el detalle completo en [`INSTRUCTIONS.md`](./INSTRUCTIONS.md). Resumen operativo:

**Roles**

- **Administrador:** administra usuarios, proyectos, tareas, comentarios y dashboard; puede modificar cualquier tarea, cambiar prioridades, asignar usuarios, archivar y eliminar proyectos archivados.
- **Usuario:** inicia sesión, cambia su contraseña, visualiza únicamente proyectos donde tenga tareas asignadas, visualiza todas las tareas de esos proyectos, cambia el estado de sus propias tareas y crea comentarios.

**Estados de proyecto:** `planned → active → on_hold → completed`, y `archived` (eliminación lógica solo desde `archived`).

**Estados de tarea y transiciones:**

- Toda tarea nueva inicia en `open`.
- Solo los administradores visualizan tareas en `open`.
- Asignar un usuario → pasa automáticamente a `to_do`.
- Desasignar → vuelve a `open`.
- Solo puede finalizar (`finished`) desde `testing` o `qa`.
- Reabrir una tarea `finished` (cambiar su estado o reasignarla) exige un comentario obligatorio.

**Prioridades:** `urgent`, `high`, `medium`, `low`.

**Comentarios:** admitidos en proyectos y tareas; no se editan ni se eliminan; conservan autor y fecha; son obligatorios para reabrir tareas, eliminar tareas, archivar proyectos y eliminar proyectos.

**Eliminación lógica:** todas las entidades principales usan `created_at`, `updated_at`, `archived_at` y `deleted_at`; nunca se realiza un `DELETE` físico.

**Dashboard (siempre calculado dinámicamente, nunca persistido):** proyectos activos, progreso por proyecto, distribución de tareas por estado, carga de trabajo por usuario, tareas próximas a vencer y tareas vencidas.

## Flujo end-to-end del sistema

1. Un administrador inicia sesión (`/login`) y accede a la aplicación autenticada por JWT.
2. El administrador crea usuarios (`/users`) para su equipo.
3. El administrador crea un proyecto (`/projects`) y, dentro de él, crea tareas (nacen en estado `open`, visibles solo para administradores).
4. El administrador asigna una tarea a un usuario: la tarea pasa a `to_do` y se vuelve visible para ese usuario dentro del proyecto.
5. El usuario asignado inicia sesión, ve el proyecto (porque tiene una tarea asignada en él) y avanza el estado de su tarea (`to_do → in_process → testing/qa`).
6. Un administrador finaliza la tarea desde `testing` o `qa`.
7. Reabrir esa tarea (cambiar su estado o reasignarla) exige dejar un comentario obligatorio, que queda registrado con autor y fecha.
8. En cualquier punto, administrador o usuario asignado pueden comentar en el proyecto o en la tarea.
9. El administrador consulta el dashboard (`/dashboard`) y ve indicadores recalculados en tiempo real: proyectos activos, progreso por proyecto, distribución de tareas, carga por usuario, tareas próximas a vencer y vencidas.
10. Un proyecto solo puede archivarse (con comentario obligatorio) y, una vez archivado, eliminarse lógicamente (también con comentario obligatorio).

Ver [`DEMO.md`](./DEMO.md) para el guion paso a paso con datos concretos.

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| La API no conecta a la base de datos | PostgreSQL no está arriba | `docker compose up -d` y verificar `docker compose ps` |
| Las pruebas de `apps/api` fallan por conexión | Migraciones no aplicadas o Postgres apagado | `npm run db:setup --prefix apps/api` con Postgres arriba |
| El frontend no puede llamar a la API en desarrollo | Backend no está corriendo en el puerto `3001` | Levantar `npm run dev:api` antes que `npm run dev:web` |
| Error 401 al usar la API | Token ausente, expirado o usuario inactivo | Iniciar sesión nuevamente desde `/login` |
| No se puede desactivar un administrador | Es el único administrador activo (regla de negocio) | Activar/crear otro administrador antes de desactivar este |
