import StreamQualityMos from '../src/stream-quality-mos';
import { expect } from 'chai';
import sinon from 'sinon';

describe('StreamQualityMos', () => {
  let vsm, clock, now;
  beforeEach(() => {
    vsm = new StreamQualityMos({ width: 400, height: 400 });
    clock = sinon.useFakeTimers();
    now = Date.now();
  });

  afterEach(() => {
    clock.restore();
  });

  describe('calculateVideoScore', () => {
    it('gives a score of 5', () => {
      expect(
        StreamQualityMos.calculateStats(
          { timestamp: now + 5000, bytes: 1100000 },
          { timestamp: now, bytes: 1000000 },
          { width: 400, height: 400 }
        )
      ).to.equal(5);
    });
  });

  describe('onStats', () => {
    it('returns early when only one stats log recorded', () => {
      const callback = sinon.spy();
      vsm.onStats({ timestamp: now + 5000, bytes: 1100000 }, callback);
      expect(callback.notCalled).to.equal(true);
    });

    it('callsback the callback function with a whole rounded score', () => {
      const callback = sinon.spy();
      let bytes = 1100000;
      // We need at least 5 stats with at least 1 second in between them to call callback function
      for (let i = 0; i <= 5; i++) {
        now += 1001;
        bytes += 10000;
        vsm.onStats({ timestamp: now + 1000, bytes: bytes }, callback);
        clock = sinon.useFakeTimers(now);
      }

      vsm.onStats({ timestamp: now + 1000, bytes: bytes }, callback);

      expect(callback.calledWith(1)).to.equal(true);
      expect(vsm.getVideoScoreAverage()).to.equal(1);
    });
  });

  describe('targetBitrateForPixelCount', () => {
    it('calculates pixels correctly', () => {
      expect(StreamQualityMos.targetBitrateForPixelCount(2500)).to.equal(
        10 ** (2.069924867 * Math.log10(2500) ** 0.6250223771)
      );
    });
  });
});
