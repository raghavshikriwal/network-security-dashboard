import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { db, threatsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function generateRiskScore(ip: string): number {
  let score = 0;
  const parts = ip.split(".");
  if (parts.length === 4) {
    const lastOctet = parseInt(parts[3] ?? "0");
    score = (lastOctet * 17 + 23) % 100;
  }
  return Math.max(5, Math.min(95, score));
}

const GEO_MAP: Record<string, { country: string; countryCode: string; region: string; city: string; isp: string; org: string; timezone: string }> = {
  "1.": { country: "Australia", countryCode: "AU", region: "NSW", city: "Sydney", isp: "APNIC", org: "APNIC", timezone: "Australia/Sydney" },
  "2.": { country: "France", countryCode: "FR", region: "Ile-de-France", city: "Paris", isp: "France Telecom", org: "Orange S.A.", timezone: "Europe/Paris" },
  "8.": { country: "United States", countryCode: "US", region: "California", city: "Mountain View", isp: "Google LLC", org: "Google LLC", timezone: "America/Los_Angeles" },
  "31.": { country: "Russia", countryCode: "RU", region: "Moscow", city: "Moscow", isp: "Yandex LLC", org: "Yandex LLC", timezone: "Europe/Moscow" },
  "45.": { country: "China", countryCode: "CN", region: "Beijing", city: "Beijing", isp: "China Unicom", org: "China Unicom", timezone: "Asia/Shanghai" },
  "185.": { country: "Netherlands", countryCode: "NL", region: "North Holland", city: "Amsterdam", isp: "Leaseweb", org: "Leaseweb Nederland B.V.", timezone: "Europe/Amsterdam" },
  "192.": { country: "United States", countryCode: "US", region: "Virginia", city: "Ashburn", isp: "Amazon.com Inc.", org: "AWS", timezone: "America/New_York" },
  "10.": { country: "Private Network", countryCode: "XX", region: "Local", city: "Local", isp: "Private", org: "Private", timezone: "UTC" },
  "172.": { country: "Private Network", countryCode: "XX", region: "Local", city: "Local", isp: "Private", org: "Private", timezone: "UTC" },
};

router.get("/iplookup", requireAuth, async (req, res) => {
  try {
    const { ip } = req.query as { ip?: string };

    if (!ip) {
      res.status(400).json({ error: "IP address is required" });
      return;
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      res.status(400).json({ error: "Invalid IP address format" });
      return;
    }

    let geoData = {
      country: "Unknown",
      countryCode: "XX",
      region: "Unknown",
      city: "Unknown",
      isp: "Unknown ISP",
      org: "Unknown Organization",
      timezone: "UTC",
    };

    for (const [prefix, data] of Object.entries(GEO_MAP)) {
      if (ip.startsWith(prefix)) {
        geoData = data;
        break;
      }
    }

    const riskScore = generateRiskScore(ip);
    const isHighRisk = riskScore > 70;
    const isVpn = riskScore > 60 && riskScore < 75;
    const isTor = riskScore > 85;
    const isProxy = riskScore > 75 && riskScore <= 85;

    const ipThreats = await db
      .select()
      .from(threatsTable)
      .where(eq(threatsTable.sourceIp, ip));

    const lat = parseFloat(ip.split(".")[0] ?? "0") * 1.2 - 90;
    const lng = parseFloat(ip.split(".")[1] ?? "0") * 1.4 - 180;

    res.json({
      ip,
      country: geoData.country,
      countryCode: geoData.countryCode,
      region: geoData.region,
      city: geoData.city,
      isp: geoData.isp,
      org: geoData.org,
      latitude: Math.max(-90, Math.min(90, lat)),
      longitude: Math.max(-180, Math.min(180, lng)),
      timezone: geoData.timezone,
      isVpn,
      isTor,
      isProxy,
      riskScore,
      threatHistory: ipThreats.length,
    });
  } catch (err) {
    req.log.error({ err }, "IP lookup error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
