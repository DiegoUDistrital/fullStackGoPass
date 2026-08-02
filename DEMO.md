# Guion de demostración

Guion para demostrar el flujo funcional completo del Sistema de Gestión de Proyectos y Tareas. Requiere el proyecto levantado según [`README.md`](./README.md) (PostgreSQL arriba, migraciones y seed aplicados, backend en `http://localhost:3001` y frontend en `http://localhost:5173`).

## 1. Presentación del problema

Una organización necesita gestionar proyectos y las tareas asociadas, con dos roles:

- **Administrador:** controla el ciclo de vida completo de usuarios, proyectos y tareas, y consulta indicadores de avance en un dashboard.
- **Usuario estándar:** solo ve los proyectos donde tiene tareas asignadas y avanza el estado de sus propias tareas.

Las reglas de negocio clave a resaltar durante la demo:

- Toda tarea nace en `open`, visible únicamente para administradores.
- Asignar una tarea la pasa automáticamente a `to_do`; desasignarla la regresa a `open`.
- Una tarea solo puede finalizarse desde `testing` o `qa`.
- Reabrir una tarea finalizada exige un comentario obligatorio (trazabilidad de por qué se reabrió).
- Los comentarios nunca se editan ni se eliminan.
- El dashboard se calcula en tiempo real, nunca se persisten métricas.

## 2. Arquitectura (resumen visual)

```
React (Pages → Components → Hooks → Services → API)
        ↓ HTTP (JWT)
Express (Route → Middleware → Controller → Service → Repository)
        ↓ Sequelize
PostgreSQL
```

El frontend nunca accede a la base de datos directamente; toda regla de negocio vive en el backend.

## 3. Guion paso a paso

### Paso 1 — Login como administrador

1. Abrir `http://localhost:5173`.
2. Iniciar sesión con `admin` / `admin1234` (valores por defecto del seed).
3. Mostrar la barra de navegación: Inicio, Proyectos, Usuarios, Dashboard, Cambiar contraseña.

**Punto a resaltar:** intentar acceder a `http://localhost:5173/dashboard` sin sesión iniciada (en una ventana privada) y mostrar que redirige a `/login`.

### Paso 2 — Gestión de usuarios

1. Ir a **Usuarios → Crear usuario**.
2. Crear un usuario estándar, por ejemplo: identificador `demo.user`, nombre "Usuario Demo", perfil "QA", contraseña, rol "Usuario".
3. Mostrar que puede editarse y desactivarse/activarse.

**Punto a resaltar:** intentar desactivar el único administrador activo (el propio `admin` si es el único) y mostrar el mensaje de error — no se puede dejar la aplicación sin administradores activos.

### Paso 3 — Crear un proyecto

1. Ir a **Proyectos → Crear proyecto**.
2. Completar nombre, descripción, ETA y estado "Activo".
3. Abrir el proyecto creado.

### Paso 4 — Crear y asignar una tarea

1. Dentro del proyecto, **Crear tarea** (título, descripción, prioridad, fecha límite). La tarea nace en estado **Abierta**.
2. Mostrar que, como administrador, la tarea es visible; explicar que un usuario estándar no la vería todavía porque está en `open`.
3. **Asignar** la tarea al usuario creado en el paso 2. El estado cambia automáticamente a **Por hacer**.

### Paso 5 — Avanzar el flujo de estados

1. **Cambiar estado** de la tarea: Por hacer → En proceso → Testing (o QA).
2. Intentar finalizar directamente desde otro estado que no sea Testing/QA y mostrar que no está disponible como opción — solo se puede finalizar desde Testing o QA.
3. Cambiar el estado a **Finalizada** desde Testing/QA.

### Paso 6 — Reapertura con comentario obligatorio

1. Con la tarea en **Finalizada**, abrir **Cambiar estado** (o **Reasignar**/**Desasignar**) y elegir un nuevo estado.
2. Intentar confirmar sin escribir un comentario: mostrar el error "El comentario es obligatorio".
3. Escribir un comentario y confirmar: la tarea cambia de estado y el comentario queda visible con autor y fecha en la sección de comentarios.

### Paso 7 — Comentarios en proyecto y tarea

1. Agregar un comentario libre en la tarea y en el proyecto (fuera del flujo de reapertura).
2. Mostrar que quedan listados con autor y fecha, y que no hay opción de editar ni eliminar.

### Paso 8 — Vista del usuario estándar

1. Cerrar sesión e iniciar sesión con el usuario creado en el paso 2.
2. Mostrar que el menú no incluye "Usuarios" ni "Dashboard".
3. Mostrar que en **Proyectos** solo aparece el proyecto donde tiene una tarea asignada.
4. Entrar al proyecto y mostrar que puede ver la tarea (aunque no esté asignada a él si el proyecto es visible) y cambiar el estado de las tareas propias.
5. Cerrar sesión y volver a entrar como `admin`.

### Paso 9 — Dashboard

1. Ir a **Dashboard**.
2. Recorrer cada indicador y explicar que se recalcula en cada consulta:
   - **Proyectos activos.**
   - **Progreso por proyecto** (tareas finalizadas / total de tareas del proyecto).
   - **Distribución de tareas** por estado.
   - **Carga de trabajo por usuario** (tareas pendientes, no finalizadas).
   - **Tareas próximas a vencer** (dentro de los próximos 7 días).
   - **Tareas vencidas** (fecha límite pasada y no finalizada).

### Paso 10 — Ciclo de vida del proyecto

1. Volver a **Proyectos** e intentar **Archivar** el proyecto sin comentario: mostrar el error.
2. Archivar con comentario: el proyecto pasa a estado **Archivado**.
3. **Eliminar** el proyecto archivado (comentario obligatorio): eliminación lógica, el proyecto deja de listarse pero no se borra físicamente de la base de datos.

## 4. Cierre

- Repasar que toda regla de negocio (estados, permisos, comentarios obligatorios) se valida en el backend, y que el frontend solo refleja esas reglas como ayuda de experiencia de usuario.
- Mencionar la suite de pruebas de integración del backend (`npm run test --prefix apps/api`), que cubre autenticación, usuarios, proyectos, tareas, comentarios, dashboard y manejo de errores contra una base de datos PostgreSQL real.
