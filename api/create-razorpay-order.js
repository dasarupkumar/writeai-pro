module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { amount, planId } = req.body;

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const auth      = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount:   amount * 100,
        currency: "INR",
        receipt:  `writeai_${planId}_${Date.now()}`,
      }),
    });

    const order = await response.json();

    if (order.id) {
      res.json({ orderId: order.id });
    } else {
      console.error("Razorpay error:", order);
      res.status(500).json({ error: order.error?.description || "Order creation failed" });
    }
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: err.message });
  }
};
