// These min and max values use the more reliable reduce function
// filter((x) => x)) removes all empty values
// Does not use the min and max functions because they are not reliable
export const _minRate = (data) =>
  data
    .flat()
    .filter((x) => x !== "") // The '!== ""' is needed to count zeroes, otherwise they're filtered out with '(x) => x'
    .reduce(function (p, v) {
      return p < v ? p : v;
    });

export const _maxRate = (data) =>
  data
    .flat()
    .filter((x) => x !== "")
    .reduce(function (p, v) {
      return p > v ? p : v;
    });
