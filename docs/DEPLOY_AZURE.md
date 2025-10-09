# Azure deployment guide

This document outlines the two primary Azure PaaS options for running the BranchBase backend container and provides a recommended path with step-by-step instructions. The backend is a single Express container that exposes HTTP + WebSocket traffic on port 8080 and depends on MongoDB and Redis.

## Platform comparison

| Feature | Azure Web App for Containers | Azure Container Apps |
|---------|-----------------------------|----------------------|
| Intended use case | Lift-and-shift of a single container or simple web API | Microservices, event-driven apps, background workers |
| WebSocket support | Yes (must enable in configuration) | Yes |
| Scaling model | Manual or CPU-based auto-scale on App Service plan | KEDA-based auto-scale (HTTP or custom triggers) |
| Networking | Public by default, VNet integration requires PremiumV2+ plan | Public or internal, robust VNet support built-in |
| DevOps integration | Direct GitHub Action templates, image pull from ACR/GHCR | Requires Azure CLI/az containerapp commands but still scripted |
| Cost baseline | Shares plan with other web apps, lower starting cost | Per-active CPU/Memory, cheaper when scaled to zero |
| Complexity | Lower (GUI-oriented) | Higher (Kubernetes-lite concepts) |

**Recommendation:** Start with **Azure Web App for Containers**. It keeps the workflow simple (single web container + websockets) while letting you scale when needed. You can migrate to Container Apps later if you add more services or need granular scale-to-zero behavior.

## Deployment architecture

1. Azure Container Registry (ACR) to host the backend image.
2. App Service Web App for Containers pulling the image from ACR.
3. Azure Cosmos DB for MongoDB API (or Azure-hosted MongoDB Atlas) for persistent storage.
4. Azure Cache for Redis (Basic plan or higher) for cache/session storage.
5. GitHub Actions workflow authenticates to Azure, pushes the image to ACR, and triggers the Web App to redeploy on the selected branch.

## Prerequisites

- Azure subscription with permissions to create resource groups, ACR, App Service, Cosmos DB, and Azure Cache for Redis.
- Azure CLI installed locally if you plan to test commands.
- GitHub repository secrets for the Azure principal.

## Step 1: Create resource group and registry

```powershell
$resourceGroup = "rg-branchbase-prod"
$location = "eastus"
$registry = "branchbaseacr"

az group create --name $resourceGroup --location $location
az acr create --resource-group $resourceGroup --name $registry --sku Basic --admin-enabled false
```

Note the ACR login server `branchbaseacr.azurecr.io`.

## Step 2: Provision backing services

1. **Cosmos DB (Mongo API):**
   ```powershell
   $cosmosAccount = "branchbase-cosmos"
   az cosmosdb create --name $cosmosAccount --resource-group $resourceGroup --kind MongoDB --locations regionName=$location failoverPriority=0 isZoneRedundant=false
   az cosmosdb mongodb database create --account-name $cosmosAccount --name branchbase --resource-group $resourceGroup
   ```
   Retrieve the connection string:
   ```powershell
   az cosmosdb keys list --name $cosmosAccount --resource-group $resourceGroup --type connection-strings --query 'connectionStrings[0].connectionString'
   ```

2. **Azure Cache for Redis:**
   ```powershell
   $redisName = "branchbase-redis"
   az redis create --name $redisName --resource-group $resourceGroup --location $location --sku Basic --vm-size C1
   az redis list-keys --name $redisName --resource-group $resourceGroup
   ```
   The connection uses `redisName.redis.cache.windows.net` with SSL port 6380.

## Step 3: Create the Web App for Containers

```powershell
$appServicePlan = "asp-branchbase-prod"
$webApp = "branchbase-backend"

az appservice plan create --name $appServicePlan --resource-group $resourceGroup --sku P1v2 --is-linux
az webapp create --name $webApp --resource-group $resourceGroup --plan $appServicePlan --deployment-container-image-name mcr.microsoft.com/appsvc/staticsite:stable
```

The placeholder image lets the app exist before you wire up ACR. Configure the app to pull from ACR:

```powershell
az webapp config container set `
  --name $webApp `
  --resource-group $resourceGroup `
  --docker-custom-image-name $registry.azurecr.io/branchbase-backend:latest `
  --docker-registry-server-url https://$registry.azurecr.io
```

Enable WebSockets and set the exposed port:

```powershell
az webapp config set --name $webApp --resource-group $resourceGroup --web-sockets-enabled true
az webapp config appsettings set --name $webApp --resource-group $resourceGroup --settings PORT=8080 WEBSITES_PORT=8080
```

Add environment variables pulled from Cosmos and Redis:

```powershell
az webapp config appsettings set --name $webApp --resource-group $resourceGroup --settings `
  MONGO_URI=<cosmos-connection-string> `
  REDIS_HOST=$redisName.redis.cache.windows.net `
  REDIS_PORT=6380 `
  REDIS_PASSWORD=<redis-primary-key> `
  REDIS_TLS=true `
  SESSION_SECRET=<random-string> `
  JWT_SECRET=<random-string> `
  FRONTEND_URL=https://your-frontend.example `
  MAIL_HOST=<smtp-host> `
  MAIL_USER=<smtp-user> `
  MAIL_PASS=<smtp-pass>
```

Cosmos requires TLS and the official MongoDB driver handles it automatically when using the provided connection string. Redis traffic must use SSL port 6380 and the `REDIS_TLS` flag ensures the application opts into TLS.

## Step 4: Create a federated Azure service principal for GitHub Actions

```powershell
$principalName = "github-branchbase-deployer"
$subscriptionId = az account show --query id --output tsv
$acrId = az acr show --name $registry --resource-group $resourceGroup --query id --output tsv
$appId = az ad sp create-for-rbac --name $principalName --role Contributor --scopes $acrId --sdk-auth | ConvertFrom-Json
```

Capture the following for GitHub repository secrets:

- `AZURE_CLIENT_ID = $appId.clientId`
- `AZURE_TENANT_ID = $appId.tenantId`
- `AZURE_SUBSCRIPTION_ID = $subscriptionId`
- `AZURE_CONTAINER_REGISTRY = $registry`
- `AZURE_RESOURCE_GROUP = $resourceGroup`
- `AZURE_WEBAPP_NAME = $webApp`

Use federated credentials so you avoid storing a client secret. In Azure Portal create a Federated Credential under the service principal that trusts your GitHub repo (select branch `latest-tech-implementation`).

## Step 5: Update the GitHub Actions workflow

Extend `.github/workflows/deploy-branch.yml` to build, push, and deploy:

```yaml
      - name: Log in to Azure
        uses: azure/login@v1
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Log in to ACR
        run: az acr login --name ${{ secrets.AZURE_CONTAINER_REGISTRY }}

      - name: Build and push image to ACR
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            ${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io/branchbase-backend:${{ github.sha }}
            ${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io/branchbase-backend:latest

      - name: Update Web App container
        run: |
          az webapp config container set \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --docker-custom-image-name ${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io/branchbase-backend:${{ github.sha }} \
            --docker-registry-server-url https://${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io
          az webapp restart --name ${{ secrets.AZURE_WEBAPP_NAME }} --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
```

Keep the existing Render step if you still deploy there; otherwise remove it.

## Step 6: Validate deployment

1. Trigger the workflow by pushing to `latest-tech-implementation` or via manual dispatch.
2. Watch the GitHub Action logs for successful Azure login, ACR push, and web app update.
3. In the Azure Portal > Web App > Deployment Center confirm the latest image tag.
4. Hit `https://<webapp-name>.azurewebsites.net/socket/ping` to verify the health endpoint.
5. Check logs with:
   ```powershell
   az webapp log config --name $webApp --resource-group $resourceGroup --application-logging filesystem --level Information
   az webapp log tail --name $webApp --resource-group $resourceGroup
   ```

## Operational tips

- Schedule backups for Cosmos DB and Redis or enable geo-redundant configuration if needed.
- Use Azure Monitor to alert on CPU, memory, and failed requests.
- Rotate secrets by updating App Settings; the Web App restarts automatically.
- When scaling out to multiple instances, keep Redis as the centralized session store (already supported).

## When to consider Azure Container Apps

Switch to Container Apps if you need any of the following:
- Scale-to-zero savings for low-traffic periods.
- Multiple backend services, worker queues, or background jobs managed together.
- KEDA-based event triggers (queue length, Redis streams, etc.).
- Service mesh/Dapr integrations. 

The container image, environment variables, and GitHub Action pipeline remain similar; only the deployment commands change (`az containerapp up/update`).
