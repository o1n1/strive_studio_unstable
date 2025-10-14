import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";

export const metadata = {
  title: "Strive Studio - No Limits, Just Power",
  description: "Sistema de gestión para Strive Studio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}