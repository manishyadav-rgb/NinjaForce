const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const categories = [
  {
    name: 'Bedsheet',
    keywords: [
      'bedsheet wholesaler',
      'bedsheet manufacturer',
      'cotton bedsheet supplier',
      'home furnishing bedsheet seller',
      'bed linen distributor',
    ],
  },
  {
    name: 'Sofa Cover',
    keywords: [
      'sofa cover wholesaler',
      'sofa cover manufacturer',
      'sofa set cover supplier',
      'stretch sofa cover seller',
      'home furnishing sofa cover dealer',
    ],
  },
  {
    name: 'Towel',
    keywords: [
      'towel wholesaler',
      'towel manufacturer',
      'bath towel supplier',
      'hotel towel distributor',
      'cotton towel seller',
    ],
  },
  {
    name: 'Curtain',
    keywords: [
      'curtain wholesaler',
      'curtain manufacturer',
      'ready made curtain supplier',
      'home furnishing curtain seller',
    ],
  },
  {
    name: 'Cushion Cover',
    keywords: [
      'cushion cover wholesaler',
      'cushion cover manufacturer',
      'pillow cover supplier',
      'home furnishing cushion cover seller',
    ],
  },
];

const cities = [
  'India',
  'Delhi',
  'Mumbai',
  'Surat',
  'Jaipur',
  'Panipat',
  'Ludhiana',
  'Bengaluru',
  'Ahmedabad',
  'Kolkata',
];

const queryIntents = [
  'contact',
  'mobile',
  'whatsapp',
  'dealer contact',
  'bulk supplier',
];

const platformFilters = [
  { name: 'Google', filter: '' },
  { name: 'IndiaMART', filter: 'site:indiamart.com' },
  { name: 'TradeIndia', filter: 'site:tradeindia.com' },
  { name: 'Justdial', filter: 'site:justdial.com' },
  { name: 'ExportersIndia', filter: 'site:exportersindia.com' },
  { name: 'Sulekha', filter: 'site:sulekha.com' },
  { name: 'Instagram', filter: 'site:instagram.com' },
  { name: 'Facebook', filter: 'site:facebook.com' },
];

const maxQueriesPerCategory = 40;
const maxPagesToVisitPerQuery = 8;
const outputFile = path.join(__dirname, 'sellers_list.csv');

const phoneRegex =
  /(?:\+91[\s-]?)?(?:0[\s-]?)?[6-9](?:[\d\s-]{8,13}\d)/g;

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizePhone(value) {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    return digits.slice(1);
  }

  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return digits.slice(2);
  }

  return null;
}

function csvValue(value) {
  const text = String(value || '');
  return `"${text.replace(/"/g, '""')}"`;
}

function createSearchQueries() {
  const queries = [];

  for (const category of categories) {
    for (const city of cities.slice(0, 7)) {
      queries.push({
        category: category.name,
        platform: 'HighIntent',
        query: `${category.name} wholesaler ${city} contact number whatsapp`,
      });
      queries.push({
        category: category.name,
        platform: 'Directory',
        query: `${category.name} supplier ${city} IndiaMART TradeIndia Justdial contact`,
      });
      queries.push({
        category: category.name,
        platform: 'BusinessListing',
        query: `${category.name} manufacturer ${city} mobile number`,
      });
    }

    for (const keyword of category.keywords) {
      for (const city of cities) {
        for (const intent of queryIntents) {
          for (const platform of platformFilters) {
            const query = [platform.filter, keyword, city, intent]
              .filter(Boolean)
              .join(' ');

            queries.push({
              category: category.name,
              platform: platform.name,
              query,
            });
          }
        }
      }
    }
  }

  const grouped = [];
  for (const category of categories) {
    const categoryQueries = queries.filter((item) => item.category === category.name);
    grouped.push(...categoryQueries.slice(0, maxQueriesPerCategory));
  }

  return grouped;
}

function extractContactsFromText(text) {
  const clean = cleanText(text);
  const phones = [...new Set((clean.match(phoneRegex) || []).map(normalizePhone).filter(Boolean))];
  const emails = [...new Set(clean.match(emailRegex) || [])];

  return { phones, emails };
}

function shouldVisitUrl(url) {
  if (!url) {
    return false;
  }

  const blocked = [
    'google.com',
    'webcache',
    'translate.google',
    'youtube.com',
    'maps.google',
    'support.google',
  ];

  return !blocked.some((domain) => url.includes(domain));
}

function normalizeSearchUrl(url) {
  if (!url) {
    return '';
  }

  try {
    const parsed = new URL(url, 'https://www.google.com');

    if (parsed.pathname === '/url' && parsed.searchParams.get('q')) {
      return parsed.searchParams.get('q');
    }

    if (parsed.hostname.includes('google.com')) {
      return '';
    }

    return parsed.href;
  } catch (error) {
    return '';
  }
}

async function extractLeadFromPage(result, queryInfo, browser) {
  if (!shouldVisitUrl(result.url)) {
    return null;
  }

  const detailPage = await browser.newPage();

  try {
    await detailPage.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
    );
    await detailPage.setViewport({ width: 1280, height: 720 });
    await detailPage.goto(result.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await sleep(900);

    const pageData = await detailPage.evaluate(() => {
      const metaDescription =
        document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const bodyText = document.body?.innerText || '';
      const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]')).map((link) =>
        link.getAttribute('href')
      );
      const mailLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]')).map((link) =>
        link.getAttribute('href')
      );
      const whatsappLinks = Array.from(
        document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp.com"]')
      ).map((link) => link.getAttribute('href'));

      return {
        title: document.title || '',
        text: [metaDescription, bodyText, telLinks.join(' '), mailLinks.join(' '), whatsappLinks.join(' ')].join(
          ' '
        ),
      };
    });

    const contacts = extractContactsFromText(pageData.text);

    if (!contacts.phones.length && !contacts.emails.length) {
      return null;
    }

    return {
      Company_Name:
        cleanText(result.title).replace(/\s[-|].*$/, '') ||
        cleanText(pageData.title).replace(/\s[-|].*$/, '') ||
        'Unknown',
      Contact_Number: contacts.phones.join(', '),
      Email: contacts.emails.join(', '),
      Category: queryInfo.category,
      Platform: queryInfo.platform,
      Query: queryInfo.query,
      Source_URL: result.url,
      Snippet: cleanText(result.snippet),
    };
  } catch (error) {
    return null;
  } finally {
    await detailPage.close();
  }
}

async function scrapeSearchResults(queryInfo, page, browser) {
  console.log(`\nSearching: "${queryInfo.query}"`);

  const searchUrl = `https://www.google.com/search?hl=en&gl=in&pws=0&num=10&q=${encodeURIComponent(
    queryInfo.query
  )}`;

  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(1800);

  const results = await page.evaluate(() => {
    const bodyText = document.body?.innerText || '';
    const pageTitle = document.title || '';

    const blocked =
      /unusual traffic|not a robot|our systems have detected|captcha|before you continue/i.test(
        `${pageTitle} ${bodyText}`
      );

    const linkResults = Array.from(document.querySelectorAll('a[href]'))
      .map((link) => {
        const h3 = link.querySelector('h3');
        const container =
          link.closest('div.g') ||
          link.closest('div.MjjYud') ||
          link.closest('div[data-sokoban-container]') ||
          link.parentElement;

        return {
          title: h3?.innerText || link.innerText || '',
          url: link.href || link.getAttribute('href') || '',
          snippet: container?.innerText || '',
        };
      })
      .filter((item) => item.url && !item.url.startsWith('javascript:'));

    const unique = [];
    const seen = new Set();

    for (const item of linkResults) {
      if (seen.has(item.url)) {
        continue;
      }

      seen.add(item.url);
      unique.push(item);
    }

    return {
      blocked,
      pageTitle,
      bodyStart: bodyText.slice(0, 220),
      results: unique,
    };
  });

  const sellers = [];
  const normalizedResults = results.results
    .map((item) => ({
      ...item,
      url: normalizeSearchUrl(item.url),
      title: cleanText(item.title),
      snippet: cleanText(item.snippet),
    }))
    .filter((item) => item.url && shouldVisitUrl(item.url))
    .filter((item) => /indiamart|tradeindia|justdial|exportersindia|sulekha|instagram|facebook|supplier|manufacturer|wholesale|textile|furnishing|linen|towel|bedsheet|curtain|cover/i.test(
      `${item.url} ${item.title} ${item.snippet}`
    ))
    .slice(0, 10);

  if (results.blocked) {
    console.log('Google ne captcha/consent/block page dikhaya. Browser visible mode me run karo: $env:HEADLESS="false"; node scraper.js');
  }

  if (!normalizedResults.length) {
    console.log(`Google page title: ${results.pageTitle}`);
    console.log(`Page text start: ${results.bodyStart}`);
  }

  console.log(`Search results mile: ${normalizedResults.length}`);

  for (const item of normalizedResults) {
    const haystack = cleanText(`${item.title} ${item.snippet}`);
    const { phones, emails } = extractContactsFromText(haystack);

    if (!phones.length && !emails.length) {
      continue;
    }

    sellers.push({
      Company_Name: cleanText(item.title).replace(/\s[-|].*$/, '') || 'Unknown',
      Contact_Number: phones.join(', '),
      Email: emails.join(', '),
      Category: queryInfo.category,
      Platform: queryInfo.platform,
      Query: queryInfo.query,
      Source_URL: item.url,
      Snippet: cleanText(item.snippet),
    });
  }

  const alreadyCapturedUrls = new Set(sellers.map((seller) => seller.Source_URL));
  const detailCandidates = normalizedResults
    .filter((item) => !alreadyCapturedUrls.has(item.url))
    .filter((item) => shouldVisitUrl(item.url))
    .slice(0, maxPagesToVisitPerQuery);

  for (const item of detailCandidates) {
    const lead = await extractLeadFromPage(item, queryInfo, browser);

    if (lead) {
      sellers.push(lead);
      console.log(`Lead page se mili: ${lead.Company_Name}`);
    }

    await sleep(800);
  }

  return sellers;
}

function dedupeLeads(leads) {
  const seen = new Set();
  const unique = [];

  for (const lead of leads) {
    const key = [
      lead.Contact_Number || lead.Email || lead.Source_URL,
      lead.Category,
      lead.Company_Name.toLowerCase(),
    ].join('|');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(lead);
  }

  return unique;
}

async function runScraper() {
  console.log('Browser start ho raha hai...');
  const headlessMode = process.env.HEADLESS === 'false' ? false : 'new';

  const browser = await puppeteer.launch({
    headless: headlessMode,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
  );
  await page.setViewport({ width: 1366, height: 768 });

  const searchQueries = createSearchQueries();
  let allSellersData = [];

  try {
    for (const queryInfo of searchQueries) {
      try {
        const data = await scrapeSearchResults(queryInfo, page, browser);
        allSellersData = allSellersData.concat(data);
        console.log(`Found ${data.length} leads in this query.`);
      } catch (error) {
        console.log(`Skipped query because error aaya: ${error.message}`);
      }

      await sleep(2500 + Math.floor(Math.random() * 1800));
    }
  } finally {
    await browser.close();
  }

  const uniqueLeads = dedupeLeads(allSellersData);

  if (!uniqueLeads.length) {
    console.log('\nKoi public contact detail nahi mila. Thoda wait karke dobara try karo ya query list badhao.');
    return;
  }

  const columns = [
    'Company_Name',
    'Contact_Number',
    'Email',
    'Category',
    'Platform',
    'Query',
    'Source_URL',
    'Snippet',
  ];

  const csvRows = [
    columns.join(','),
    ...uniqueLeads.map((row) => columns.map((column) => csvValue(row[column])).join(',')),
  ];

  fs.writeFileSync(outputFile, csvRows.join('\n'), 'utf8');

  console.log(`\nDone! Total ${uniqueLeads.length} unique leads CSV me save ho gaye:`);
  console.log(outputFile);
}

runScraper().catch((error) => {
  console.error('Scraper fail ho gaya:', error);
  process.exitCode = 1;
});
