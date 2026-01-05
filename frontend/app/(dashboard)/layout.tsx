import ClientLayout from "@/components/ClientLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Aquí es donde vive la Sidebar ahora.
    // Solo afectará a las páginas que metamos dentro de la carpeta (dashboard)
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}