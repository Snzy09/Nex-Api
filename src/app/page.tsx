'use client';
import { SidebarPage } from "@/components/sidebar-page";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
    const breadcrumbs = [{ label: "Dashboard" }];
    return (
        <SidebarPage breadcrumbs={breadcrumbs}>
            <Dashboard />
        </SidebarPage>
    );
}
