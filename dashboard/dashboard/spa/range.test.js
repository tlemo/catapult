/* Copyright 2018 The Chromium Authors. All rights reserved.
   Use of this source code is governed by a BSD-style license that can be
   found in the LICENSE file.
*/
'use strict';

import {assert} from 'chai';
import {Range} from './range.js';

suite('Range', function() {
  test('addValue', function() {
    const range = new Range();
    assert.isTrue(range.isEmpty);
    range.addValue(1);
    assert.isFalse(range.isEmpty);
    assert.strictEqual(1, range.min);
    assert.strictEqual(1, range.max);

    range.addValue(2);
    assert.isFalse(range.isEmpty);
    assert.strictEqual(1, range.min);
    assert.strictEqual(2, range.max);
  });

  test('addNonEmptyRange', function() {
    const r1 = new Range();
    r1.addValue(1);
    r1.addValue(2);

    const r = new Range();
    r.addRange(r1);
    assert.strictEqual(1, r.min);
    assert.strictEqual(2, r.max);

    const r2 = Range.fromDict(r.toJSON());
    assert.strictEqual(r2.isEmpty, r.isEmpty);
    assert.strictEqual(r2.max, r.max);
    assert.strictEqual(r2.min, r.min);
  });

  test('addEmptyRange', function() {
    const r1 = new Range();

    const r = new Range();
    r.addRange(r1);
    assert.isTrue(r.isEmpty);
    assert.isUndefined(r.min);
    assert.isUndefined(r.max);

    const r2 = Range.fromDict(r.toJSON());
    assert.strictEqual(r2.isEmpty, r.isEmpty);
    assert.isUndefined(r2.max);
    assert.isUndefined(r2.min);
  });

  test('addRangeToRange', function() {
    const r1 = new Range();
    r1.addValue(1);
    r1.addValue(2);

    const r = new Range();
    r.addValue(3);
    r.addRange(r1);

    assert.isFalse(r.isEmpty);
    assert.strictEqual(1, r.min);
    assert.strictEqual(3, r.max);
  });

  test('containsRange', function() {
    const r1 = Range.fromExplicitRange(0, 3);
    const r2 = Range.fromExplicitRange(1, 2);

    assert.isTrue(r1.containsRangeInclusive(r2));
    assert.isFalse(r2.containsRangeInclusive(r1));
  });

  test('containsRange_emptyRange', function() {
    const r1 = Range.fromExplicitRange(0, 3);
    const r2 = new Range();

    assert.isFalse(r1.containsRangeInclusive(r2));
    assert.isFalse(r2.containsRangeInclusive(r1));
  });

  test('containsRange_overlapping', function() {
    const r1 = Range.fromExplicitRange(0, 3);
    const r2 = Range.fromExplicitRange(2, 4);

    assert.isFalse(r1.containsRangeInclusive(r2));
    assert.isFalse(r2.containsRangeInclusive(r1));
  });

  test('containsRange_disjoint', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(3, 5);

    assert.isFalse(r1.containsRangeInclusive(r2));
    assert.isFalse(r2.containsRangeInclusive(r1));
  });

  test('containsRange_singlePointRange', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(1, 1);

    assert.isTrue(r1.containsRangeInclusive(r2));
    assert.isFalse(r2.containsRangeInclusive(r1));
  });

  test('containsRange_singlePointRangeAtBorder', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(2, 2);

    assert.isTrue(r1.containsRangeInclusive(r2));
    assert.isFalse(r2.containsRangeInclusive(r1));
  });

  test('containsExplicitRange', function() {
    const r1 = Range.fromExplicitRange(0, 3);
    const r2 = Range.fromExplicitRange(1, 2);

    assert.isTrue(r1.containsExplicitRangeInclusive(1, 2));
    assert.isFalse(r2.containsExplicitRangeInclusive(0, 3));
  });

  test('containsExplicitRange_overlapping', function() {
    const r1 = Range.fromExplicitRange(0, 3);
    const r2 = Range.fromExplicitRange(2, 4);

    assert.isFalse(r1.containsExplicitRangeInclusive(2, 4));
    assert.isFalse(r2.containsExplicitRangeInclusive(0, 3));
  });

  test('containsExplicitRange_disjoint', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(3, 5);

    assert.isFalse(r1.containsExplicitRangeInclusive(3, 5));
    assert.isFalse(r2.containsExplicitRangeInclusive(0, 2));
  });

  test('containsExplicitRange_singlePointRange', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(1, 1);

    assert.isTrue(r1.containsExplicitRangeInclusive(1, 1));
    assert.isFalse(r2.containsExplicitRangeInclusive(0, 2));
  });

  test('containsExplicitRange_singlePointRangeAtBorder', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(2, 2);

    assert.isTrue(r1.containsExplicitRangeInclusive(2, 2));
    assert.isFalse(r2.containsExplicitRangeInclusive(0, 2));
  });

  test('intersectsRange', function() {
    const r1 = Range.fromExplicitRange(0, 3);
    const r2 = Range.fromExplicitRange(1, 2);

    assert.isTrue(r1.intersectsRangeInclusive(r2));
    assert.isTrue(r2.intersectsRangeInclusive(r1));
  });

  test('intersectsRange_emptyRange', function() {
    const r1 = Range.fromExplicitRange(0, 3);
    const r2 = new Range();

    assert.isFalse(r1.intersectsRangeInclusive(r2));
    assert.isFalse(r2.intersectsRangeInclusive(r1));
  });

  test('intersectsRange_overlapping', function() {
    const r1 = Range.fromExplicitRange(0, 3);
    const r2 = Range.fromExplicitRange(2, 4);

    assert.isTrue(r1.intersectsRangeInclusive(r2));
    assert.isTrue(r2.intersectsRangeInclusive(r1));
  });

  test('intersectsRange_disjoint', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(3, 5);

    assert.isFalse(r1.intersectsRangeInclusive(r2));
    assert.isFalse(r2.intersectsRangeInclusive(r1));
  });

  test('intersectsRange_singlePointRange', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(1, 1);

    assert.isTrue(r1.intersectsRangeInclusive(r2));
    assert.isTrue(r2.intersectsRangeInclusive(r1));
  });

  test('intersectsRange_singlePointRangeAtBorder', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(2, 2);

    assert.isTrue(r1.intersectsRangeInclusive(r2));
    assert.isTrue(r2.intersectsRangeInclusive(r1));
  });

  test('intersectsExplicitRange', function() {
    const r1 = Range.fromExplicitRange(0, 3);
    const r2 = Range.fromExplicitRange(1, 2);

    assert.isTrue(r1.intersectsExplicitRangeInclusive(1, 2));
    assert.isTrue(r2.intersectsExplicitRangeInclusive(0, 3));
  });

  test('intersectsExplicitRange_overlapping', function() {
    const r1 = Range.fromExplicitRange(0, 3);
    const r2 = Range.fromExplicitRange(2, 4);

    assert.isTrue(r1.intersectsExplicitRangeInclusive(2, 4));
    assert.isTrue(r2.intersectsExplicitRangeInclusive(0, 3));
  });

  test('intersectsExplicitRange_disjoint', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(3, 5);

    assert.isFalse(r1.intersectsExplicitRangeInclusive(3, 5));
    assert.isFalse(r2.intersectsExplicitRangeInclusive(0, 2));
  });

  test('intersectsExplicitRange_singlePointRange', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(1, 1);

    assert.isTrue(r1.intersectsExplicitRangeInclusive(1, 1));
    assert.isTrue(r2.intersectsExplicitRangeInclusive(0, 2));
  });

  test('intersectsExplicitRange_singlePointRangeAtBorder', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(2, 2);

    assert.isTrue(r1.intersectsExplicitRangeInclusive(2, 2));
    assert.isTrue(r2.intersectsExplicitRangeInclusive(0, 2));
  });

  test('duration', function() {
    assert.strictEqual(Range.fromExplicitRange(2, 4).duration, 2);
  });

  test('duration_singlePointRange', function() {
    assert.strictEqual(Range.fromExplicitRange(2, 2).duration, 0);
  });

  test('duration_emptyRange', function() {
    assert.strictEqual(new Range().duration, 0);
  });

  test('findIntersection_overlapping', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(1, 3);

    const result = Range.fromExplicitRange(1, 2);
    assert.deepEqual(r1.findIntersection(r2), result);
    assert.deepEqual(r2.findIntersection(r1), result);
  });

  test('findIntersection_bordering', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(2, 4);

    const result = Range.fromExplicitRange(2, 2);
    assert.deepEqual(r1.findIntersection(r2), result);
    assert.deepEqual(r2.findIntersection(r1), result);
  });

  test('findIntersection_singlePointRange', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(2, 2);

    const result = Range.fromExplicitRange(2, 2);
    assert.deepEqual(r1.findIntersection(r2), result);
    assert.deepEqual(r2.findIntersection(r1), result);
  });

  test('findIntersection_disjoint', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = Range.fromExplicitRange(3, 5);

    assert.isTrue(r1.findIntersection(r2).isEmpty);
    assert.isTrue(r2.findIntersection(r1).isEmpty);
  });

  test('findIntersection_emptyRange', function() {
    const r1 = Range.fromExplicitRange(0, 2);
    const r2 = new Range();

    assert.isTrue(r1.findIntersection(r2).isEmpty);
    assert.isTrue(r2.findIntersection(r1).isEmpty);
  });

  test('clone_empty', function() {
    const range = new Range();
    const cloned = range.clone();
    assert.deepEqual(cloned, range);
  });

  test('clone_normal', function() {
    const range = Range.fromExplicitRange(1, 2);
    const cloned = range.clone();
    assert.deepEqual(range, cloned);
    range.min = 0;
    assert.strictEqual(1, cloned.min);
  });

  test('findDifference_normal', function() {
    // [{a,min, a.max}, {b.min, b.max}, [{c1.min, c1.max}, ...]]
    const truthTable = [
      [[50, 100], [-Infinity, 0], [[50, 100]]],
      [[50, 100], [-Infinity, 75], [[75, 100]]],
      [[50, 100], [-Infinity, Infinity], []],

      [[50, 100], [0, 0], [[50, 100]]],
      [[50, 100], [0, 25], [[50, 100]]],
      [[50, 100], [0, 50], [[50, 100]]],
      [[50, 100], [0, 75], [[75, 100]]],
      [[50, 100], [0, 100], []],
      [[50, 100], [0, 150], []],
      [[50, 100], [50, 50], [[50, 100]]],
      [[50, 100], [50, 75], [[75, 100]]],
      [[50, 100], [50, 100], []],
      [[50, 100], [50, 150], []],
      [[50, 100], [75, 75], [[50, 75], [75, 100]]],
      [[50, 100], [75, 100], [[50, 75]]],
      [[50, 100], [75, 150], [[50, 75]]],

      [[50, 50], [0, 0], [[50, 50]]],
      [[50, 50], [0, 25], [[50, 50]]],
      [[50, 50], [0, 50], []],
      [[50, 50], [50, 50], []],
      [[50, 50], [0, 75], []],

      [[50, Infinity], [0, 0], [[50, Infinity]]],
      [[50, Infinity], [0, 25], [[50, Infinity]]],
      [[50, Infinity], [0, 50], [[50, Infinity]]],
      [[50, Infinity], [0, 75], [[75, Infinity]]],
      [[50, Infinity], [0, 100], [[100, Infinity]]],
      [[50, Infinity], [50, 50], [[50, Infinity]]],
      [[50, Infinity], [50, 75], [[75, Infinity]]],
      [[50, Infinity], [50, 100], [[100, Infinity]]],
      [[50, Infinity], [75, 75], [[50, 75], [75, Infinity]]],
      [[50, Infinity], [75, 100], [[50, 75], [100, Infinity]]],
    ];

    for (const row of truthTable) {
      const ranges = Range.findDifference(
          Range.fromExplicitRange(row[0][0], row[0][1]),
          Range.fromExplicitRange(row[1][0], row[1][1]));
      const simpleRanges = [];
      for (const range of ranges) {
        simpleRanges.push([range.min, range.max]);
      }
      assert.deepEqual(simpleRanges, row[2], 'range(' + row[0] +
          ') subtracted by ' + 'range(' + row[1] + ') should be range(' +
          row[2] + ').');
    }
  });

  test('findDifference_AUndefined', function() {
    const rangeA = undefined;
    const rangeB = Range.fromExplicitRange(1, 2);
    assert.throws(function() {Range.findDifference(rangeA, rangeB);});
  });

  test('findDifference_BUndefined', function() {
    const rangeA = Range.fromExplicitRange(1, 2);
    const rangeB = undefined;
    assert.throws(function() {Range.findDifference(rangeA, rangeB);});
  });

  test('findDifference_EmptyMinusNormal', function() {
    const rangeA = new Range();
    const rangeB = Range.fromExplicitRange(1, 2);
    const result = Range.findDifference(rangeA, rangeB);
    assert.deepEqual(result, []);
  });

  test('findDifference_0MinusNormal', function() {
    const rangeA = Range.fromExplicitRange(0, 0);
    const rangeB = Range.fromExplicitRange(1, 2);
    const result = Range.findDifference(rangeA, rangeB);
    assert.deepEqual(result, [rangeA]);
  });

  test('findDifference_NormalMinus0', function() {
    const rangeA = Range.fromExplicitRange(1, 2);
    const rangeB = Range.fromExplicitRange(0, 0);
    const result = Range.findDifference(rangeA, rangeB);
    assert.deepEqual([rangeA], result);
    result.min = 5;
    assert.strictEqual(rangeA.min, 1);
  });

  test('findDifference_NormalMinusEmpty', function() {
    const rangeA = Range.fromExplicitRange(1, 2);
    const rangeB = new Range();
    const result = Range.findDifference(rangeA, rangeB);
    assert.deepEqual([rangeA], result);
    result.min = 5;
    assert.strictEqual(rangeA.min, 1);
  });

  test('findDifference_pointMinusEmpty', function() {
    const rangeA = Range.fromExplicitRange(1, 1);
    const rangeB = new Range();
    const result = Range.findDifference(rangeA, rangeB);
    assert.deepEqual(result, [rangeA]);
  });

  test('findDifference_emptyMinusPoint', function() {
    const rangeA = new Range();
    const rangeB = Range.fromExplicitRange(1, 1);
    const result = Range.findDifference(rangeA, rangeB);
    assert.deepEqual(result, []);
  });

  test('mergeIntoArray', function() {
    assert.deepEqual([Range.fromExplicitRange(1, 10)],
        Range.fromExplicitRange(1, 5).mergeIntoArray(
            [Range.fromExplicitRange(4, 10)]));
    assert.deepEqual([Range.fromExplicitRange(1, 10)],
        Range.fromExplicitRange(4, 10).mergeIntoArray(
            [Range.fromExplicitRange(1, 5)]));
    assert.deepEqual([Range.fromExplicitRange(1, 10)],
        Range.fromExplicitRange(1, 10).mergeIntoArray(
            [Range.fromExplicitRange(4, 6)]));
    assert.deepEqual(
        [Range.fromExplicitRange(1, 3), Range.fromExplicitRange(6, 10)],
        Range.fromExplicitRange(1, 3).mergeIntoArray(
            [Range.fromExplicitRange(6, 10)]));
  });
});
