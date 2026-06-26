# ☕ nongkui.
> A premium curated directory and dynamic indexing platform for specialty coffee shops and cafes in Yogyakarta. Built to deliver seamless spatial discovery and highly responsive data grid structures for urban explorers.

🌐 **Production Domain:** [nongkui.myvnc.com](https://nongkui.myvnc.com)  
🛸 **Vercel Mirror:** [nongkui.vercel.app](https://nongkui.vercel.app)

---

## 📌 What is nongkui?
**nongkui.** is a modern full-stack web application designed to catalog, map, and analyze premium cafe spots across Yogyakarta. Instead of relying on static, hardcoded data, the system manages a dynamic inventory of 223 verified locations, serving high-definition imagery and spatial metadata over a high-performance responsive interface.

---

## 🏗️ System Architecture & Data Flow
The platform is engineered using a modern decoupled architecture where the frontend, serverless database mapping, and data gathering pipelines interact in a secure loop:

```text
  [ Client Browser ] 
          │ (Requests Page / Interacts with Map)
          ▼
   [ Next.js App ] ◄─── (Real-time Analytics) ───► [ Vercel Web Analytics ]
          │
          ├───► [ Google Maps API ] (Renders Spatial & Location Coordinates)
          │
          ├───► [ Prisma ORM ] ───► [ Supabase PostgreSQL ] (Data Storage)
          │
          └─ (Scraping Fallback System) ───► [ Firecrawl API ] (Automated Venue Syncing)
```

### Architectural Breakdown:
* **Presentation Layer:** Built on Next.js using a fluid 4-column responsive grid layout optimized for large immersive desktop screens down to mobile devices, styled via Tailwind CSS.
* **Data Access Layer:** Utilizes Prisma ORM as a type-safe database client. It dynamically handles queries and automatically provisions serverless database adapters during server-side compilation.
* **Automation & Scraper Fallback:** Integrated with Firecrawl API to act as a resilient data-syncing fallback, automated to crawl and fetch updated venue details, metadata, and high-definition imagery when updates are requested.

---

## 🌐 Cloud Infrastructure Configuration
The production stack is deployed across a secure, distributed hybrid cloud environment:

| Component | Provider / Technology | Purpose |
| :--- | :--- | :--- |
| **Hosting & Edge Deployment** | Vercel Platform | Serves global serverless edge functions and static assets with optimized Turbopack caching. |
| **Custom Network Routing** | No-IP Dynamic DNS | Maps a custom domain mask (`nongkui.myvnc.com`) using an optimized CNAME record structure pointing securely to Vercel's global DNS mesh. |
| **Relational Database** | Supabase (PostgreSQL) | Managed cloud database hosting the persistent cafe schemas, spatial coordinates, and relational metadata. |
| **Telemetry & Monitoring** | Vercel Analytics | Embedded tracker capturing anonymous visitor traffic, performance metrics, and engagement directly at the edge layer. |
