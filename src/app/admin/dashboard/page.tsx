"use client";

import AdminTable from "@/components/AdminTable";

export default function AdminDashboardPage() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdminTable />
      </div>
    </section>
  );
}
