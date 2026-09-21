export function EarthGlobe() {
  return (
    <div className="earth-globe" role="img" aria-label="Rotating Earth">
      <div className="earth-globe__atmosphere" aria-hidden />
      <div className="earth-globe__sphere">
        <div className="earth-globe__map" />
      </div>
      <div className="earth-globe__shade" aria-hidden />
    </div>
  );
}
