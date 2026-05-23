import Razorpay from 'razorpay';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Must use POST.' });
  }

  const { amount } = req.body;
  
  if (!amount) {
    return res.status(400).json({ error: 'Payment amount is required in the body' });
  }

  const key_id = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_live_SUbr4cftio73uJ";
  const key_secret = process.env.RAZORPAY_KEY_SECRET; // This MUST be set in Vercel Dashboard

  if (!key_secret) {
    return res.status(500).json({ error: 'Razorpay secret key is missing from the Vercel Production Environment Variables.' });
  }

  try {
    const razorpay = new Razorpay({ key_id, key_secret });
    
    const order = await razorpay.orders.create({
      amount: amount, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });

    return res.status(200).json(order);
  } catch (error: any) {
    console.error('Error generating Vercel Razorpay Order:', error);
    return res.status(500).json({ error: error.message || 'Failed to create payment order on Vercel Node server' });
  }
}
