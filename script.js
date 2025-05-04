const apiKey = 'AE77P94G1B9MXWCX'; // Read API Key
const writeApiKey = 'D852Q66NL5331WC3'; // Replace with your Write API Key
const channelId = '2942405';

const fanField = 'field3';
const temperatureField = 'field1';
const humidityField = 'field2';

let chart;

// Fetch data from ThingSpeak
async function fetchData() {
  const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=60`;
  const res = await fetch(url);
  const data = await res.json();
  return data.feeds;
}

// Update live temperature, humidity, and fan status
async function updateLiveValues() {
  try {
    const feeds = await fetchData();
    const latest = feeds[feeds.length - 1];

    document.getElementById('temperature').innerText = `${latest[temperatureField]} °C`;
    document.getElementById('humidity').innerText = `${latest[humidityField]} %`;

    const fanStatus = latest[fanField] === '1' ? 'ON' : 'OFF';
    document.getElementById('fan-status').innerText = fanStatus;
    document.getElementById('fan-toggle').checked = latest[fanField] === '1';
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}

// Show graph of temperature or humidity
async function showGraph(type) {
  const feeds = await fetchData();
  const labels = feeds.map(f => new Date(f.created_at).toLocaleTimeString());
  const data = feeds.map(f =>
    parseFloat(f[type === 'temperature' ? temperatureField : humidityField])
  );

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById('graphCanvas'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} over Time`,
        data: data,
        borderColor: type === 'temperature' ? 'orange' : 'blue',
        backgroundColor: 'rgba(0,0,0,0.05)',
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

// Send 1/0 to ThingSpeak when fan toggle changes
document.getElementById('fan-toggle').addEventListener('change', async function () {
  const state = this.checked ? 1 : 0;
  const updateUrl = `https://api.thingspeak.com/update?api_key=${writeApiKey}&${fanField}=${state}`;

  try {
    await fetch(updateUrl);
    // Wait for ThingSpeak to register update
    setTimeout(updateLiveValues, 3000);
  } catch (err) {
    console.error("Error updating fan state:", err);
  }
});

// Load values initially and every 15 seconds
setInterval(updateLiveValues, 5000);
updateLiveValues();
showGraph('temperature'); // Load temperature graph by default
