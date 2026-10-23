export function LocalBusinessSchema() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    "name": "Damez Barbershop",
    "image": "https://damezbarber.com/images/hero-barbershop.jpg",
    "@id": "https://damezbarber.com",
    "url": "https://damezbarber.com",
    "telephone": "+62-812-3456-7890",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Jl. Senopati Raya No. 42, Kebayoran Baru",
      "addressLocality": "Jakarta Selatan",
      "addressRegion": "DKI Jakarta",
      "postalCode": "12190",
      "addressCountry": "ID",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -6.229746,
      "longitude": 106.808945,
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        "opens": "10:00",
        "closes": "21:00",
      },
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "320",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
