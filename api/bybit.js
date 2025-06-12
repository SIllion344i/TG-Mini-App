export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET is allowed' });
  }

  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'API credentials not set' });
  }

  const recvWindow = "5000";
  const timestamp = Date.now().toString();
  const paramStr = "accountType=UNIFIED";
  const signStr = timestamp + apiKey + recvWindow + paramStr;

  const crypto = await import('crypto');
  const hmac = crypto.createHmac('sha256', apiSecret);
  hmac.update(signStr);
  const signature = hmac.digest('hex');

  try {
    const response = await fetch("https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED", {
      method: "GET",
      headers: {
        "X-BAPI-API-KEY": apiKey,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": recvWindow,
      },
    });

    const data = await response.json();
    if (data.retCode !== 0) {
      return res.status(400).json({ error: data.retMsg });
    }

    const balance = parseFloat(data.result.list[0].totalEquity || 0);
    res.status(200).json({ balance });
  } catch (err) {
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}
