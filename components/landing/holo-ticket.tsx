export function HoloTicket({
  title,
  date,
  from,
  to,
  seat,
}: {
  title: string;
  date: string;
  from: string;
  to: string;
  seat: string;
}) {
  return (
    <div className="holo-ticket">
      <div className="holo-ticket__notes" aria-hidden>
        ♪♪♪♪♪
      </div>
      <div className="holo-ticket__notes is-2" aria-hidden>
        ♪♪♪♪
      </div>
      <div className="holo-ticket__notes is-3" aria-hidden>
        ♪♪♪♪♪
      </div>

      <div className="holo-ticket__header">
        TICKET
        <div className="holo-ticket__symbol">✁</div>
      </div>
      <div className="holo-ticket__body">
        <em>{title}</em>
        <br />
        {date}
        <br />
        {from} → {to}
      </div>
      <div className="holo-ticket__footer">
        <div className="holo-ticket__number">
          Seat <span>{seat}</span>
        </div>
        <div className="holo-ticket__barcode" aria-hidden />
      </div>

      <div className="holo-ticket__foil" />
      <svg className="holo-ticket__filter" aria-hidden>
        <filter id="holo-bump">
          <feTurbulence
            result="noise"
            numOctaves="3"
            baseFrequency="0.7"
            type="fractalNoise"
          />
          <feSpecularLighting
            in="noise"
            result="specular"
            lightingColor="#fffffc"
            specularExponent="25"
            specularConstant="0.8"
            surfaceScale="0.15"
          >
            <fePointLight z="210" y="100" x="100" />
          </feSpecularLighting>
          <feComposite
            result="noise2"
            operator="in"
            in="specular"
            in2="SourceGraphic"
          />
          <feBlend mode="screen" in2="noise2" in="SourceGraphic" />
        </filter>
      </svg>
    </div>
  );
}
