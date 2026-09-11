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
            src="/brand/oikos-mark.png"
            alt=""
            width={56}
            height={56}
            className="mb-2"
            priority
          />
          <span className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Oikos
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
