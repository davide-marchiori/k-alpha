import React, { useEffect, useState } from "react";

export function Output({ data, checkedState }) {
  const [output, setOutput] = useState({});

  // Columns from 0 to (min - max + 1) indicate the number of occurrences of each value in that category
  // Column max + 1 indicates the number of empty values
  const countOccurrencesInRange = (arrays, min, max) => {
    return arrays
      .map((arr) => {
        const counts = Array.from({ length: max - min + 2 }, () => 0);
        arr.forEach((num) => {
          if (num >= min && num <= max && num !== "") {
            counts[num - min]++;
          } else if (num === "") {
            counts[counts.length - 1]++;
          }
        });
        return counts;
      })
      .filter((counts) => {
        const sum = counts
          .slice(0, counts.length - 1)
          .reduce((acc, val) => acc + val, 0);
        return sum > 1;
      });
  };

  useEffect(() => {
    if (data.length > 0 && !checkedState.every((v) => v === false)) {
      // These min and max values use the more reliable reduce function
      // filter((x) => x)) removes all empty values
      console.log("data: ", data);
      const min = Math.min(
        ...data
          .flat()
          .filter((x) => x)
          .reduce(function (p, v) {
            return p < v ? p : v;
          })
      );
      const max = Math.max(
        ...data
          .flat()
          .filter((x) => x)
          .reduce(function (p, v) {
            return p > v ? p : v;
          })
      );

      console.log("min rate: ", min);
      console.log("max: ", max);

      const countMatrix = countOccurrencesInRange(data, min, max);
      console.log("occurrencesInArrays: ", countMatrix);

      const colAvg = countMatrix
        .reduce((acc, val) => acc.map((v, i) => v + val[i]))
        .map((v) => v / countMatrix.length);

      console.log("avg by column: ", colAvg);

      const sumsByRow = countMatrix
        .map((row) => row.slice(0, -1))
        .map((row) => row.reduce((a, b) => a + b, 0));

      const p_ai =
        countMatrix
          .map((row, rowIndex) => {
            return row
              .slice(0, -1)
              .map(
                (val, colIndex) =>
                  (val *
                    (countMatrix[rowIndex]
                      .slice(0, -1)
                      .reduce(
                        (acc, cur, i) => acc + cur * (i === colIndex ? 1 : 0),
                        0
                      ) -
                      1)) /
                  ((sumsByRow.reduce((a, b) => a + b, 0) / sumsByRow.length) *
                    (countMatrix[rowIndex].reduce((acc, curr) => acc + curr) -
                      1))
              );
          })
          .map((row) => row.reduce((a, b) => a + b, 0))
          .reduce((a, b) => a + b, 0) / countMatrix.length;

      const pie = colAvg.map(
        (x) => x / (sumsByRow.reduce((a, b) => a + b, 0) / sumsByRow.length)
      );
      const p_e = pie
        .flatMap((x, i) => pie.slice(i).map((y) => x * y * 2 * (x === y)))
        .reduce((a, b) => a + b, 0);

      setOutput({
        minRate: min,
        maxRate: max,
        avg: colAvg,
        rowSum: sumsByRow.reduce((a, b) => a + b, 0) / sumsByRow.length,
        p_ai: p_ai,
        p_e: p_e,


      });
    }
  }, [data, checkedState]);

  return (
    <fieldset className="border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">Output</legend>
      {data.length === 0 && <p>Upload a datafile</p>}
      {checkedState.every((v) => v === false) && <p>Select the type of data</p>}
      {data.length > 0 && !checkedState.every((v) => v === false) && <p>here's the result: {output.rowSum}</p>}
      {data.length > 0 && !checkedState.every((v) => v === false) && (
        <>
          <p>here's the result: {output.p_ai}</p>
          <p>here's the result: {output.p_e}</p>
          <p>here's the result: {((output.p_ai - output.p_e) / (1 - output.p_e)).toFixed(3)}</p>
        </>
      )}      
    </fieldset>
  );
}
