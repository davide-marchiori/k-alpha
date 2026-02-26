import React, { useEffect, useState, useContext, useCallback } from "react";
import { SessionParamsContext, _minRate, _maxRate } from "@/helpers";
import { initialSessionParams } from "@/constants/initialSessionParams";
import { quantile } from "d3-array";

export function Result() {
  const [bucketSessionParams] = useContext(SessionParamsContext);
  const sessionParams = Object.fromEntries(
    bucketSessionParams.map((item) => Object.values(item)),
  );
  const [output, setOutput] = useState({});

  // Columns from 0 to (min - max + 1) indicate the number of occurrences of each value in that category
  // Column max + 1 indicates the number of empty values
  const countOccurrencesInRange = useCallback(
    // This matrix gives the distribution of raters by unit (row) and by category (column)
    // The last column counts the number of empty values
    // It does not include rows with one or less raters
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
    [sessionParams.data],
  );

  const _computeAlpha = useCallback(
    (VbyUMatrix, checkedState) => {
      if (!Array.isArray(VbyUMatrix) || VbyUMatrix.length === 0) return NaN;
      if (!Array.isArray(VbyUMatrix[0]) || VbyUMatrix[0].length === 0)
        return NaN;
      const k = VbyUMatrix[0].length;
      if (!VbyUMatrix.every((r) => Array.isArray(r) && r.length === k))
        return NaN;

      const sumsByCol = VbyUMatrix.reduce((acc, curr) =>
        acc.map((num, i) => num + curr[i]),
      );
      const sumsByRow = VbyUMatrix.map((row) => row.reduce((a, b) => a + b, 0));
      const totRates = VbyUMatrix.flat().reduce((sum, num) => sum + num, 0);

      let numerator, denominator, denom;

      switch (checkedState) {
        case "nominal":
          // Nominal scale
          numerator = VbyUMatrix.map((row) =>
            row
              .map((value, colIndex) => {
                return (
                  value *
                  row.slice(colIndex + 1).reduce((total, current, idx) => {
                    return (
                      total +
                      current * (colIndex !== colIndex + idx + 1 ? 1 : 0)
                    );
                  }, 0)
                );
              })
              .reduce((total, current) => total + current, 0),
          ).map((value, index) => value / (sumsByRow[index] - 1));

          denominator = sumsByCol.map((value, colIndex) => {
            return (
              value *
              sumsByCol
                .slice(colIndex + 1)
                .reduce(
                  (total, current, idx) =>
                    total + current * (colIndex !== colIndex + idx + 1 ? 1 : 0),
                  0,
                )
            );
          });

          denom = denominator.reduce((a, b) => a + b, 0);
          if (!Number.isFinite(denom) || denom === 0) return NaN;
          return (
            1 - ((totRates - 1) * numerator.reduce((a, b) => a + b, 0)) / denom
          );

        case "ordinal":
          // Ordinal scale
          numerator = VbyUMatrix.map((row) =>
            row
              .map((value, colIndex) => {
                return (
                  value *
                  row.slice(colIndex + 1).reduce((total, current, idx) => {
                    return (
                      total +
                      current *
                        Math.pow(
                          sumsByCol
                            .slice(colIndex, colIndex + idx + 2)
                            .reduce((acc, cur) => acc + cur, 0) -
                            (sumsByCol[colIndex] +
                              sumsByCol[colIndex + idx + 1]) /
                              2,
                          2,
                        )
                    );
                  }, 0)
                );
              })
              .reduce((total, current) => total + current, 0),
          ).map((value, index) => value / (sumsByRow[index] - 1));

          denominator = sumsByCol.map((value, colIndex) => {
            return (
              value *
              sumsByCol
                .slice(colIndex + 1)
                .reduce(
                  (total, current, idx) =>
                    total +
                    current *
                      Math.pow(
                        sumsByCol
                          .slice(colIndex, colIndex + idx + 2)
                          .reduce((total, current) => total + current, 0) -
                          (sumsByCol[colIndex] +
                            sumsByCol[colIndex + idx + 1]) /
                            2,
                        2,
                      ),
                  0,
                )
            );
          });

          denom = denominator.reduce((a, b) => a + b, 0);
          if (!Number.isFinite(denom) || denom === 0) return NaN;
          return (
            1 - ((totRates - 1) * numerator.reduce((a, b) => a + b, 0)) / denom
          );

        case "interval":
          // Interval scale
          numerator = VbyUMatrix.map((row) =>
            row
              .map((value, colIndex) => {
                return (
                  value *
                  row.slice(colIndex + 1).reduce((total, current, idx) => {
                    return total + current * Math.pow(idx + 1, 2);
                  }, 0)
                );
              })
              .reduce((total, current) => total + current, 0),
          ).map((value, index) => value / (sumsByRow[index] - 1));

          denominator = sumsByCol.map((value, colIndex) => {
            return (
              value *
              sumsByCol
                .slice(colIndex + 1)
                .reduce(
                  (total, current, idx) =>
                    total + current * Math.pow(idx + 1, 2),
                  0,
                )
            );
          });

          denom = denominator.reduce((a, b) => a + b, 0);
          if (!Number.isFinite(denom) || denom === 0) return NaN;
          return (
            1 - ((totRates - 1) * numerator.reduce((a, b) => a + b, 0)) / denom
          );

        case "ratio":
          // Interval scale
          numerator = VbyUMatrix.map((row) =>
            row
              .map((value, colIndex) => {
                return (
                  value *
                  row.slice(colIndex + 1).reduce((total, current, idx) => {
                    return (
                      total +
                      current *
                        Math.pow((idx + 1) / (colIndex + colIndex + idx + 3), 2)
                    );
                  }, 0)
                );
              })
              .reduce((total, current) => total + current, 0),
          ).map((value, index) => value / (sumsByRow[index] - 1));

          denominator = sumsByCol.map((value, colIndex) => {
            return (
              value *
              sumsByCol
                .slice(colIndex + 1)
                .reduce(
                  (total, current, idx) =>
                    total +
                    current *
                      Math.pow((idx + 1) / (colIndex + colIndex + idx + 3), 2),
                  0,
                )
            );
          });

          denom = denominator.reduce((a, b) => a + b, 0);
          if (!Number.isFinite(denom) || denom === 0) return NaN;
          return (
            1 - ((totRates - 1) * numerator.reduce((a, b) => a + b, 0)) / denom
          );

        default:
          break;
      }
    },
    [sessionParams.data],
  );

  const _k_alpha = (data) => {
    if (data.length === 0) return [0, NaN, 0];
    const minRate = _minRate(data);
    const maxRate = _maxRate(data);
    const countMatrix = countOccurrencesInRange(data, minRate, maxRate);
    if (countMatrix.length === 0) return [0, NaN, 0];
    const VbyUMatrix = countMatrix.map((row) => row.slice(0, -1));
    const sumsByColCheck = VbyUMatrix[0]?.length ?? 0;
    if (sumsByColCheck === 0) return [0, NaN, 0];
    const result = _computeAlpha(VbyUMatrix, sessionParams.checkedState);
    const safeResult = Number.isFinite(result) ? result.toFixed(3) : "N/A";
    return [
      countMatrix.length,
      safeResult,
      VbyUMatrix.flat().reduce((sum, num) => sum + num, 0),
    ];
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
    const sorted = copy.sort((a, b) => a - b);
    const lo = quantile(sorted, alpha / 2);
    const hi = quantile(sorted, 1 - alpha / 2);
    return [
      Number.isFinite(lo) ? lo.toFixed(3) : "N/A",
      Number.isFinite(hi) ? hi.toFixed(3) : "N/A",
    ];
  };

  useEffect(() => {
    if (sessionParams.data.length === 0 || sessionParams.checkedState === "")
      return;

    // Compute once (instead of calling _k_alpha(...) 3 times)
    const base = _k_alpha(sessionParams.data);
    const minRate = _minRate(sessionParams.data);
    const maxRate = _maxRate(sessionParams.data);

    // First set: point estimate (no CI yet)
    setOutput({
      minRate,
      maxRate,
      cases: base[0],
      k_alpha: base[1],
      pairableRates: base[2],
      lower: "",
      upper: "",
    });

    const defaultCISize = initialSessionParams.find(
      (item) => item.name === "CISize",
    )?.value;
    const defaultBootIter = initialSessionParams.find(
      (item) => item.name === "bootIterations",
    )?.value;

    const wantBootstrap =
      sessionParams.CISize !== defaultCISize &&
      sessionParams.bootIterations !== defaultBootIter;

    if (!wantBootstrap) return;

    // Bootstrap CI
    const iters =
      sessionParams.bootIterations === "200 Iterations"
        ? 200
        : sessionParams.bootIterations === "400 Iterations"
          ? 400
          : sessionParams.bootIterations === "600 Iterations"
            ? 600
            : 1000;

    const bootSamples = drawBootstrapSamples(
      sessionParams.data,
      iters,
      minRate,
      maxRate,
    );

    const k_alpha_boot = bootSamples
      .map((sample) => _k_alpha(sample)[1])
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x));

    if (k_alpha_boot.length === 0) {
      setOutput((prev) => ({ ...prev, lower: "N/A", upper: "N/A" }));
      return;
    }

    const [lower, upper] = confidenceInterval(
      k_alpha_boot,
      sessionParams.CISize,
    );

    // Second set: add CI, but reuse base values/min/max already computed
    setOutput((prev) => ({
      ...prev,
      lower,
      upper,
    }));
  }, [
    sessionParams.data,
    sessionParams.checkedState,
    sessionParams.CISize,
    sessionParams.bootIterations,
  ]);

  const getPairableUnits = (data, min, max) => {
    return data.filter((arr) => {
      let c = 0;
      for (const num of arr) {
        if (num === "" || num == null) continue;
        const v = Number(num);
        if (Number.isFinite(v) && v >= min && v <= max) c++;
      }
      return c > 1;
    });
  };

  const drawBootstrapSample = (data, min, max) => {
    const pool = getPairableUnits(data, min, max);
    if (pool.length === 0) return [];
    const sample = [];
    for (let i = 0; i < pool.length; i++) {
      sample.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return sample;
  };

  const drawBootstrapSamples = (data, iterations, min, max) => {
    const samples = [];
    for (let i = 0; i < iterations; i++) {
      samples.push(drawBootstrapSample(data, min, max));
    }
    return samples;
  };

  return (
    <fieldset className="border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">
        <b>Results</b>
      </legend>
      {sessionParams.data.length === 0 && (
        <div className="m-3 text-red-600">&#8594; Upload a Data File</div>
      )}
      {sessionParams.checkedState === "" && (
        <div className="m-3 text-red-600">&#8594; Select the Type of Data</div>
      )}
      {sessionParams.data.length > 0 && sessionParams.checkedState !== "" && (
        <div className="m-3">
          <p>
            Min Rate: <b>{output.minRate}</b>
          </p>
          <p>
            Max Rate: <b>{output.maxRate}</b>
          </p>
          <p>
            Items With More Than One Rate: <b>{output.cases}</b>
          </p>

          {
            <div>
              <p>
                Number of Pairable Rates: <b>{output.pairableRates}</b>
              </p>
              <p className="mt-3 text-lg">
                Krippendorff's Alpha (
                {sessionParams.checkedState.charAt(0).toUpperCase() +
                  sessionParams.checkedState.slice(1)}{" "}
                Scale): <b>{output.k_alpha}</b>
              </p>
            </div>
          }
        </div>
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
            (item) => item.name === "bootIterations",
          )[0].value) && (
        <div className="m-3 text-red-600">
          &#8594; Set the Bootstrap CI Parameters
        </div>
      )}
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
            (item) => item.name === "bootIterations",
          )[0].value && (
          <div className="mx-3 mb-3">
            <p>
              Bootstrap Confidence Interval ({sessionParams.CISize}):{" "}
              <b>
                [{output.lower}, {output.upper}]
              </b>
            </p>
          </div>
        )}
    </fieldset>
  );
}
