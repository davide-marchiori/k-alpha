"use client";
import { SessionParamsContextProvider } from "@/helpers";
import { DataTypeSelector, DropZone, Bootstrap, Output } from "@/components";
import { options } from "../constants/options";

export default function Home() {
  return (
    <main className="bg-white p-5">
      <SessionParamsContextProvider>
        <DropZone />
        <DataTypeSelector options={options} />
        <Bootstrap />
        <Output />
      </SessionParamsContextProvider>
      <div className="grid justify-items-end m-3">
        <p></p>
        <p className="test-sm text-gray-400">v1.0</p>
      </div>
    </main>
  );
}
