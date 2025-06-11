import fetch from 'node-fetch';
import fs from 'fs';

const buoyId = '46053';
const forecastLat = 34.060205;
const forecastLon = -119.531650;

async function getBuoyData() {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n');
    const dataLine = lines.find(line => !line.startsWith('#') && line.trim());
    const parts = dataLine.trim().split(/\s+/);
    const waterTemp = parseFloat(parts[14]);
    const dateStr = parts.slice(0, 5).join(' ');
    return { waterTemperature: waterTemp, waterTempTimestamp: dateStr };
  } catch (e) {
    return { waterTemperature: null, waterTempTimestamp: null };
  }
}

async function getMarineForecast() {
  const res = await fetch(`https://marine.weather.gov/MapClick.php?lat=${forecastLat}&lon=${forecastLon}&FcstType=json`);
  const data = await res.json();
  const marineText = data.marine && data.marine.data;
  const windDir = marineText?.wind_dir?.[0] || "N/A";
  const windSpeed = marineText?.wind_spd?.[0] || "N/A";
  const swellHeight = marineText?.wvhgt?.[0] || "N/A";
  const swellDir = marineText?.wvdir?.[0] || "N/A";
  const swellPeriod = marineText?.wvper?.[0] || "N/A";

return {
  forecastTime: new Date().toISOString(),
  wind: {
    direction: windDir || "N/A",
    speed: windSpeed || "N/A"
  },
  swell: {
    height: swellHeight || "N/A",
    direction: swellDir || "N/A",
    period: swellPeriod || "N/A"
  }
};

}

async function compileData() {
  const buoy = await getBuoyData();
  const forecast = await getMarineForecast();

  const fullData = {
    ...buoy,
    forecast,
    fetchedAtUTC: new Date().toISOString()
  };

  fs.writeFileSync('data.json', JSON.stringify(fullData, null, 2));
}

compileData();
