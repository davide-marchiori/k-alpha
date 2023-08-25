import React, { useEffect, useState, useContext, useCallback } from "react";
import { SessionParamsContext } from "@/helpers";
import { initialSessionParams } from "@/constants";
import { quantile } from "d3-array";

export function Output() {
  const [bucketSessionParams] = useContext(SessionParamsContext);
  const sessionParams = Object.fromEntries(
    bucketSessionParams.map((item) => Object.values(item))
  );
  // console.log("sessionParams: ", sessionParams);
  const [output, setOutput] = useState({});

  // Columns from 0 to (min - max + 1) indicate the number of occurrences of each value in that category
  // Column max + 1 indicates the number of empty values
  const countOccurrencesInRange = useCallback(
    // This matrix gives the distribution of raters by unit (row) and by category (column)
    // The last column counts the number of empty values
    // It does not include rows with one or less coders
    (arrays, min, max) => {
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
    },
    [sessionParams.data]
  );

  // These min and max values use the more reliable reduce function
  // filter((x) => x)) removes all empty values
  // Does not use the min and max functions because they are not reliable
  const _minRate = (data) =>
    data
      .flat()
      .filter((x) => x)
      .reduce(function (p, v) {
        return p < v ? p : v;
      });

  const _maxRate = (data) =>
    data
      .flat()
      .filter((x) => x)
      .reduce(function (p, v) {
        return p > v ? p : v;
      });

  const _pie_k = useCallback(
    (countMatrix, r_bar) =>
      countMatrix
        .reduce((acc, val) => acc.map((v, i) => v + val[i]))
        .map((v) => v / countMatrix.length)
        .map((x) => x / r_bar),
    [sessionParams.data]
  );

  const _p_a = useCallback(
    (countMatrix, r_bar, sumsByRow, maxRate, minRate, checkedState) => {
      switch (checkedState) {
        case "nominal":
          return (
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
                              acc + cur * (i === colIndex ? 1 : 0),
                            0
                          ) -
                          1)) /
                      (r_bar * (sumsByRow[rowIndex] - 1))
                  );
              })
              .map((row) => row.reduce((a, b) => a + b, 0)) // Sum of each row
              .reduce((a, b) => a + b, 0) / countMatrix.length // Sum of all row sums divided by the number of rows
          );
        case "ordinal":
          // Ordinal scale
          return (
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
                                      (countMatrix[rowIndex].slice(0, -1)
                                        .length *
                                        (countMatrix[rowIndex].slice(0, -1)
                                          .length -
                                          1))),
                            0
                          ) -
                          1)) /
                      (r_bar * (sumsByRow[rowIndex] - 1))
                  );
              })
              .map((row) => row.reduce((a, b) => a + b, 0)) // Sum of each row
              .reduce((a, b) => a + b, 0) / countMatrix.length // Sum of all row sums divided by the number of rows
          );

        case "interval":
          // Interval scale
          return (
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
              .reduce((a, b) => a + b, 0) / countMatrix.length // Sum of all row sums divided by the number of rows
          );

        case "ratio":
          // Ratio scale
          return (
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
              .reduce((a, b) => a + b, 0) / countMatrix.length // Sum of all row sums divided by the number of rows
          );

        default:
          break;
      }
    },
    [sessionParams.data]
  );

  const _p_e = useCallback(
    (countMatrix, pie_k, maxRate, minRate, checkedState) => {
      switch (checkedState) {
        case "nominal":
          // Nominal scale
          return pie_k
            .map((x, idx1) =>
              pie_k
                .map((y, idx2) => x * y * (idx1 === idx2 ? 1 : 0))
                .reduce((a, b) => a + b, 0)
            )
            .reduce((a, b) => a + b, 0);

        case "ordinal":
          // Ordinal scale
          return pie_k
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
            .reduce((a, b) => a + b, 0);

        case "interval":
          // Interval scale
          return pie_k
            .map((x, idx1) =>
              pie_k
                .map(
                  (y, idx2) =>
                    x *
                    y *
                    (idx1 === idx2
                      ? 1
                      : 1 -
                        Math.pow(idx1 - idx2, 2) /
                          Math.pow(maxRate - minRate, 2))
                )
                .reduce((a, b) => a + b, 0)
            )
            .reduce((a, b) => a + b, 0);

        case "ratio":
          // Ratio scale
          return pie_k
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
            .reduce((a, b) => a + b, 0);

        default:
          break;
      }
    },
    [sessionParams.data]
  );

  const _k_alpha = (data) => {
    const minRate = _minRate(data);
    const maxRate = _maxRate(data);
    const countMatrix = countOccurrencesInRange(data, minRate, maxRate);
    const sumsByRow = countMatrix
      .map((row) => row.slice(0, -1))
      .map((row) => row.reduce((a, b) => a + b, 0));

    // Average number of observers per unit - 𝑟̅
    const r_bar = sumsByRow.reduce((a, b) => a + b, 0) / sumsByRow.length;

    // Probability 𝜋𝑘 that a randomly selected observer will classify any given unit into category 𝑘
    // Vector of length max - min + 1
    const pie_k = _pie_k(countMatrix, r_bar);

    //console.log("pie_k probabilities: ", pie_k);
    const p_a = _p_a(
      countMatrix,
      r_bar,
      sumsByRow,
      maxRate,
      minRate,
      sessionParams.checkedState
    );
    const p_e = _p_e(
      countMatrix,
      pie_k,
      maxRate,
      minRate,
      sessionParams.checkedState
    );
    return [countMatrix.length, ((p_a - p_e) / (1 - p_e)).toFixed(3)];
  };

  const confidenceInterval = (data, CISize) => {
    const copy = [...data];
    let alpha = 0;
    switch (CISize) {
      case "90% CI":
        alpha = 0.1;
        break;
      case "95% CI":
        alpha = 0.05;
        break;
      case "99% CI":
        alpha = 0.01;
        break;
      default:
        break;
    }
    return [
      quantile(
        copy.sort((a, b) => a - b),
        alpha / 2
      ).toFixed(3),
      quantile(
        copy.sort((a, b) => a - b),
        1 - alpha / 2
      ).toFixed(3),
    ];
  };

  useEffect(() => {
    if (sessionParams.data.length > 0 && sessionParams.checkedState !== "") {
      setOutput({
        minRate: _minRate(sessionParams.data),
        maxRate: _maxRate(sessionParams.data),
        cases: _k_alpha(sessionParams.data)[0],
        k_alpha: _k_alpha(sessionParams.data)[1],
        upper: "",
        lower: "",
      });

      if (
        sessionParams.CISize !==
          initialSessionParams.filter((item) => item.name === "CISize")[0]
            .value &&
        // sessionParams.bootSampleSize !==
        //   initialSessionParams.filter(
        //     (item) => item.name !== "bootSampleSize"
        //   )[0].value &&
        sessionParams.bootIterations !==
          initialSessionParams.filter(
            (item) => item.name === "bootIterations"
          )[0].value
      ) {
        // Bootstrap CI
        const bootSamples =
          sessionParams.bootIterations === "200 Iterations"
            ? drawBootstrapSamples(sessionParams.data, 200)
            : sessionParams.bootIterations === "400 Iterations"
            ? drawBootstrapSamples(sessionParams.data, 400)
            : sessionParams.bootIterations === "600 Iterations"
            ? drawBootstrapSamples(sessionParams.data, 600)
            : drawBootstrapSamples(sessionParams.data, 1000);
        const k_alpha_boot = bootSamples.map((sample) => _k_alpha(sample)[1]);
        const [lower, upper] = confidenceInterval(
          k_alpha_boot,
          sessionParams.CISize
        );
        setOutput({
          minRate: _minRate(sessionParams.data),
          maxRate: _maxRate(sessionParams.data),
          cases: _k_alpha(sessionParams.data)[0],
          k_alpha: _k_alpha(sessionParams.data)[1],
          lower: lower,
          upper: upper,
        });
      }
    }
  }, [
    sessionParams.data,
    sessionParams.checkedState,
    sessionParams.CISize,
    //sessionParams.bootSampleSize,
    sessionParams.bootIterations,
  ]);

  const drawBootstrapSample = (data) => {
    const sample = [];
    const sampleSize = countOccurrencesInRange(
      data,
      _minRate(data),
      _maxRate(data)
    ).length;
    for (let i = 0; i < sampleSize; i++) {
      sample.push(data[Math.floor(Math.random() * data.length)]);
    }
    return sample;
  };

  const drawBootstrapSamples = (data, iterations) => {
    const samples = [];
    for (let i = 0; i < iterations; i++) {
      samples.push(drawBootstrapSample(data));
    }
    return samples;
  };

  // console.log("output: ", output);

  return (
    <fieldset className="border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">Output</legend>
      {sessionParams.data.length === 0 && <p>Upload a datafile</p>}
      {sessionParams.checkedState === "" && <p>Select the type of data</p>}
      {sessionParams.data.length > 0 && sessionParams.checkedState !== "" && (
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
              Krippendorf's-alpha (<i>{sessionParams.checkedState}</i>):{" "}
              <b>{output.k_alpha}</b>
            </p>
          }
        </>
      )}
      {(sessionParams.CISize ===
        initialSessionParams.filter((item) => item.name === "CISize")[0]
          .value ||
        // sessionParams.bootSampleSize ===
        //   initialSessionParams.filter(
        //     (item) => item.name === "bootSampleSize"
        //   )[0].value ||
        sessionParams.bootIterations ===
          initialSessionParams.filter(
            (item) => item.name === "bootIterations"
          )[0].value) && <p>Set Bootstrap CI parameters</p>}
      {sessionParams.data.length > 0 &&
        sessionParams.checkedState !== "" &&
        sessionParams.CISize !==
          initialSessionParams.filter((item) => item.name === "CISize")[0]
            .value &&
        // sessionParams.bootSampleSize !==
        //   initialSessionParams.filter(
        //     (item) => item.name !== "bootSampleSize"
        //   )[0].value &&
        sessionParams.bootIterations !==
          initialSessionParams.filter(
            (item) => item.name === "bootIterations"
          )[0].value && (
          <>
            <p>
              Bootstrap CI:{" "}
              <b>
                [{output.lower}, {output.upper}]
              </b>
            </p>
          </>
        )}
    </fieldset>
  );
}
