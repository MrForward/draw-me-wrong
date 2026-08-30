export const SITE_ORIGIN = "https://drawmewrong.fun";
export const SITE_NAME = "Draw Me Wrong";
export const SITE_TITLE = "Draw Me Wrong: Bad drawings, better together.";
export const SITE_DESCRIPTION = "Start a private live room for 2-6 people, or send one ten-second drawing dare to a friend. Free, with no app and no account.";

export const SUPPORTED_LANGUAGE_TAGS = ["en", "hi", "es", "fr", "pt-BR", "de", "ja", "ko"] as const;

export const PRODUCT_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: SUPPORTED_LANGUAGE_TAGS,
    },
    {
      "@type": ["VideoGame", "WebApplication"],
      "@id": `${SITE_ORIGIN}/#game`,
      url: `${SITE_ORIGIN}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      image: `${SITE_ORIGIN}/og.png`,
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser with JavaScript enabled.",
      isAccessibleForFree: true,
      inLanguage: SUPPORTED_LANGUAGE_TAGS,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Private live drawing rooms for 2-6 people",
        "Ten-second drawing challenges for one friend",
        "Eight interface languages",
        "No app or account required",
      ],
    },
  ],
} as const;
