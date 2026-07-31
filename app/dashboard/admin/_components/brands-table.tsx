"use client";

import { useState } from "react";

export interface BrandRow {
  id: string;
  name: string;
  companyName: string;
  workEmail: string;
  industryCategory: string;
  city: string;
  signedUp: string;
}

export function BrandsTable({ rows }: { rows: BrandRow[] }) {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = query
    ? rows.filter(
        (row) =>
          row.name.toLowerCase().includes(query) ||
          row.companyName.toLowerCase().includes(query),
      )
    : rows;

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name or company..."
        className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
      />
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Work Email</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Signed Up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3 text-gray-600">{row.companyName}</td>
                <td className="px-4 py-3 text-gray-600">{row.workEmail}</td>
                <td className="px-4 py-3 text-gray-600">{row.industryCategory}</td>
                <td className="px-4 py-3 text-gray-600">{row.city}</td>
                <td className="px-4 py-3 text-gray-600">{row.signedUp}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No matching brands.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
