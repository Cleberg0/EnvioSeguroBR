const cpf1 = "24092663803";
const cpf2 = "04355543013";
const key = "344f68668e41841756df498618bfccef";

// Test with full browser-like headers to bypass Cloudflare
async function testCPF(cpf) {
  const url = `https://public.livescript.dev/apis/cpfcompleta/${cpf}?key=${key}`;
  console.log(`\n--- Testing CPF: ${cpf} ---`);
  console.log("URL:", url);

  const res = await fetch(url, {
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1"
    }
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response (first 500):", text.substring(0, 500));

  try {
    const json = JSON.parse(text);
    console.log("JSON keys:", Object.keys(json));
    console.log("Full JSON:", JSON.stringify(json, null, 2).substring(0, 1000));
  } catch(e) {
    console.log("Not JSON - blocked by Cloudflare");
  }
}

// Also test old API
async function testOldAPI(cpf) {
  const url = `http://base2.sistemafull.site:80/api/cpfx?CPF=${cpf}`;
  console.log(`\n--- Testing OLD API: ${cpf} ---`);
  console.log("URL:", url);

  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.substring(0, 500));
  } catch(e) {
    console.log("Error:", e.message);
  }
}

await testCPF(cpf1);
await testCPF(cpf2);
await testOldAPI(cpf1);
