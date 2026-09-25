# Supply Chain Shock Simulator

Build a production chain, raise the price of a restricted input, and see which stages lose jobs. Everything is computed in the browser; there is no backend.

## Why the numbers can be trusted

[The same model runs in Python and JavaScript and agrees to 1.1e-15 over 4,000 random chains, and a test file reproduces 38 of the paper's published figures and fails if any of them moves.](https://github.com/lavanito/supply-chain-model)

That repository's own automatic checks run the Python model, the JavaScript tests and the cross-check on every push.

This project adds a second test, `src/model/presets.test.js`, which runs each of the five preset buttons through the model and checks it against the published figures. It catches a mistyped preset parameter, which would otherwise give a wrong answer that still looks plausible.

```sh
npm run test:model
```

The same command runs in `.github/workflows/verify.yml` on every push and pull request.

## The model

`src/model/chainSolver.js` and `src/model/chainSolver.test.js` are imported unchanged, byte for byte. The interface calls `solveChain` on every change and clamps inputs before they reach it, so the model itself is never edited.

Every employment figure is a percentage change of that stage's own employment. The model has no employment levels, so it cannot say which stage loses the most workers.

## Presets

Open any scenario directly: `?preset=food`, `?preset=hospitality`, `?preset=oil`, `?preset=flexible-pay`, `?preset=fixed-supply`.

## Source

Model and figures from Mahadeva (2026), *Supply restrictions: where employment falls, and why*, [DOI 10.5281/zenodo.22836880](https://doi.org/10.5281/zenodo.22836880).

Interface built with Lovable. The model is imported unchanged from github.com/lavanito/supply-chain-model, where it is tested against every figure in the paper.
