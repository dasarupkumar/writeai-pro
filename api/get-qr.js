module.exports = (req, res) => {
  const { amount } = req.query;
  const upiId   = process.env.UPI_ID;
  const name    = process.env.BUSINESS_NAME;
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount||""}&cu=INR`;
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff&color=0D0D1A&margin=10`;
  res.redirect(qrUrl);
};
