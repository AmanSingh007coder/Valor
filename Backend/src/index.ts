// Add these imports at the top
import axios from 'axios';

// 1. LIVE NEWS TOOL (Using Tavily)
server.tool("get_triangulated_intel", { 
  supplierId: z.string(), 
  lat: z.number(), 
  lng: z.number(), 
  name: z.string() 
}, async ({ supplierId, lat, lng, name }) => {
  const state = await getWorldState();
  const s = state.suppliers.find((sup: any) => sup.id === supplierId);

  // 1. Fetch LIVE News via Tavily
  let liveNews = s.internet_news; 
  try {
    const newsRes = await axios.post('https://api.tavily.com/search', {
      api_key: process.env.TAVILY_API_KEY,
      query: `${name} corporate safety reputation environmental reports 2026`,
      search_depth: "basic"
    });
    // Use live news if it's "Normal production", otherwise keep the simulated news
    if (s.internet_news.includes("Normal")) {
        liveNews = newsRes.data.results[0]?.content || liveNews;
    }
  } catch (e) { console.error("News API Error"); }

  // 2. Fetch LIVE Weather via OpenWeather
  let weatherReport = "CLEAR_VISIBILITY";
  try {
    const wRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}`);
    if (wRes.data.weather[0].main === "Thunderstorm" || wRes.data.weather[0].main === "Rain") {
        weatherReport = "OBSCURED_BY_STORM";
    }
  } catch (e) { console.error("Weather API Error"); }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        web_news: liveNews,
        satellite_view: weatherReport,
        gps_status: weatherReport === "CLEAR_VISIBILITY" ? "OPTIMAL" : "DEGRADED"
      })
    }]
  };
});