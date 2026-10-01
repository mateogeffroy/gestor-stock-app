import Link from "next/link"

// Contenedor común de login / recuperar / nueva contraseña
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/login" className="mb-8 flex items-center gap-2 text-muted-foreground">
          <img src="/icon.svg" alt="" className="h-6 w-6" />
          <span className="font-display text-lg font-bold">Mi comercio</span>
        </Link>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-sm">{footer}</div>}
      </div>
    </div>
  )
}

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {shown ? "Ocultar" : "Mostrar"}
    </button>
  )
}
