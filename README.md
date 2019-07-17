# StreamQualityMOS

StreamQualityMOS is a Javascript package used to calculate the [MOS](https://en.wikipedia.org/wiki/Mean_opinion_score) (mean opinion score) of a video stream quality. The score ranges from 0-5, zero being the worse and 5 being the best.

### Installation and Usage

Install with npm or yarn
```sh
$ npm install stream-quality-mos # NPM
$ yarn add stream-quality-mos  # Yarn
```

Usage
```javascript
import StreamQualityMos from 'stream-quality-mos';

const fakeStream = new FakeVideoStream();
const streamQualityMos = new StreamQualityMos({ width: 400, height: 400 });
setInterval( () => {
    const fakeStats = { timestamp: fakeStream.timestamp, bytes: fakeStream.bytesSent }
    streamQualityMos.onStats(fakeStats, (score) => console.log(score))
}, 1000);
```

### Development

Want to contribute? Great!

Just create a PR and make sure tests pass with `npm test`.

### Todos

 - Calculate Audio MOS score and incorporate it with Video MOS score.

### Credits

[Charlie Robinson](https://github.com/wobbals) and his repo [opentok-mos-estimator](https://github.com/wobbals/opentok-mos-estimator)