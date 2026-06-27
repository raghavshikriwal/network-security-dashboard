import React, { useEffect, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ThreatPin {
  id: string;
  coordinates: [number, number];
  severity: string;
  label: string;
  ts: number;
}

interface ThreatMapProps {
  liveThreats?: Array<{
    id: number | string;
    sourceIp?: string;
    severity?: string;
    title?: string;
  }>;
}

const IP_GEO: Array<{ prefix: string; lat: number; lng: number; city: string }> = [
  { prefix: "1.",   lat: -33.87, lng: 151.21, city: "Sydney"      },
  { prefix: "2.",   lat:  48.86, lng:   2.35, city: "Paris"       },
  { prefix: "5.",   lat:  55.75, lng:  37.62, city: "Moscow"      },
  { prefix: "8.",   lat:  37.42, lng: -122.09,city: "Mountain View"},
  { prefix: "14.",  lat:  39.93, lng: 116.39, city: "Beijing"     },
  { prefix: "31.",  lat:  55.75, lng:  37.62, city: "Moscow"      },
  { prefix: "37.",  lat:  51.51, lng:  -0.13, city: "London"      },
  { prefix: "41.",  lat:  -1.29, lng:  36.82, city: "Nairobi"     },
  { prefix: "45.",  lat:  31.23, lng: 121.47, city: "Shanghai"    },
  { prefix: "46.",  lat:  59.33, lng:  18.07, city: "Stockholm"   },
  { prefix: "52.",  lat:  39.05, lng: -77.49, city: "Ashburn"     },
  { prefix: "54.",  lat:  47.61, lng: -122.33,city: "Seattle"     },
  { prefix: "60.",  lat:  35.69, lng: 139.69, city: "Tokyo"       },
  { prefix: "61.",  lat:  37.57, lng: 126.98, city: "Seoul"       },
  { prefix: "66.",  lat:  43.65, lng: -79.38, city: "Toronto"     },
  { prefix: "74.",  lat:  40.71, lng: -74.01, city: "New York"    },
  { prefix: "77.",  lat:  52.52, lng:  13.41, city: "Berlin"      },
  { prefix: "80.",  lat:  41.01, lng:  28.97, city: "Istanbul"    },
  { prefix: "91.",  lat:  50.45, lng:  30.52, city: "Kyiv"        },
  { prefix: "103.", lat:  28.61, lng:  77.21, city: "Delhi"       },
  { prefix: "104.", lat:  37.77, lng: -122.42,city: "San Francisco"},
  { prefix: "107.", lat:  33.75, lng: -84.39, city: "Atlanta"     },
  { prefix: "109.", lat:  48.20, lng:  16.37, city: "Vienna"      },
  { prefix: "120.", lat:  22.54, lng: 114.06, city: "Shenzhen"    },
  { prefix: "141.", lat:  24.87, lng:  67.01, city: "Karachi"     },
  { prefix: "154.", lat:   6.45, lng:   3.39, city: "Lagos"       },
  { prefix: "162.", lat: -23.55, lng: -46.63, city: "São Paulo"   },
  { prefix: "163.", lat:  13.75, lng: 100.52, city: "Bangkok"     },
  { prefix: "185.", lat:  52.37, lng:   4.90, city: "Amsterdam"   },
  { prefix: "186.", lat: -22.91, lng: -43.17, city: "Rio"         },
  { prefix: "192.", lat:  39.05, lng: -77.49, city: "Virginia"    },
  { prefix: "194.", lat:  48.85, lng:   2.35, city: "Paris"       },
  { prefix: "195.", lat:  51.51, lng:  -0.13, city: "London"      },
  { prefix: "198.", lat:  37.77, lng: -122.42,city: "San Francisco"},
  { prefix: "200.", lat: -34.61, lng: -58.38, city: "Buenos Aires"},
  { prefix: "202.", lat:  35.69, lng: 139.69, city: "Tokyo"       },
  { prefix: "210.", lat: -33.87, lng: 151.21, city: "Sydney"      },
  { prefix: "211.", lat:  37.57, lng: 126.98, city: "Seoul"       },
  { prefix: "212.", lat:  51.51, lng:  -0.13, city: "London"      },
  { prefix: "218.", lat:  31.23, lng: 121.47, city: "Shanghai"    },
];

function ipToCoords(ip: string): { lat: number; lng: number; city: string } | null {
  for (const entry of IP_GEO) {
    if (ip.startsWith(entry.prefix)) {
      const jitter = (parseInt(ip.split(".")[2] ?? "0") % 20) * 0.15 - 1.5;
      return { lat: entry.lat + jitter, lng: entry.lng + jitter, city: entry.city };
    }
  }
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts.every(n => !isNaN(n))) {
    return {
      lat: ((parts[0]! * 137 + parts[1]!) % 160) - 80,
      lng: ((parts[1]! * 97 + parts[2]!) % 350) - 175,
      city: ip,
    };
  }
  return null;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff3333",
  high:     "#ff8800",
  medium:   "#ffcc00",
  low:      "#00aaff",
};

const PULSE_DURATION: Record<string, number> = {
  critical: 800,
  high:     1100,
  medium:   1400,
  low:      1700,
};

export default function ThreatMap({ liveThreats = [] }: ThreatMapProps) {
  const [pins, setPins] = useState<ThreatPin[]>([]);
  const pinIdRef = useRef(0);

  useEffect(() => {
    if (!liveThreats.length) return;
    const newPins: ThreatPin[] = [];
    for (const t of liveThreats) {
      if (!t.sourceIp) continue;
      const geo = ipToCoords(t.sourceIp);
      if (!geo) continue;
      newPins.push({
        id: `db-${t.id}`,
        coordinates: [geo.lng, geo.lat],
        severity: t.severity ?? "low",
        label: geo.city,
        ts: Date.now(),
      });
    }
    setPins(newPins.slice(0, 50));
  }, [liveThreats]);

  const addLivePin = (threat: { sourceIp?: string; severity?: string; title?: string }) => {
    if (!threat.sourceIp) return;
    const geo = ipToCoords(threat.sourceIp);
    if (!geo) return;
    const pin: ThreatPin = {
      id: `live-${++pinIdRef.current}`,
      coordinates: [geo.lng, geo.lat],
      severity: threat.severity ?? "low",
      label: geo.city,
      ts: Date.now(),
    };
    setPins(prev => {
      const next = [...prev, pin];
      return next.slice(-50);
    });
  };

  (ThreatMap as unknown as { addPin: typeof addLivePin }).addPin = addLivePin;

  const now = Date.now();

  return (
    <div className="w-full h-full relative bg-[#040810]">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 130, center: [10, 15] }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={4}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: "#0d1a2e", stroke: "#1a2f4e", strokeWidth: 0.4, outline: "none" },
                    hover:   { fill: "#0f2040", stroke: "#1a2f4e", strokeWidth: 0.4, outline: "none" },
                    pressed: { fill: "#0d1a2e", stroke: "#1a2f4e", strokeWidth: 0.4, outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {pins.map(pin => {
            const age = now - pin.ts;
            const color = SEVERITY_COLORS[pin.severity] ?? "#00aaff";
            const pulseDur = PULSE_DURATION[pin.severity] ?? 1400;
            const fresh = age < 8000;

            return (
              <Marker key={pin.id} coordinates={pin.coordinates}>
                {fresh && (
                  <>
                    <circle r={14} fill="none" stroke={color} strokeWidth={1} opacity={0.6}>
                      <animate attributeName="r" from="4" to="18" dur={`${pulseDur}ms`} repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.8" to="0" dur={`${pulseDur}ms`} repeatCount="indefinite" />
                    </circle>
                    <circle r={8} fill="none" stroke={color} strokeWidth={0.8} opacity={0.4}>
                      <animate attributeName="r" from="2" to="10" dur={`${pulseDur * 0.7}ms`} repeatCount="indefinite" begin={`${pulseDur * 0.2}ms`} />
                      <animate attributeName="opacity" from="0.6" to="0" dur={`${pulseDur * 0.7}ms`} repeatCount="indefinite" begin={`${pulseDur * 0.2}ms`} />
                    </circle>
                  </>
                )}
                <circle
                  r={fresh ? 4 : 3}
                  fill={color}
                  stroke={color}
                  strokeWidth={0.5}
                  fillOpacity={fresh ? 1 : 0.6}
                  style={{ filter: fresh ? `drop-shadow(0 0 4px ${color})` : "none" }}
                />
                {fresh && (
                  <text
                    y={-10}
                    textAnchor="middle"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "8px",
                      fill: color,
                      opacity: 0.9,
                      pointerEvents: "none",
                    }}
                  >
                    {pin.label}
                  </text>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute bottom-2 left-3 flex flex-col gap-1">
        {(["critical", "high", "medium", "low"] as const).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SEVERITY_COLORS[s], boxShadow: `0 0 4px ${SEVERITY_COLORS[s]}` }}
            />
            <span className="text-[9px] font-mono uppercase" style={{ color: SEVERITY_COLORS[s] }}>{s}</span>
          </div>
        ))}
      </div>

      <div className="absolute top-2 right-3 text-[9px] font-mono text-cyan-500/60 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
        LIVE_FEED
      </div>
    </div>
  );
}
