import type { NextApiRequest, NextApiResponse } from "next";
import * as cheerio from "cheerio";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Attempt various strategies for each field
    const getTitle = () =>
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="title"]').attr("content") ||
      $('h1').first().text().trim() ||
      $('title').text().trim();

    const getCompany = () =>
      $('meta[name="company"]').attr("content") ||
      $('[class*="company"], [class*="employer"], [data-company]').first().text().trim() ||
      $('[aria-label*="Company"]').first().text().trim();

    const getLocation = () => {
      const bodyText = $("body").text();
      const locationFromClass = $('[class*="location"], [data-location]').first().text().trim();
      const remoteKeywords = /(remote|work from home)/i;

      if (remoteKeywords.test(bodyText)) return "Remote";
      if (locationFromClass) return locationFromClass;
      return "N/A";
    };

    const title = getTitle();
    const company = getCompany();
    const location = getLocation();

    return res.status(200).json({ title, company, location });

  // ✅ Fix below
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Scrape failed:", err);
    return res.status(500).json({ error: "Failed to parse job posting." });
  }
}
