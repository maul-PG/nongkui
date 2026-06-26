import type { NextApiRequest, NextApiResponse } from 'next';
import { prismaClient } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid cafe ID parameter.' });
  }

  try {
    // 1. Fetch base cafe details from Supabase
    const cafe = await prismaClient.cafe.findUnique({
      where: { id },
      include: { menus: true }
    });

    if (!cafe) {
      return res.status(404).json({ error: 'Cafe not found.' });
    }

    let realtimeGoogleData = null;

    // 2. Fetch real-time status from Google Places Details API if googlePlaceId exists
    if (cafe.googlePlaceId) {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${cafe.googlePlaceId}&fields=opening_hours,rating&key=${apiKey}`;
        try {
          const apiRes = await fetch(url);
          const apiData = await apiRes.json();

          if (apiData.status === 'OK' && apiData.result) {
            realtimeGoogleData = {
              rating: apiData.result.rating || null,
              openingHoursLive: apiData.result.opening_hours || null
            };
          }
        } catch (err: any) {
          console.error(`Failed to fetch Google Place details for ID ${cafe.googlePlaceId}:`, err.message);
        }
      }
    }

    // 3. Return the merged payload
    return res.status(200).json({
      ...cafe,
      realtime: realtimeGoogleData
    });
  } catch (error: any) {
    console.error('Error in realtime cafe API handler:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
