
const https = require('https');

const apiKey = "AIzaSyBV5rJx2XdnJNhcvttCd6-1wwwyCB1H3mg";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        json.models.forEach(m => console.log(m.name));
      } else {
        console.log("No models found or error:", json);
      }
    } catch (e) {
      console.error("Error parsing JSON:", e);
      console.log("Raw data:", data);
    }
  });
}).on('error', (e) => {
  console.error("Error:", e);
});
