export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold tracking-tight">
            HogarFin
          </span>
          <p className="mt-1 text-sm text-muted-foreground">
            Finanzas del hogar, en un solo lugar.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
