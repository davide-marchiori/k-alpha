import React from "react";
import {
  MenuCISize,
  //MenuBootstrapSampleSize,
  MenuBootstrapIterations,
} from "@/components";

export function Bootstrap() {
  return (
    <fieldset className="flex border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">Confidence Interval</legend>
      <div className="p-2">
        <MenuCISize />
      </div>
      {/* <div className="p-2">
        <MenuBootstrapSampleSize />
      </div> */}
      <div className="p-2">
        <MenuBootstrapIterations />
      </div>
      <div className="space-y-5"></div>
    </fieldset>
  );
}
