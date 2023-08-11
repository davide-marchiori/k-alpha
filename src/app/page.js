"use client";

import { useState } from "react";
import { DataTypeSelector } from "@/components/DataTypeSelector";
import { DropZone } from "@/components/DropZone";
import { Output } from "@/components/Output";
import { options } from "@/constants/Options";

export default function Home() {
  const [data, setData] = useState([]);
  const [checkedState, setCheckedState] = useState("");

  console.log("checked state: ", checkedState);
  console.log("data: ", data);

  return (
    <main className="bg-white p-5">
      <DropZone data={data} setData={setData} />
      <DataTypeSelector
        checkedState={checkedState}
        setCheckedState={setCheckedState}
        options={options}
      />
      <Output data={data} checkedState={checkedState} />
    </main>
  );
}
