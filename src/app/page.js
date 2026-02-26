"use client";
import { SessionParamsContextProvider } from "@/helpers";
import { DataTypeSelector, DropZone, Bootstrap, Result } from "@/components";

export default function Home() {
  return (
    <main className="bg-white p-5">
      <SessionParamsContextProvider>
        <DropZone />
        <DataTypeSelector />
        <Bootstrap />
        <Result />
      </SessionParamsContextProvider>
      <div className="grid justify-items-end m-3">
        <p></p>
        <p className="text-sm text-gray-400">v2.0</p>
      </div>
    </main>
  );
}
