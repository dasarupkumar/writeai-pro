const crypto = require('crypto');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (expectedSig === razorpay_signature) {
    res.json({ verified: true, paymentId: razorpay_payment_id });
  } else {
    res.status(400).json({ verified: false });
  }
};
