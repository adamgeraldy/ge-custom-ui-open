# BT-GE: Custom UI for Google Gemini Enterprise

A modern, production-ready React frontend for Google Gemini Enterprise (formerly Vertex AI Search and Conversation). This project provides a polished chat interface, agent management, and customization features on top of the Gemini Enterprise Discovery Engine APIs.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)

---

## Features

- **Multi-Agent Chat** — Chat with multiple AI agents backed by Gemini Enterprise Discovery Engine
- **Agent Catalog** — Browse, search, and filter available agents
- **Agent Editor** — Create and edit agents with a visual node-based editor (root + sub-agents)
- **Streaming Responses** — Real-time SSE-based streaming with thinking/reasoning display
- **Chat History** — Persistent session history via Discovery Engine sessions API
- **Data Store Management** — Connect/disconnect data stores per agent
- **Localization (EN/ID)** — Full English/Indonesian i18n with user-editable translations
- **Color Theming** — 6 preset palettes + custom color picker, persisted locally
- **Google OAuth** — Sign in with Google Workspace accounts using OAuth 2.0 implicit flow
- **Responsive Design** — Mobile-friendly flat design with Google Material-inspired aesthetics

---

## Prerequisites

Before deploying this application, ensure you have:

### Google Cloud Platform

1. **A GCP Project** with billing enabled
2. **Gemini Enterprise** (Discovery Engine) set up in your project:
   - An **Engine** (App) created in [Gemini Enterprise](https://console.cloud.google.com/gemini-enterprise)
   - At least one **Data Store** connected to the engine
   - The **Gemini Enterprise API** enabled
3. **OAuth 2.0 Client ID** configured:
   - Go to [APIs & Credentials](https://console.cloud.google.com/apis/credentials)
   - Create an **OAuth 2.0 Client ID** (Web application type)
   - Add your deployment URL to **Authorized JavaScript origins** (e.g., `https://your-domain.com`, `http://localhost:5173` for local dev)
   - Note the **Client ID** — you'll need it for the `.env` file

### Google Workspace (Recommended)

- A **Google Workspace** organization for managed user access
- Users sign in with their Workspace accounts to get OAuth tokens
- The OAuth consent screen should be configured for **Internal** use (Workspace org only) for enterprise deployments

### Development Tools

- **Node.js** ≥ 20.19 (recommended) or ≥ 22.12
- **npm** ≥ 10
- **Firebase CLI** (optional, for Firebase Hosting deployment)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/adamgeraldy/ge-custom-ui-open.git
cd ge-custom-ui-open
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your GCP project details:

```env
# Your GCP Project Number (found in GCP Console → Project Settings)
VITE_GCP_PROJECT_NUMBER=123456789012

# Your Gemini Enterprise Engine ID (found in Gemini Enterprise → Apps → ID)
VITE_GE_ENGINE_ID=your-engine-id_1234567890123

# Your OAuth 2.0 Client ID (from APIs & Credentials)
VITE_GOOGLE_CLIENT_ID=123456789012-abc123def456.apps.googleusercontent.com
```

#### Finding Your Configuration Values

| Value | Where to Find It |
|-------|-----------------|
| **Project Number** | GCP Console → Navigation Menu → IAM & Admin → Settings → Project number |
| **Engine ID** | Gemini Enterprise → Apps → Your App → ID (or from the URL: `engines/{ENGINE_ID}`) |
| **OAuth Client ID** | APIs & Credentials → OAuth 2.0 Client IDs → Your web client → Client ID |

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. Sign In

Open the app and click **"Sign in with Google"**. Use a Google Workspace account that has access to the GCP project.

---

## Deployment

### Option A: Firebase Hosting (Recommended)

1. **Install Firebase CLI:**

   ```bash
   npm install -g firebase-tools
   ```

2. **Log in and initialize:**

   ```bash
   firebase login
   firebase init hosting
   ```

   When prompted:
   - Public directory: `dist`
   - Single-page app: **Yes**
   - GitHub auto-deploys: Your choice

3. **Build and deploy:**

   ```bash
   npm run build
   firebase deploy --only hosting
   ```

4. **Update OAuth origins:**

   Add your Firebase Hosting URL (e.g., `https://your-project.web.app`) to the OAuth Client ID's **Authorized JavaScript origins** in GCP Console.

### Option B: Any Static Hosting

This is a standard Vite/React SPA. Build and serve the `dist/` folder:

```bash
npm run build
# Serve dist/ with any static file server (Nginx, Cloudflare Pages, Vercel, etc.)
```

**Important:** Configure your hosting to redirect all routes to `index.html` (SPA fallback).

### Option C: Cloud Run

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

---

## Integrating with Your Gemini Enterprise Environment

### 1. Gemini Enterprise Setup

This app communicates with the **Discovery Engine `streamAssist` API** for chat, and the **Agent/Session management APIs** for agent CRUD and history.

Ensure your Gemini Enterprise app has:

- **Agents** configured (the app auto-fetches agents via `ListAvailableAgentViews` RPC)
- **Data Stores** connected to the engine

### 2. API Endpoints Used

| Feature | API Endpoint |
|---------|-------------|
| Chat streaming | `POST streamAssist` (SSE) |
| List agents | `ListAvailableAgentViews` (RPC via `assistants/default_assistant:listAvailableAgentViews`) |
| Create agent | `POST assistants/default_assistant/agents` |
| Update agent | `PATCH assistants/default_assistant/agents/{id}` |
| Delete agent | `DELETE assistants/default_assistant/agents/{id}` |
| List sessions | `GET assistants/default_assistant/sessions` |
| Get session | `GET assistants/default_assistant/sessions/{id}` |
| Engine config | `GET engines/{id}` |

All API calls are made directly from the browser using the user's OAuth access token. **No backend proxy is required.**

### 3. OAuth Scopes

The app requests the following OAuth scope during sign-in:

```
https://www.googleapis.com/auth/cloud-platform
```

This grants the signed-in user access to GCP APIs, scoped to their IAM permissions.

### 4. IAM Permissions

Users need the **Discovery Engine User** role (`roles/discoveryengine.user`) on the GCP project. This grants permissions to interact with agents, sessions, and data stores.

For users who need to create or manage agents, grant **Discovery Engine Editor** (`roles/discoveryengine.editor`).

Configure these in [IAM & Admin](https://console.cloud.google.com/iam-admin/iam).


---

## Project Structure

```
ge-custom-ui-open/
├── public/                      # Static assets (mascot, icons)
├── src/
│   ├── components/
│   │   ├── features/
│   │   │   ├── agent-editor/    # Visual agent editor (nodes, properties)
│   │   │   ├── agents/          # Agent catalog, cards, dashboard
│   │   │   ├── auth/            # Login form (Google OAuth + LDAP)
│   │   │   └── chat/            # Chat view, data store popup
│   │   └── layout/              # Sidebar, Header, MainLayout (settings)
│   ├── context/
│   │   ├── AppContext.tsx        # Main app state (auth, agents, chat, streaming)
│   │   ├── i18n.tsx             # Localization system (EN/ID)
│   │   └── theme.tsx            # Color theming with presets
│   ├── styles/
│   │   ├── global.css           # Base styles, utilities, animations
│   │   └── variables.css        # CSS custom properties (design tokens)
│   ├── utils/
│   │   ├── discovery-engine.ts  # Discovery Engine API client
│   │   └── google-auth.ts       # Google OAuth utility
│   ├── App.tsx                  # App entry with providers
│   └── main.tsx                 # Vite entry point
├── .env.example                 # Environment variable template
├── index.html                   # HTML entry
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Customization

### Localization

The app ships with English and Indonesian translations. To customize:

1. Open **Settings → Localization** tab in the app
2. Edit any Indonesian translation inline
3. Changes persist locally in `localStorage`

To add a new language, extend the dictionaries in `src/context/i18n.tsx`.

### Theming

1. Open **Settings → Appearance** tab
2. Choose a preset or pick custom Primary/Accent/Error colors
3. Colors are applied in real-time via CSS custom properties

To modify defaults, edit the `PRESETS` array in `src/context/theme.tsx` or the CSS variables in `src/styles/variables.css`.

### Branding

- Replace `public/mascot.png` with your own mascot/logo
- Update brand strings in `src/context/i18n.tsx` (keys: `footer.brand`, `footer.tagline`, `header.breadcrumbTitle`)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.7 |
| Build Tool | Vite 8 |
| Styling | Vanilla CSS with custom properties |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm + rehype-raw |
| Auth | Google Cloud Identity |
| Hosting | Firebase Hosting (or any static host) |

---

## Development

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Type-check
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built on [Google Gemini Enterprise](https://cloud.google.com/gemini/enterprise) Discovery Engine APIs
- UI design inspired by Google Material Design 3
- Icons by [Lucide](https://lucide.dev)
