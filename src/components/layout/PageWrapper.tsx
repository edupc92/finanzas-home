interface PageWrapperProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export function PageWrapper({ title, subtitle, action, children }: PageWrapperProps) {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}
