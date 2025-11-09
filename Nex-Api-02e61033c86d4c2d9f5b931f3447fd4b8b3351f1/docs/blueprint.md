# **App Name**: Nex Api 〽️

## Core Features:

- Scraping API (GET/POST): Provide a web API endpoint to scrape data using GET and POST methods.
- API Key Access Control: Secure API access using API keys for authentication and authorization, validated via Firestore.
- Rate Limiting: Implement request rate limiting per API key on an hourly basis.
- Tiered Access Control: Categorize API keys into Free, Premium, and Owner tiers, each with different access privileges. Configured via Firestore.
- Color Theme Toggle: Allow users to switch between a dark and light color theme.
- Informative Dashboard: Display an informative dashboard with user IP, battery status (mocked), and endpoint usage.
- Admin API Key Creation: Restrict the creation of new API keys exclusively to users with the 'Owner' API key, interacting with Firestore.

## Style Guidelines:

- Primary color: Deep Indigo (#4F3A65) to evoke a sense of security and sophistication.
- Background color: Very light grey (#F5F5F5), creating a clean, modern backdrop.
- Accent color: Teal (#22D1EE), a vibrant hue for interactive elements and highlights.
- Body and headline font: 'Inter', a sans-serif for its clean, modern appearance and excellent readability.
- Use minimalist, outline-style icons to maintain a clean and modern aesthetic.
- Implement a grid-based layout with generous spacing for a balanced and visually appealing interface.
- Incorporate subtle transitions and animations for a fluid, interactive user experience.