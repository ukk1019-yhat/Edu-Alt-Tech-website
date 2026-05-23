import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Must use POST.' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_secret) {
    return res.status(500).json({ error: 'Razorpay secret key is missing from the Vercel Production Environment Variables.' });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required signature verification fields.' });
  }

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.status(200).json({ success: true, message: "Payment successfully verified." });
    } else {
      return res.status(400).json({ success: false, error: "Payment verification failed. Invalid secure signature." });
    }
  } catch (error: any) {
    console.error('Error authenticating payment:', error);
    return res.status(500).json({ error: error.message || 'Failed to authenticate payment on server' });
  }
}
