"use client";
import { SessionParamsContextProvider } from "@/helpers";
import { DataTypeSelector, DropZone, Bootstrap, Output } from "@/components";
//import { options } from "../constants/options";

const options = [
  {
    name: "nominal",
    label: "Nominal",
    description: "Description of nominal data.",
  },
  {
    name: "ordinal",
    label: "Ordinal",
    description: "Description of ordinal data.",
  },
  {
    name: "interval",
    label: "Interval",
    description: "Description of interval data.",
  },
  {
    name: "ratio",
    label: "Ratio",
    description: "Description of ratio data.",
  },
];

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
