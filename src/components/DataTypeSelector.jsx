import React, { useState } from "react";

export function DataTypeSelector({ options, setCheckedState, checkedState}) {
  
  const handleOnChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    );
    setCheckedState(updatedCheckedState);
  };

  return (
    <fieldset className="border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">Type of Data</legend>
      <div className="space-y-5">
        {options.map((item, index) => (
          <div
            className="relative flex items-start"
            key={index}
          >
            <div className="flex h-6 items-center">
              <input
                id={`custom-checkbox-${index}`}
                aria-describedby={`${item.name}-description`}
                name={item.name}
                value={item.name}
                checked={checkedState[index]}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                onChange={() => handleOnChange(index)}
              />
            </div>
            <div className="ml-3 text-base leading-6">
              <label
                htmlFor={`custom-checkbox-${index}`}
                className="font-medium text-gray-900"
              >
                {item.label}
              </label>
              <p id={`${item.name}-description`} className="text-gray-500">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
