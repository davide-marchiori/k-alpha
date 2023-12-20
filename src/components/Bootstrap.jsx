import React from "react";
import {
  MenuCISize,
  //MenuBootstrapSampleSize,
  MenuBootstrapIterations,
} from "@/components";

export function Bootstrap() {
  return (
    <fieldset className="flex border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">
        <b>Confidence Interval (CI)</b>
      </legend>
      <div className="m-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-5">
        <div>
          <MenuCISize />
        </div>
        <div>
          <MenuBootstrapIterations />
        </div>
      </div>
    </fieldset>
  );
}
