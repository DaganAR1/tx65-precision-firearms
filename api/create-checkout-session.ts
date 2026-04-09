import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(410).json({ error: "Stripe is no longer supported for firearms. Use Authorize.net." });
}
