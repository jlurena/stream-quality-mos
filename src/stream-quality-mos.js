export default class StreamQualityMos {
  /**
   * @typedef {Object} stats
   * @property {number} timestamp Timestamp the video statistics took place.
   * @property {number} bytes Bytes sent or received.
   */

  /**
   * @typedef {Object} videoDimensions
   * @param {number} width The width of the video container.
   * @param {number} height The height of the video container
   */

  /**
   * Initializes a StreamQualityMos class.
   *
   * @param {videoDimensions} videoDimensions Video dimensions of container window.
   * @param {{
   *          statsLogTimeSample: number,
   *          scoreTimeWindow: number,
   *          minVideoBitrate: number,
   *          maxStatsLogLength: number}=} opts Optional arguments to further tweek MOS calculations. Defaults are set for ideal video stream.
   */
  constructor(videoDimensions, opts) {
    const defaultOptions = {
      statsLogTimeSample: 1000,
      scoreTimeWindow: 5000,
      minVideoBitrate: 30000,
      maxStatsLogLength: 10
    };

    const options = { ...defaultOptions, ...opts };

    this.statsLogTimeSample = options.statsLogTimeSample;
    this.scoreTimeWindow = options.scoreTimeWindow;
    this.minVideoBitrate = options.minVideoBitrate;
    this.maxStatsLogLength = options.maxStatsLogLength;

    this.statsStartTestTime = 0;
    this.statsWindowTestTime = 0;
    this.statsLog = [];
    this.videoScoreAverage = 0;
    if (videoDimensions) {
      this.videoDimensions = videoDimensions;
    }
  }

  /**
   * Calculates the most optimal bitrate for a video stream container.
   * @see {@link https://www.silverjuke.net/public/misc/bitrate-calculator.html}
   *
   * @param {number} pixelCount Total pixels in container.
   */
  static targetBitrateForPixelCount(pixelCount) {
    const y = 2.069924867 * Math.log10(pixelCount) ** 0.6250223771;
    return 10 ** y;
  }

  /**
   * Calculates the mean opinion score of the quality of the video stream.
   * Score varies from 0-5 where 5 is excellent and 0 is horrible.
   *
   * @param {stats} lastStats The previous statistics of the video stream.
   * @param {stats} currentStats The most current statistics of the video stream.
   * @param {videoDimensions} videoDimensions The videoDimensions of the container
   * @param {number} [minVideoBitrate=30000] The minimum video bitrate to compare to.
   * @param {boolean} [roundScore=true] roundScore Whether to round the score to nearest whole number or not.
   */
  static calculateStats(lastStats, currentStats, videoDimensions, minVideoBitrate = 30000, roundScore = true) {
    const interval = currentStats.timestamp - lastStats.timestamp;
    let bitrate = 8 * (currentStats.bytes - lastStats.bytes);
    bitrate *= interval / 1000;

    const pixelCount = videoDimensions.width * videoDimensions.height;
    const targetBitrate = StreamQualityMos.targetBitrateForPixelCount(pixelCount);
    if (bitrate < minVideoBitrate) {
      return 0;
    }

    bitrate = Math.min(bitrate, targetBitrate);
    let score = Math.log(bitrate / minVideoBitrate) / Math.log(targetBitrate / minVideoBitrate);
    score = score * 4 + 1;
    return roundScore ? Math.round(score) : score;
  }

  /**
   * Sets the video dimensions.
   *
   * @param {videoDimensions} videoDimensions The video dimensions.
   */
  setVideoDimensions(videoDimensions) {
    this.videoDimensions = videoDimensions;
  }

  /**
   * Get the current video score average.
   */
  getVideoScoreAverage() {
    return this.videoScoreAverage;
  }

  /**
   *
   * @param {stats} stats The current video stats
   * @param {function(number)=} onMosResult Callback passing in the MOS score.
   */
  onStats(stats, onMosResult) {
    const currentTimeMillis = Date.now();
    if (!this.videoDimensions) {
      console.error('Video Dimensions have not been set.');
      return;
    }
    if (this.statsStartTestTime === 0) {
      this.statsStartTestTime = currentTimeMillis;
      this.statsWindowTestTime = currentTimeMillis;
    }

    if (currentTimeMillis - this.statsStartTestTime >= this.statsLogTimeSample) {
      this.statsLog.push(stats);
      if (this.statsLog.length < 2) {
        return;
      }
      if (this.statsLog.length > this.maxStatsLogLength) {
        this.statsLog.shift();
      }
      this.statsStartTestTime = Date.now();
    }

    if (currentTimeMillis - this.statsWindowTestTime >= this.scoreTimeWindow) {
      let videoScoreAverage = 0;
      for (let index = 1; index < this.statsLog.length; index += 1) {
        videoScoreAverage += StreamQualityMos.calculateStats(
          this.statsLog[index],
          this.statsLog[index - 1],
          this.videoDimensions,
          this.minVideoBitrate
        );
      }
      videoScoreAverage /= this.statsLog.length;

      this.videoScoreAverage = Math.round(videoScoreAverage);
      if (onMosResult) {
        onMosResult(this.videoScoreAverage);
      }
      this.statsWindowTestTime = Date.now();
    }
  }
}
