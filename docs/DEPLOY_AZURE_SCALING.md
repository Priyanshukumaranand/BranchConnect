# Azure Horizontal Scaling for BranchBase

This guide adds focused instructions for horizontally scaling your containerised backend on Azure. It covers two recommended approaches:

1. Azure Web App for Containers (App Service) — simple autoscale rules (CPU/memory or schedule-based).
2. Azure Container Apps — KEDA-based autoscaling with scale-to-zero and custom triggers (HTTP/RPS, CPU, Redis queue length).

Both approaches assume you have an image in Azure Container Registry (ACR) or another private registry and environment variables configured for `MONGO_URI`, `REDIS_*`, `SESSION_SECRET`, `JWT_SECRET`, etc.

---

## Option A — App Service (Web App for Containers) autoscale (recommended if you need WebSocket reliability)

Why choose App Service:
- Good WebSocket support and simple configuration.
- Autoscale rules are easy to manage in the portal or via `az monitor autoscale`.
- Suitable for a single container app that needs horizontal scaling across VMs.

Key considerations for Socket.IO:
- Use Redis adapter (`@socket.io/redis-adapter`) — already present in the project dependencies — so socket events are broadcast across instances.
- Sessions must be stored in Redis (or another centralized store) to share session data.
- Configure sticky sessions only if your session store is in-memory (not recommended). With Redis, sticky sessions are unnecessary.

Steps to enable autoscale via Azure CLI

1) Create an App Service Plan with multiple instance capability (P1v2 or similar):

```powershell
az appservice plan create --name asp-branchbase-prod --resource-group $resourceGroup --sku P1v2 --is-linux --number-of-workers 1
```

2) Create autoscale settings (scale based on CPU) — example: scale out when average CPU > 60% for 5 minutes, scale in when CPU < 30% for 10 minutes:

```powershell
$autoscaleName = "autoscale-branchbase-backend"
$resourceId = az webapp show --name $webApp --resource-group $resourceGroup --query id -o tsv

az monitor autoscale create --resource-group $resourceGroup --name $autoscaleName --target $resourceId --min-count 1 --max-count 6 --count 1

# scale out rule: cpu > 60%
az monitor autoscale rule create --resource-group $resourceGroup --autoscale-name $autoscaleName --condition "Percentage CPU > 60 avg 5m" --scale to 3

# scale in rule: cpu < 30%
az monitor autoscale rule create --resource-group $resourceGroup --autoscale-name $autoscaleName --condition "Percentage CPU < 30 avg 10m" --scale to 1
```

3) Verify autoscale configuration in the portal or via:

```powershell
az monitor autoscale show --resource-group $resourceGroup --name $autoscaleName
```

Notes for production:
- Tune CPU thresholds and instance counts according to load tests.
- Use Application Insights to correlate request latency and CPU usage when setting rules.
- For scheduled scaling (e.g., larger capacity during campus placement windows), add a time-based schedule rule in autoscale settings.

---

## Option B — Azure Container Apps with KEDA (recommended if you want scale-to-zero and event-based scaling)

Why choose Container Apps:
- Scale-to-zero saves costs when traffic is low.
- KEDA supports many triggers: HTTP concurrency, Prometheus metrics, Redis streams/queues, etc.
- Suitable for microservices or if you plan to add background workers.

Important for WebSocket/real-time:
- Container Apps also support WebSocket and HTTP streaming, but confirm your target plan and ingress configuration.
- Use the shared Redis adapter for Socket.IO to broadcast across replicas.

High-level flow:
1. Create a Container Apps environment.
2. Create a Container App that pulls the image from ACR.
3. Configure KEDA autoscale rules for CPU or HTTP concurrency.

Example commands (assumes ACR and container app env exist)

```powershell
# create container app with ACR image
az containerapp create \
  --name branchbase-backend \
  --resource-group $resourceGroup \
  --environment myContainerAppsEnv \
  --image $registry.azurecr.io/branchbase-backend:latest \
  --ingress 'external' --target-port 8080 \
  --min-replicas 0 --max-replicas 5 \
  --cpu 0.5 --memory 1.0Gi \
  --registry-server $registry.azurecr.io --registry-username <user> --registry-password <password>

# create an HTTP scale rule (scale based on RPS)
az containerapp update --name branchbase-backend --resource-group $resourceGroup --set properties.configuration.scale.rules="[{'name':'http-scaler','custom':{'type':'http','metadata':{'concurrentRequests':'50'},'auth':{'secret':'_='}}}]"
```

KEDA examples (recommended):
- HTTP concurrent requests
- CPU percentage
- Redis lists/streams (if you use a queue to buffer background work)

Container Apps GitHub Actions snippet (deploy & update):

```yaml
- name: Deploy to Azure Container Apps
  uses: azure/aci-deploy@v1
  with:
    resource-group: ${{ secrets.AZURE_RESOURCE_GROUP }}
    name: branchbase-backend
    image: ${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io/branchbase-backend:${{ github.sha }}
```

(For Container Apps, consider using `azure/cli` steps to run `az containerapp update` commands.)

---

## Socket.IO and scaling checklist

- Use Redis adapter and a managed Redis instance (Azure Cache for Redis) so events sync across instances.
- Centralize session storage in Redis (connect-mongo is for sessions but ensure session store is shared across instances).
- Ensure `WEBSITES_PORT`/`PORT` is set to `8080` in App Service or Container App settings.
- If using App Service with multiple instances, you don't need sticky sessions when Redis is used.
- If you embed video via 100ms, the heavy traffic is offloaded to 100ms — your app only issues room tokens and stores metadata.

---

## Autoscale testing

- Load test with a tool like `wrk` or `k6` and watch instance count change in the portal or via `az monitor autoscale show`.
- Verify socket events propagate across instances by opening multiple clients connected to different container instances (inspect `x-powered-by` or add an instance id response header in the app for testing).

---

## Example: GitHub Actions snippet for App Service deploy (fast)

```yaml
- name: Login to Azure
  uses: azure/login@v1
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

- name: Push image to ACR
  uses: docker/build-push-action@v4
  with:
    context: ./backend
    push: true
    tags: |
      ${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io/branchbase-backend:${{ github.sha }}

- name: Update Web App container image
  run: |
    az webapp config container set \
      --name ${{ secrets.AZURE_WEBAPP_NAME }} \
      --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
      --docker-custom-image-name ${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io/branchbase-backend:${{ github.sha }} \
      --docker-registry-server-url https://${{ secrets.AZURE_CONTAINER_REGISTRY }}.azurecr.io
    az webapp restart --name ${{ secrets.AZURE_WEBAPP_NAME }} --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
```

---

## Final notes

- Start with App Service if you want reliable WebSocket behavior and simpler ops. Move to Container Apps when you need scale-to-zero or advanced KEDA triggers.
- Test autoscale thresholds with realistic load and monitor costs.

---

