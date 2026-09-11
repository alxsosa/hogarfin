import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-b from-white to-muted/30 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand/oikos-logo-full.png"
            alt="Oikos — Casa Próspera"
            width={1086}
            height={455}
            className="w-64"
            priority
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Finanzas del hogar, en un solo lugar.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
