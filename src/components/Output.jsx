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
    if (data.length > 0 && checkedState !== "") {
      // These min and max values use the more reliable reduce function
      // filter((x) => x)) removes all empty values
      // Does not unse the min and max functions because they are not reliable
      //console.log("data: ", data);
      const minRate = data
        .flat()
        .filter((x) => x)
        .reduce(function (p, v) {
          return p < v ? p : v;
        });
      const maxRate = data
        .flat()
        .filter((x) => x)
        .reduce(function (p, v) {
          return p > v ? p : v;
        });

      //console.log("min rate: ", minRate);
      //console.log("max rate: ", maxRate);

      // This matrix gives the distribution of raters by unit (row) and by category (column)
      // The last column counts the number of empty values
      // It does not include rows with one or less coders
      const countMatrix = countOccurrencesInRange(data, minRate, maxRate);
      //console.log("occurrencesInArrays: ", countMatrix);

      const sumsByRow = countMatrix
        .map((row) => row.slice(0, -1))
        .map((row) => row.reduce((a, b) => a + b, 0));

      // Average number of observers per unit - 𝑟̅
      const r_bar = sumsByRow.reduce((a, b) => a + b, 0) / sumsByRow.length;

      // Probability 𝜋𝑘 that a randomly selected observer will classify any given unit into category 𝑘
      // Vector of length max - min + 1
      const pie_k = countMatrix
        .reduce((acc, val) => acc.map((v, i) => v + val[i]))
        .map((v) => v / countMatrix.length)
        .map((x) => x / r_bar);

      //console.log("pie_k probabilities: ", pie_k);
      const p_a = [
        // Nominal scale
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
                  (r_bar * (sumsByRow[rowIndex] - 1))
              );
          })
          .map((row) => row.reduce((a, b) => a + b, 0)) // Sum of each row
          .reduce((a, b) => a + b, 0) / countMatrix.length, // Sum of all row sums divided by the number of rows
        // Ordinal scale
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
                        (acc, cur, i) =>
                          acc +
                          cur *
                            (i === colIndex
                              ? 1
                              : 1 -
                                ((Math.max(colIndex, i) -
                                  Math.min(colIndex, i) +
                                  1) *
                                  (Math.max(colIndex, i) -
                                    Math.min(colIndex, i))) /
                                  (countMatrix[rowIndex].slice(0, -1).length *
                                    (countMatrix[rowIndex].slice(0, -1).length -
                                      1))),
                        0
                      ) -
                      1)) /
                  (r_bar * (sumsByRow[rowIndex] - 1))
              );
          })
          .map((row) => row.reduce((a, b) => a + b, 0)) // Sum of each row
          .reduce((a, b) => a + b, 0) / countMatrix.length, // Sum of all row sums divided by the number of rows
        // Interval scale
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
                        (acc, cur, i) =>
                          acc +
                          cur *
                            (i === colIndex
                              ? 1
                              : 1 -
                                Math.pow(colIndex - i, 2) /
                                  Math.pow(maxRate - minRate, 2)),
                        0
                      ) -
                      1)) /
                  (r_bar * (sumsByRow[rowIndex] - 1))
              );
          })
          .map((row) => row.reduce((a, b) => a + b, 0)) // Sum of each row
          .reduce((a, b) => a + b, 0) / countMatrix.length, // Sum of all row sums divided by the number of rows
        // Ratio scale
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
                        (acc, cur, i) =>
                          acc +
                          cur *
                            (i === colIndex
                              ? 1
                              : 1 -
                                Math.pow(colIndex - i, 2) /
                                  Math.pow(colIndex + i, 2)),
                        0
                      ) -
                      1)) /
                  (r_bar * (sumsByRow[rowIndex] - 1))
              );
          })
          .map((row) => row.reduce((a, b) => a + b, 0)) // Sum of each row
          .reduce((a, b) => a + b, 0) / countMatrix.length, // Sum of all row sums divided by the number of rows
      ];
      const p_e = [
        // Nominal scale
        pie_k
          .map((x, idx1) =>
            pie_k
              .map((y, idx2) => x * y * (idx1 === idx2 ? 1 : 0))
              .reduce((a, b) => a + b, 0)
          )
          .reduce((a, b) => a + b, 0),
        // Ordinal scale
        pie_k
          .map((x, idx1) =>
            pie_k
              .map(
                (y, idx2) =>
                  x *
                  y *
                  (idx1 === idx2
                    ? 1
                    : 1 -
                      ((Math.max(idx1, idx2) - Math.min(idx1, idx2) + 1) *
                        (Math.max(idx1, idx2) - Math.min(idx1, idx2))) /
                        (countMatrix[0].slice(0, -1).length *
                          (countMatrix[0].slice(0, -1).length - 1)))
              )
              .reduce((a, b) => a + b, 0)
          )
          .reduce((a, b) => a + b, 0),
        // Interval scale
        pie_k
          .map((x, idx1) =>
            pie_k
              .map(
                (y, idx2) =>
                  x *
                  y *
                  (idx1 === idx2
                    ? 1
                    : 1 -
                      Math.pow(idx1 - idx2, 2) / Math.pow(maxRate - minRate, 2))
              )
              .reduce((a, b) => a + b, 0)
          )
          .reduce((a, b) => a + b, 0),
        // Ratio scale
        pie_k
          .map((x, idx1) =>
            pie_k
              .map(
                (y, idx2) =>
                  x *
                  y *
                  (idx1 === idx2
                    ? 1
                    : 1 - Math.pow(idx1 - idx2, 2) / Math.pow(idx1 + idx2, 2))
              )
              .reduce((a, b) => a + b, 0)
          )
          .reduce((a, b) => a + b, 0),
      ];

      setOutput({
        minRate: minRate,
        maxRate: maxRate,
        cases: countMatrix.length,
        rowSum: sumsByRow.reduce((a, b) => a + b, 0) / sumsByRow.length,
        pie_k: pie_k,
        p_a: p_a,
        p_e: p_e,
        k_alpha:
          checkedState === "nominal"
            ? ((p_a[0] - p_e[0]) / (1 - p_e[0])).toFixed(3)
            : checkedState === "ordinal"
            ? ((p_a[1] - p_e[1]) / (1 - p_e[1])).toFixed(3)
            : checkedState === "interval"
            ? ((p_a[2] - p_e[2]) / (1 - p_e[2])).toFixed(3)
            : checkedState === "ratio"
            ? ((p_a[3] - p_e[3]) / (1 - p_e[3])).toFixed(3)
            : "",
      });
    }
  }, [data, checkedState]);

  return (
    <fieldset className="border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">Output</legend>
      {data.length === 0 && <p>Upload a datafile</p>}
      {checkedState === "" && <p>Select the type of data</p>}
      {data.length > 0 && checkedState !== "" && (
        <>
          <p>
            Min rate: <b>{output.minRate}</b>
          </p>
          <p>
            Max rate: <b>{output.maxRate}</b>
          </p>
          <p>
            Number of items considered: <b>{output.cases}</b>
          </p>
          {
            <p>
              Krippendorf's-alpha (<i>{checkedState}</i>):{" "}
              <b>{output.k_alpha}</b>
            </p>
          }
        </>
      )}
    </fieldset>
  );
}
