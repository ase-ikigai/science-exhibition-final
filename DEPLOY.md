# Deploying Ikigai for FREE

This guide deploys your app **completely free** using:

| Layer | Provider | Free tier |
|---|---|---|
| Frontend (React) | **Vercel** | Free Hobby tier (forever) |
| Backend (FastAPI) | **Render** | Free Web Service (sleeps after 15 min) |
| Database (MongoDB) | **MongoDB Atlas** | M0 cluster — 512 MB, free forever |

> **Heads-up about Render's free tier:** the backend goes to sleep after 15 minutes of inactivity. First request after waking takes ~30 sec. If you can spare $7/mo later, upgrade Render to the "Starter" plan to keep it always-on.

---

## Step 1 — Push your code to GitHub

In the Emergent chat input, click **"Save to GitHub"** → create a repo (e.g. `ikigai-app`).

---

## Step 2 — MongoDB Atlas (free database)

1. Sign up at https://www.mongodb.com/atlas → create a free **M0** cluster
2. In **Database Access** → add a user (e.g. `ikigai`) with a password (save it)
3. In **Network Access** → allow `0.0.0.0/0` (so Render can connect)
4. Click **Connect** → "Connect your application" → copy the URI, it looks like:
   ```
   mongodb+srv://ikigai:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password. **Keep this URI for Step 3.**

---

## Step 3 — Backend on Render

1. Sign up at https://render.com (free, GitHub login)
2. Click **New +** → **Web Service** → connect your GitHub repo
3. Render will auto-detect `render.yaml` (already in your repo) — accept the suggested config:
   - **Name**: `ikigai-backend`
   - **Root directory**: `backend`
   - **Build**: `pip install -r requirements.txt`
   - **Start**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
4. Set these **Environment Variables** in Render's dashboard:

   | Key | Value |
   |---|---|
   | `MONGO_URL` | Your MongoDB Atlas URI from Step 2 |
   | `DB_NAME` | `ikigai` |
   | `CORS_ORIGINS` | leave blank for now — fill after Step 4 |
   | `GROQ_API_KEY` | `sk-emergent-4Ca20Be110aC65605C` (or your own OpenAI/Anthropic key) |
   | `JWT_SECRET` | Render auto-generates one — accept it |

5. Click **Create Web Service** → wait ~3 min for first build
6. Once live, copy the URL — it looks like `https://ikigai-backend.onrender.com`. **Keep this for Step 4.**
7. Test it: open `https://ikigai-backend.onrender.com/api/` in a browser → should return `{"app":"IKIGAI","status":"blooming"}`

---

## Step 4 — Frontend on Vercel

1. Sign up at https://vercel.com (free, GitHub login)
2. Click **Add New** → **Project** → import your GitHub repo
3. Vercel will auto-detect `vercel.json` — accept the defaults:
   - **Framework**: (none — using custom config)
   - **Build command**: `cd frontend && yarn install --frozen-lockfile && yarn build`
   - **Output directory**: `frontend/build`
4. Before clicking Deploy, expand **Environment Variables** and add:

   | Key | Value |
   |---|---|
   | `REACT_APP_BACKEND_URL` | Your Render URL from Step 3 (e.g. `https://ikigai-backend.onrender.com`) |

5. Click **Deploy** → wait ~2 min
6. Once live, copy the URL — looks like `https://ikigai-app-yourname.vercel.app`

---

## Step 5 — Lock down CORS (security)

1. Go back to **Render → ikigai-backend → Environment**
2. Set `CORS_ORIGINS` to your Vercel URL (no trailing slash):
   ```
   https://ikigai-app-yourname.vercel.app
   ```
   *(You can comma-separate multiple, e.g. `https://app.vercel.app,https://www.yourdomain.com`)*
3. Click **Save** → Render auto-redeploys (~1 min)

---

## Step 6 — Open your sanctuary

Open `https://ikigai-app-yourname.vercel.app` → sign up → enjoy 🌸

---

## Custom domain (optional, free)

Both Vercel and Render let you add a custom domain for free — just point your DNS at them. Vercel includes free SSL via Let's Encrypt automatically.

---

## Cost calculator

| Item | Free? | Cost if you outgrow free |
|---|---|---|
| Vercel Hobby | ✅ Forever | $20/mo Pro (most users never need) |
| Render Free Web | ✅ But sleeps after 15min idle | $7/mo Starter (always-on) |
| MongoDB Atlas M0 | ✅ 512 MB forever | $9/mo for 2 GB shared cluster |
| Emergent LLM key | Already provided ⚠️ uses your Emergent credits per call | Bring your own OpenAI key (~$0.01/conversation) |

**True $0/mo cost** as long as you stay within: 512 MB DB + Render's 750 hr/mo + reasonable LLM usage.

---

## Switching off Emergent's LLM key (optional)

If you want to use your **own** OpenAI/Anthropic key (so it's not tied to Emergent credits):

1. Get an OpenAI key at https://platform.openai.com or Anthropic key at https://console.anthropic.com
2. In `/app/backend/server.py`, the `LlmChat` calls already use `GROQ_API_KEY` — that variable accepts ANY OpenAI key starting with `sk-` or Anthropic key starting with `sk-ant-`
3. Just set `GROQ_API_KEY` to your own key on Render → done. No code changes.

---

## Troubleshooting

**"Cold start: 30 sec wait on first request"** — Normal on Render free tier. Upgrade to $7/mo to fix.

**"CORS error"** — Make sure `CORS_ORIGINS` on Render exactly matches your Vercel URL (no trailing slash).

**"Login lag / typing slow"** — Already fixed in iteration 7. If you forked from an older state, pull latest.

**"LLM calls timeout"** — Render free tier has a 5-min request limit which is fine for Claude. But if cold-start + LLM call > 60s, the client may show a timeout — the call completes server-side though.

**"Backend won't start"** — Check Render logs. Most common cause: `MONGO_URL` is missing or password not URL-encoded. URL-encode any special chars in your MongoDB password (e.g. `@` → `%40`).
