import React, { useState } from "react";

export function DataTypeSelector({ options, setCheckedState, checkedState }) {
  const handleOnChange = (e) => {
    setCheckedState(e.target.value);
  };

  return (
    <fieldset className="border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">Type of Data</legend>
      <div className="space-y-5">
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
