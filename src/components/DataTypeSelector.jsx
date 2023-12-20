import React, { useContext } from "react";
import { SessionParamsContext } from "@/helpers";

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

export function DataTypeSelector() {
  const [, sessionParamsDispatch] = useContext(SessionParamsContext);

  const handleOnChange = (e) => {
    sessionParamsDispatch({ type: "setCheckedState", value: e.target.value });
  };

  return (
    <fieldset className="border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">
        <b>Type of Data</b>
      </legend>
      <div className="m-3 grid grid-cols-1 gap-5 sm:grid-cols-4 sm:gap-5 lg:grid-cols-6 xl:grid-cols-10">
        {options.map((option, index) => (
          <div key={index} className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                id={option.name}
                value={option.name}
                aria-describedby={`${option.name}-description`}
                name="options"
                type="radio"
                defaultChecked={option.name === "small"}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                onChange={(e) => handleOnChange(e)}
              />
            </div>
            <div className="ml-3 text-base leading-6">
              <label
                htmlFor={option.name}
                className="font-medium text-gray-900"
              >
                {option.label}
              </label>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
