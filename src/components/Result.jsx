import React, { useEffect, useState, useContext, useCallback } from "react";
import { SessionParamsContext, _minRate, _maxRate } from "@/helpers";
import { initialSessionParams } from "@/constants/initialSessionParams";
import { quantile } from "d3-array";

export function Result() {
  const [bucketSessionParams] = useContext(SessionParamsContext);
  const sessionParams = Object.fromEntries(
    bucketSessionParams.map((item) => Object.values(item))
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
    [sessionParams.data]
  );

  const _computeAlpha = useCallback(
    (VbyUMatrix, checkedState) => {
      const sumsByCol = VbyUMatrix.reduce((acc, curr) =>
        acc.map((num, i) => num + curr[i])
      );
      const sumsByRow = VbyUMatrix.map((row) => row.reduce((a, b) => a + b, 0));
      const totRates = VbyUMatrix.flat().reduce((sum, num) => sum + num, 0);

      let numerator, denominator;

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
              .reduce((total, current) => total + current, 0)
          ).map((value, index) => value / (sumsByRow[index] - 1));

          denominator = sumsByCol.map((value, colIndex) => {
            return (
              value *
              sumsByCol
                .slice(colIndex + 1)
                .reduce(
                  (total, current, idx) =>
                    total + current * (colIndex !== colIndex + idx + 1 ? 1 : 0),
                  0
                )
            );
          });

          return (
            1 -
            ((totRates - 1) * numerator.reduce((a, b) => a + b, 0)) /
              denominator.reduce((a, b) => a + b, 0)
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
                          2
                        )
                    );
                  }, 0)
                );
              })
              .reduce((total, current) => total + current, 0)
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
                        2
                      ),
                  0
                )
            );
          });

          return (
            1 -
            ((totRates - 1) * numerator.reduce((a, b) => a + b, 0)) /
              denominator.reduce((a, b) => a + b, 0)
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
              .reduce((total, current) => total + current, 0)
          ).map((value, index) => value / (sumsByRow[index] - 1));

          denominator = sumsByCol.map((value, colIndex) => {
            return (
              value *
              sumsByCol
                .slice(colIndex + 1)
                .reduce(
                  (total, current, idx) =>
                    total + current * Math.pow(idx + 1, 2),
                  0
                )
            );
          });

          return (
            1 -
            ((totRates - 1) * numerator.reduce((a, b) => a + b, 0)) /
              denominator.reduce((a, b) => a + b, 0)
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
              .reduce((total, current) => total + current, 0)
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
                  0
                )
            );
          });

          return (
            1 -
            ((totRates - 1) * numerator.reduce((a, b) => a + b, 0)) /
              denominator.reduce((a, b) => a + b, 0)
          );

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
    const VbyUMatrix = countMatrix.map((row) => row.slice(0, -1)); // Values x Units matrix
    const result = _computeAlpha(VbyUMatrix, sessionParams.checkedState);
    return [
      countMatrix.length,
      result.toFixed(3),
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
        pairableRates: _k_alpha(sessionParams.data)[2],
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
          pairableRates: _k_alpha(sessionParams.data)[2],
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

  return (
    <fieldset className="border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">
        <b>Result</b>
      </legend>
      {sessionParams.data.length === 0 && (
        <div className="m-3 text-red-600">&#8594; Upload a datafile</div>
      )}
      {sessionParams.checkedState === "" && (
        <div className="m-3 text-red-600">&#8594; Select the type of data</div>
      )}
      {sessionParams.data.length > 0 && sessionParams.checkedState !== "" && (
        <div className="m-3">
          <p>
            Min rate: <b>{output.minRate}</b>
          </p>
          <p>
            Max rate: <b>{output.maxRate}</b>
          </p>
          <p>
            Items with more than one rate: <b>{output.cases}</b>
          </p>

          {
            <div>
              <p>
                Number of pairable rates: <b>{output.pairableRates}</b>
              </p>
              <p className="mt-3 text-lg">
                Krippendorff's Alpha ({sessionParams.checkedState} scale):{" "}
                <b>{output.k_alpha}</b>
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
            (item) => item.name === "bootIterations"
          )[0].value) && (
        <div className="m-3 text-red-600">
          &#8594; Set the bootstrap CI parameters
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
            (item) => item.name === "bootIterations"
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
