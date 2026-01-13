# Deploying Pet_BE to Render

This guide walks you through setting up Continuous Deployment (CD) on Render using the created `render.yaml` Blueprint.

## Prerequisites

1.  **GitHub Repository**: Ensure your code is pushed to a GitHub repository.
2.  **Render Account**: Sign up at [render.com](https://render.com).

## Steps

### 1. Connect Repository
1.  Go to the [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** and select **Blueprint**.
3.  Connect your GitHub repository (`Pet_BE`).

### 2. Configure Blueprint
Render will automatically detect the `render.yaml` file.

1.  **Name**: Confirm the service names (e.g., `pet-backend`, `pet-db`).
2.  **Environment Variables**:
    *   `JWT_SECRET`: Render will generate a value. Use this or override it.
    *   `VNPAY_TMN_CODE` & `VNPAY_HASH_SECRET`: You **MUST** enter these values manually in the Render dashboard during setup or afterwards in the "Environment" tab.
    *   `VNPAY_RETURN_URL`: Update this to your actual Frontend URL once deployed.

### 3. Apply Blueprint
1.  Click **Apply**.
2.  Render will:
    *   Provision a PostgreSQL database (`pet-db`).
    *   Build your Docker image (`pet-backend`).
    *   Deploy the service.

### 4. Database Migrations
The application is configured to **automatically run migrations** on startup in production (via `migrationsRun: true` in `database.module.ts`).
*   Check the logs to verify migrations applied successfully: `[TypeOrmModule] Migrations run successfully`.

### 5. Verification
Once deployed, the status will turn **Live**.
*   Test the health check: `https://<your-service-name>.onrender.com/api/` (or your health endpoint).
*   Test Swagger: `https://<your-service-name>.onrender.com/api/docs`.

## Troubleshooting

### "Validation Error" on VNPAY keys
If the deployment fails validation because of missing sync-false variables:
1.  Open the Service in Render Dashboard.
2.  Go to **Environment**.
3.  Add `VNPAY_TMN_CODE` and `VNPAY_HASH_SECRET` with your real values.
4.  Trigger a generic deployment.

### Database Connection SSL
We updated `database.module.ts` to use `ssl: { rejectUnauthorized: false }` in production. This is required for Render's managed database internal connections.
