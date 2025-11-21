interface TimelineRulerProps {
  totalBars?: number;
}

const GRID_SIZE = 60;

export function TimelineRuler({ totalBars = 128 }: TimelineRulerProps) {
  return (
    <div className="timeline-ruler">
      <div className="ruler-offset"></div>
      <div className="ruler-marks">
        {Array.from({ length: totalBars }, (_, i) => (
          <div
            key={i}
            className={`ruler-mark ${i % 4 === 0 ? 'major' : 'minor'}`}
            style={{ left: `${i * GRID_SIZE}px` }}
          >
            <span className="ruler-label">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
