const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const rzp = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  const { amount, planId } = req.body;
  const order = await rzp.orders.create({
    amount:   amount * 100,
    currency: 'INR',
    receipt:  `writeai_${planId}_${Date.now()}`,
  });
  res.json({ orderId: order.id });
};
