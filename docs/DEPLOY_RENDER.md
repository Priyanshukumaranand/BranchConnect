Render deployment guide

This guide explains how to deploy the backend service to Render using a Docker image and the GitHub Actions workflow included in this repository.

1) Create a Render Web Service
   - Go to https://dashboard.render.com and create a new Web Service.
   - Choose "Docker" as the environment.
   - For the Docker context and Dockerfile path, you can use the default settings and leave Render to build from the repo, or configure it to pull a container image from a registry.
   - Set the port to 8080 (the app listens on PORT or default 8080).

2) Environment variables
   Add the following environment variables in the Render service settings (or use Render's secret environment variables):
   - MONGO_URI: mongodb://<user>:<pass>@<host>:27017/branchbase?authSource=admin
   - REDIS_HOST: redis (if using a managed Redis, set host accordingly)
   - REDIS_PORT: 6379
   - SESSION_SECRET: replace_with_secure_secret
   - JWT_SECRET: replace_with_jwt_secret
   - FRONTEND_URL: https://your-frontend-url
   - SMTP_*: (if you use email sending features)

   If you want Render to build and host your own Mongo/Redis, Render provides managed databases and Redis add-ons — use those connection strings for `MONGO_URI` and `REDIS_HOST`.

3) GitHub Secrets required for CI trigger
   The included GitHub Actions workflow triggers a deploy via the Render API. Add these repository secrets:
   - RENDER_API_KEY: Create an API key in Render (Account -> API Keys) and paste it here.
   - RENDER_SERVICE_ID: The numeric (or string) ID of your Render service. You can find this in the Render dashboard under the service's settings or by calling the Render API.

4) How the workflow works
   - On push to `main` or `latest-tech-implementation` (or when manually dispatched), GitHub Actions builds the backend Docker image.
   - The workflow then calls Render's deploy API to trigger a new deploy for the configured service ID.

5) Troubleshooting
   - If the app can't connect to Mongo/Redis, verify `MONGO_URI` and `REDIS_HOST` in Render's environment variables.
   - Check Render deploy logs and the GitHub Action logs for build and deploy output.

6) Notes and improvements
   - Optionally push to a container registry (Docker Hub or GitHub Container Registry) and configure Render to pull the image instead of building it.
   - Add healthchecks and readiness probes in your Render service configuration if supported.
