import crypto from "node:crypto"
import { Client } from "pg"
import { hashPassword } from "../src/utils/password"

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/fullstack_gopass"

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo1234"

const DEFAULT_ADMIN = {
  accessIdentifier: process.env.ADMIN_ACCESS_IDENTIFIER ?? "admin",
  name: process.env.ADMIN_NAME ?? "Administrador Inicial",
  professionalProfile: process.env.ADMIN_PROFILE ?? "Administrador",
  password: process.env.ADMIN_PASSWORD ?? "admin1234"
}

function daysFromNow(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

const EXTRA_ADMINS = [
  {
    accessIdentifier: "laura.admin",
    name: "Laura Fernández",
    professionalProfile: "Administradora",
    password: "admin1234"
  }
] as const

const STANDARD_USERS = [
  { accessIdentifier: "carlos.ruiz", name: "Carlos Ruiz", professionalProfile: "Desarrollador Backend" },
  { accessIdentifier: "maria.gomez", name: "María Gómez", professionalProfile: "Desarrolladora Frontend" },
  { accessIdentifier: "juan.lopez", name: "Juan López", professionalProfile: "QA" },
  { accessIdentifier: "ana.torres", name: "Ana Torres", professionalProfile: "DevOps" },
  { accessIdentifier: "pedro.diaz", name: "Pedro Díaz", professionalProfile: "Diseñador UX" }
] as const

const PROJECTS = [
  {
    key: "portal-clientes",
    name: "Portal de Clientes",
    description: "Portal web para que los clientes consulten el estado de sus servicios.",
    state: "active",
    responsibleAdmin: "admin",
    etaInDays: 75
  },
  {
    key: "app-ventas",
    name: "App Móvil de Ventas",
    description: "Aplicación móvil para que el equipo comercial gestione oportunidades en campo.",
    state: "planned",
    responsibleAdmin: "laura.admin",
    etaInDays: 120
  },
  {
    key: "migracion-infra",
    name: "Migración de Infraestructura",
    description: "Migración de servidores on-premise a la nube.",
    state: "on_hold",
    responsibleAdmin: "laura.admin",
    etaInDays: 60
  },
  {
    key: "reportes-financieros",
    name: "Sistema de Reportes Financieros",
    description: "Módulo de generación de reportes financieros mensuales.",
    state: "completed",
    responsibleAdmin: "admin",
    etaInDays: -30
  }
] as const

const TASKS = [
  {
    project: "portal-clientes",
    title: "Diseñar wireframes del portal",
    description: "Wireframes de las pantallas principales del portal de clientes.",
    priority: "medium",
    state: "finished",
    assignee: "pedro.diaz",
    dueInDays: -20
  },
  {
    project: "portal-clientes",
    title: "Implementar autenticación de clientes",
    description: "Login y recuperación de contraseña para clientes finales.",
    priority: "high",
    state: "testing",
    assignee: "carlos.ruiz",
    dueInDays: 3
  },
  {
    project: "portal-clientes",
    title: "Conectar API de facturación",
    description: "Integración con el sistema de facturación existente.",
    priority: "urgent",
    state: "in_process",
    assignee: "carlos.ruiz",
    dueInDays: -8
  },
  {
    project: "portal-clientes",
    title: "Pruebas de aceptación con clientes piloto",
    description: "Sesión de pruebas guiadas con clientes piloto.",
    priority: "medium",
    state: "to_do",
    assignee: "juan.lopez",
    dueInDays: 18
  },
  {
    project: "app-ventas",
    title: "Definir alcance del MVP",
    description: "Documento de alcance funcional para la primera versión.",
    priority: "high",
    state: "open",
    assignee: null,
    dueInDays: 13
  },
  {
    project: "app-ventas",
    title: "Prototipo de navegación",
    description: "Prototipo navegable de los flujos principales.",
    priority: "low",
    state: "qa",
    assignee: "maria.gomez",
    dueInDays: 2
  },
  {
    project: "app-ventas",
    title: "Investigación de mercado",
    description: "Benchmark de aplicaciones similares en el mercado.",
    priority: "medium",
    state: "on_hold",
    assignee: "ana.torres",
    dueInDays: 30
  },
  {
    project: "migracion-infra",
    title: "Inventario de servidores actuales",
    description: "Levantamiento del inventario completo de servidores on-premise.",
    priority: "high",
    state: "finished",
    assignee: "ana.torres",
    dueInDays: -45
  },
  {
    project: "migracion-infra",
    title: "Plan de rollback",
    description: "Definir el plan de reversión en caso de fallos durante la migración.",
    priority: "urgent",
    state: "open",
    assignee: null,
    dueInDays: -5
  },
  {
    project: "migracion-infra",
    title: "Configurar VPN de sitio a sitio",
    description: "VPN entre el datacenter local y el proveedor cloud.",
    priority: "medium",
    state: "to_do",
    assignee: "pedro.diaz",
    dueInDays: 8
  },
  {
    project: "reportes-financieros",
    title: "Diseño del modelo de datos",
    description: "Modelo de datos para los reportes financieros mensuales.",
    priority: "medium",
    state: "finished",
    assignee: "juan.lopez",
    dueInDays: -60
  },
  {
    project: "reportes-financieros",
    title: "Exportación a PDF",
    description: "Generación de reportes en formato PDF.",
    priority: "low",
    state: "finished",
    assignee: "maria.gomez",
    dueInDays: -40
  },
  {
    project: "reportes-financieros",
    title: "Certificación con auditoría interna",
    description: "Validación de los reportes con el equipo de auditoría.",
    priority: "high",
    state: "finished",
    assignee: "carlos.ruiz",
    dueInDays: -35
  }
] as const

const PROJECT_COMMENTS = [
  {
    project: "portal-clientes",
    author: "admin",
    content: "Kickoff realizado con el cliente, prioridad alta para este trimestre."
  },
  {
    project: "migracion-infra",
    author: "laura.admin",
    content: "Proyecto en pausa por reasignación de presupuesto."
  }
] as const

const TASK_COMMENTS = [
  {
    project: "portal-clientes",
    taskTitle: "Implementar autenticación de clientes",
    author: "carlos.ruiz",
    content: "Listo para revisión, a la espera de QA."
  },
  {
    project: "portal-clientes",
    taskTitle: "Conectar API de facturación",
    author: "admin",
    content: "¿Cuál es el bloqueante? Necesitamos cerrar esto pronto."
  },
  {
    project: "migracion-infra",
    taskTitle: "Inventario de servidores actuales",
    author: "ana.torres",
    content: "Inventario completado y validado con el equipo de infraestructura."
  },
  {
    project: "reportes-financieros",
    taskTitle: "Certificación con auditoría interna",
    author: "juan.lopez",
    content: "Certificación aprobada sin observaciones por auditoría."
  }
] as const

async function run() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Este script borra todos los datos existentes; no puede ejecutarse con NODE_ENV=production.")
  }

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  try {
    await client.query("TRUNCATE TABLE comments, tasks, projects, users RESTART IDENTITY CASCADE")

    const userIds = new Map<string, string>()

    const defaultAdminId = crypto.randomUUID()
    await client.query(
      `INSERT INTO users (id, access_identifier, name, professional_profile, password_hash, role, state)
       VALUES ($1, $2, $3, $4, $5, 'admin', 'active')`,
      [
        defaultAdminId,
        DEFAULT_ADMIN.accessIdentifier,
        DEFAULT_ADMIN.name,
        DEFAULT_ADMIN.professionalProfile,
        hashPassword(DEFAULT_ADMIN.password)
      ]
    )
    userIds.set("admin", defaultAdminId)

    for (const admin of EXTRA_ADMINS) {
      const id = crypto.randomUUID()
      await client.query(
        `INSERT INTO users (id, access_identifier, name, professional_profile, password_hash, role, state)
         VALUES ($1, $2, $3, $4, $5, 'admin', 'active')`,
        [id, admin.accessIdentifier, admin.name, admin.professionalProfile, hashPassword(admin.password)]
      )
      userIds.set(admin.accessIdentifier, id)
    }

    for (const user of STANDARD_USERS) {
      const id = crypto.randomUUID()
      await client.query(
        `INSERT INTO users (id, access_identifier, name, professional_profile, password_hash, role, state)
         VALUES ($1, $2, $3, $4, $5, 'user', 'active')`,
        [id, user.accessIdentifier, user.name, user.professionalProfile, hashPassword(DEMO_PASSWORD)]
      )
      userIds.set(user.accessIdentifier, id)
    }

    const projectIds = new Map<string, string>()
    for (const project of PROJECTS) {
      const id = crypto.randomUUID()
      await client.query(
        `INSERT INTO projects (id, name, description, responsible_admin_id, eta, state, progress_calculated)
         VALUES ($1, $2, $3, $4, $5, $6, 0)`,
        [
          id,
          project.name,
          project.description,
          userIds.get(project.responsibleAdmin),
          daysFromNow(project.etaInDays),
          project.state
        ]
      )
      projectIds.set(project.key, id)
    }

    const taskIds = new Map<string, string>()
    for (const task of TASKS) {
      const id = crypto.randomUUID()
      const assigneeId = task.assignee ? userIds.get(task.assignee) : null
      await client.query(
        `INSERT INTO tasks (id, project_id, assigned_user_id, title, description, priority, state, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          projectIds.get(task.project),
          assigneeId,
          task.title,
          task.description,
          task.priority,
          task.state,
          daysFromNow(task.dueInDays)
        ]
      )
      taskIds.set(`${task.project}:${task.title}`, id)
    }

    for (const comment of PROJECT_COMMENTS) {
      await client.query(
        "INSERT INTO comments (id, project_id, author_user_id, content) VALUES ($1, $2, $3, $4)",
        [crypto.randomUUID(), projectIds.get(comment.project), userIds.get(comment.author), comment.content]
      )
    }

    for (const comment of TASK_COMMENTS) {
      await client.query(
        "INSERT INTO comments (id, task_id, author_user_id, content) VALUES ($1, $2, $3, $4)",
        [
          crypto.randomUUID(),
          taskIds.get(`${comment.project}:${comment.taskTitle}`),
          userIds.get(comment.author),
          comment.content
        ]
      )
    }

    process.stdout.write(
      `Base de datos reiniciada. Datos de demo sembrados: ${EXTRA_ADMINS.length + 1} administradores, ${STANDARD_USERS.length} usuarios estándar, ${PROJECTS.length} proyectos, ${TASKS.length} tareas, ${PROJECT_COMMENTS.length + TASK_COMMENTS.length} comentarios.\n`
    )
  } finally {
    await client.end()
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown demo seed error"
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
