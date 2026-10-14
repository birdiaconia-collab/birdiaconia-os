import test from "node:test";
import assert from "node:assert/strict";
import {
  COMMERCIAL_STREAMS,
  projectCommercialModel,
  sanitizeAssumptions,
} from "../lib/commercial-model.ts";

test("sample scenarios have deterministic monthly totals", () => {
  const results = COMMERCIAL_STREAMS.map((stream) => projectCommercialModel(stream.assumptions));
  assert.equal(results.reduce((sum, item) => sum + item.revenue, 0), 4_537_500);
  assert.equal(results.reduce((sum, item) => sum + item.operatingResult, 0), 1_541_000);
  assert.deepEqual(results.map((item) => item.breakEvenUnits), [9, 48, 1, 6]);
});

test("zero or negative unit contribution never produces a false break-even quantity", () => {
  const result = projectCommercialModel({
    units: 10,
    revenuePerUnit: 1000,
    directCostPerUnit: 1200,
    monthlyFixedCost: 9000,
    paymentFeePercent: 0,
  });
  assert.equal(result.breakEvenUnits, null);
  assert.equal(result.operatingResult, -11_000);
});

test("invalid inputs are bounded before projection", () => {
  assert.deepEqual(sanitizeAssumptions({
    units: -5,
    revenuePerUnit: Number.POSITIVE_INFINITY,
    directCostPerUnit: -200,
    monthlyFixedCost: 3000,
    paymentFeePercent: 170,
  }), {
    units: 0,
    revenuePerUnit: 0,
    directCostPerUnit: 0,
    monthlyFixedCost: 3000,
    paymentFeePercent: 100,
  });
});
