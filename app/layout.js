import "./globals.css";

export const metadata = {
  title: "Strive Studio - No Limits, Just Power",
  description: "Sistema de gestión para Strive Studio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}