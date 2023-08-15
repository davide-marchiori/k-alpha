"use client";

import { useState } from "react";
import { DataTypeSelector } from "@/components/DataTypeSelector";
import { DropZone } from "@/components/DropZone";
import { Output } from "@/components/Output";
import { options } from "@/constants/Options";

export default function Home() {
  const [data, setData] = useState([]);
  const [checkedState, setCheckedState] = useState("");

  // console.log("checked state: ", checkedState);
  // console.log("data: ", data);

  return (
    <main className="bg-white p-5">
      <DropZone data={data} setData={setData} />
      <DataTypeSelector
        checkedState={checkedState}
        setCheckedState={setCheckedState}
        options={options}
      />
      <Output data={data} checkedState={checkedState} />
      <div className="grid justify-items-end m-3">
        <p></p>
        <p className="test-sm text-gray-400">v1.0</p>
      </div>
    </main>
  );
}
