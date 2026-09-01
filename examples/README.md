# Example datasets for testing

Eight datasets for exercising the K-Alpha Calculator by hand. All are valid inputs
and can be dropped straight into the upload zone. Values are non-negative integers,
missing codes are `NA`, and every item carries the same number of raters.

Both delimiters the parser accepts are represented — three files are
semicolon-separated, as exports from European locales usually are — and line endings
are deliberately mixed for the same reason. Please keep them as they are.

| File | Shape | Values | Delim | Covers |
|---|---|---|---|---|
| `min-above-one.csv` | 86 × 3 | 58–96 | `,` | Minimum above 1, no missing codes |
| `min-above-one-shifted.csv` | 86 × 3 | 68–106 | `,` | The file above, with 10 added to every value |
| `min-equals-one.csv` | 60 × 3 | 1–5 | `,` | Minimum equal to 1 |
| `min-above-one-with-nas.csv` | 52 × 3 | 59–94 | `,` | Minimum above 1, 12 missing codes |
| `perfect-agreement.csv` | 7 × 6 | 2–15 | `;` | Every rater agrees on every item |
| `sparse-mostly-missing.csv` | 11 × 6 | 2–16 | `;` | Heavily incomplete; most items drop out |
| `single-value-degenerate.csv` | 7 × 6 | 2 only | `;` | Value domain collapses to a point |
| `four-raters-small.csv` | 12 × 4 | 1–5 | `,` | Four raters, mixed agreement, missing codes |

The first four are synthetic, generated from a latent score per item plus rater
noise; they exercise the computation and are not drawn from any study. The other
four are small hand-built cases kept from earlier testing.

## Expected output

Upload each file, select each scale in turn, and compare against the table. Ratio
figures for three of the datasets changed in v2.1; everything else is identical in
both versions.

| File | Min | Max | Items >1 rate | Pairable | Nominal | Ordinal | Interval | Ratio (v2.0) | Ratio (v2.1) |
|---|---|---|---|---|---|---|---|---|---|
| `min-above-one.csv` | 58 | 96 | 86 | 258 | 0.087 | 0.758 | 0.761 | 0.532 | **0.758** |
| `min-above-one-shifted.csv` | 68 | 106 | 86 | 258 | 0.087 | 0.758 | 0.761 | 0.532 | **0.759** |
| `min-equals-one.csv` | 1 | 5 | 60 | 180 | 0.172 | 0.522 | 0.516 | 0.471 | 0.471 |
| `min-above-one-with-nas.csv` | 59 | 94 | 52 | 144 | 0.048 | 0.754 | 0.756 | 0.507 | **0.743** |
| `perfect-agreement.csv` | 2 | 15 | 7 | 42 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| `sparse-mostly-missing.csv` | 2 | 16 | 6 | 28 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| `four-raters-small.csv` | 1 | 5 | 11 | 40 | 0.743 | 0.815 | 0.849 | 0.797 | 0.797 |

`single-value-degenerate.csv` is not in the table because it never reaches the
computation: every item carries the same rating, so the upload validation rejects it
with *"the minimum and maximum values must be different"*. That message appearing is
the expected result. Should it ever get past validation, the coefficient must display
as `N/A` rather than as a number.

Bootstrap confidence intervals are resampled on each run and will vary. Compare point
estimates; expect movement in the third decimal on the intervals.

## The shift-sensitivity pair

`min-above-one-shifted.csv` is `min-above-one.csv` with 10 added to every value.
Uploading the two in succession on the ratio scale is the quickest check of the
correction released in v2.1, and it needs no reference values at all.

Eq. (6) is `((c − k) / (c + k))²`. Its numerator holds a difference, unaffected by
adding a constant to every value; its denominator holds a sum, which is not. Ratio
alpha must therefore respond when the whole value domain shifts, while nominal,
ordinal and interval must not.

Before v2.1 the two files returned an identical ratio coefficient, because the
distance was derived from column positions in the count matrix rather than from the
rate values those positions stand for. From v2.1 they differ. Nominal, ordinal and
interval agree exactly across the pair in both versions.

## Notes on individual files

`sparse-mostly-missing.csv` leaves only 6 of its 11 items in the computation; the
rest carry a single rating or none and are excluded. Four of its values (3, 4, 9, 16)
occur *only* in excluded items, so the value-by-unit matrix retains columns for them
that are entirely zero. A value domain wider than the data actually contributing to
the coefficient is a case worth keeping around.

`perfect-agreement.csv` and `sparse-mostly-missing.csv` both return exactly 1 on
every scale, since observed disagreement is zero. That makes them the cheapest sanity
check here — a failure means something is wrong well upstream of the distance
functions — but it also means neither can detect an error in a distance function.
Together with `four-raters-small.csv` and `min-equals-one.csv`, whose minimum is 1
and which the pre-v2.1 code therefore handled correctly, four of these eight files
would have shown nothing wrong before the correction. They guard against regression;
the three ratio-affected files above are what actually exercise it.
