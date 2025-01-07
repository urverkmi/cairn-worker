# Cairn Cloudflare Worker

## Overview
This repository contains the Cloudflare Worker implementation required to run your Cairn application. The worker handles secure API key storage, rate limiting, and request processing for Anthropic's Claude API.

## Setup Instructions

### 1. Prerequisites
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Your Anthropic API key

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cairn-worker
cd cairn-worker

# Install dependencies
npm install
```

### 3. Configuration

1. Copy `wrangler.toml.example` to `wrangler.toml`:
```bash
cp wrangler.toml.example wrangler.toml
```

2. Update `wrangler.toml` with your details:
```toml
name = "your-worker-name"
account_id = "your-cloudflare-account-id"
```

3. Set up your environment variables in Cloudflare:
```bash
# Set your Anthropic API key
wrangler secret put ANTHROPIC_API_KEY
```

4. Configure allowed origins in `src/config.js`:
```javascript
export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://your-domain.com'
];
```

### 4. Development

Test locally:
```bash
wrangler dev
```

### 5. Deployment

Deploy to Cloudflare:
```bash
wrangler publish
```

## Local Development

1. Create a `.dev.vars` file:
```
ANTHROPIC_API_KEY=your_api_key_here
```

2. Run locally:
```bash
wrangler dev
```

## Connecting to Cairn Framework

Update your Cairn application's [configuration](https://github.com/urverkmi/cairn/blob/main/js/PatternAnalyzer.js#L47) to point to your worker:

```javascript
this.client = new CairnClient(WORKER_URL);
```

## Troubleshooting

Common issues and solutions:

1. CORS Errors
   - Verify your domain is listed in `ALLOWED_ORIGINS`
   - Check your request headers

2. Deployment Issues
   - Verify Cloudflare authentication
   - Check wrangler.toml configuration
   - Verify Connectivity in main application src
