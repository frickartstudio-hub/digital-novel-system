
const https = require('https');

const apiKey = "AIzaSyBV5rJx2XdnJNhcvttCd6-1wwwyCB1H3mg";
const model = "gemini-2.5-flash-image";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

const payload = {
    contents: [
        {
            role: "user",
            parts: [{ text: "A cute cat" }],
        },
    ],
    generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
    },
};

if (model !== "gemini-2.5-flash-image") {
    payload.generationConfig.imageConfig = {
        imageSize: "1K",
    };
}

const req = https.request(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log("Status:", res.statusCode);
        console.log("Body:", data);
    });
});

req.on('error', (e) => {
    console.error("Error:", e);
});

req.write(JSON.stringify(payload));
req.end();
