# Deploying Pet_BE to Render

This guide covers deploying the backend using **pre-built Docker images** from GitHub Container Registry (GHCR).

## Architecture

```
GitHub Push → CI Pipeline → Build & Push Image to GHCR → Trigger Render Deploy
                                                              ↓
                                           Render pulls image → Deploys (~30-60s)
```

## Prerequisites

1. **GitHub Repository**: Code pushed to `main` branch
2. **Render Account**: Sign up at [render.com](https://render.com)

## Initial Setup (One-time)

### 1. Create Render Blueprint
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repository (`Pet_BE`)
4. Render detects `render.yaml` automatically
5. Fill in required secrets (`VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`)
6. Click **Apply**

### 2. Get Deploy Hook URL (Optional - for faster deploys)
1. In Render Dashboard → Select `pet-backend` service
2. Go to **Settings** → **Deploy Hook**
3. Copy the URL
4. In GitHub repo → **Settings** → **Secrets** → Add:
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: (paste the URL)

### 3. Make GHCR Package Public (if private repo)
1. Go to GitHub → Your Profile → **Packages**
2. Find `pet_be` package
3. Click **Package Settings** → **Change visibility** → **Public**

Or add Render's pull credentials (advanced).

## How Deploys Work Now

| Step | What Happens |
|------|--------------|
| 1 | Push to `main` branch |
| 2 | CI runs: tests, lint, security scan |
| 3 | CI builds Docker image |
| 4 | CI pushes to `ghcr.io/chinhbmt122/pet_be:latest` |
| 5 | CI triggers Render deploy (via webhook) |
| 6 | Render pulls image and deploys (~30-60s) |

## Manual Deploy (if needed)

```bash
# In Render Dashboard → pet-backend → Manual Deploy → Deploy latest commit
```

## Environment Variables

| Variable | Source | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Auto from `pet-db` | Render manages this |
| `JWT_SECRET` | Auto-generated | Secure random value |
| `VNPAY_TMN_CODE` | Manual input | Your VNPAY merchant code |
| `VNPAY_HASH_SECRET` | Manual input | Your VNPAY secret |

## Verification

1. Check service status: **Live** ✅
2. Test health: `https://pet-backend.onrender.com/api/`
3. Test Swagger: `https://pet-backend.onrender.com/api/docs`

## Troubleshooting

### Image Pull Failed
- Ensure GHCR package is public, or configure Render credentials
- Check CI logs - did the image push succeed?

### Database Connection Error
- Check `DATABASE_URL` is set (from `pet-db`)
- Verify database is running (Dashboard → pet-db)

### Slow Cold Starts
- Free tier instances sleep after 15min of inactivity
- First request after sleep takes ~30s
- Consider upgrading to paid plan for production
