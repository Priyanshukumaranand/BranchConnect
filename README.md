# BranchBase

BranchBase is a full-stack web application built with React, Node.js, and MongoDB, fully containerized and ready for Kubernetes deployment.

## Features
- **Frontend**: React SPA with Nginx (supporting client-side routing).
- **Backend**: Node.js/Express API.
- **Database**: MongoDB (In-Cluster).
- **Caching**: Redis (In-Cluster).
- **Auth**: Google OAuth Integration.
- **Infrastructure**: Kubernetes (K8s) manifests for Azure/AWS/GCP/Local.

## Getting Started (Local Development)

### Prerequisites
- Docker Desktop (with Kubernetes enabled)

### Running Locally
1. Be sure to enable Kubernetes in Docker Desktop.
2. Apply the configuration:
   ```bash
   kubectl apply -k ./k8s
   ```
3. Access:
   - Frontend: `http://localhost`
   - Backend: `http://localhost:8080`

## Azure Deployment (Free Tier)

We have a dedicated branch `azure-deploy-sea` configured for Azure deployment in the **Southeast Asia** region.

### 1. Prerequisites
- Azure CLI (`az`)
- An Azure Subscription (e.g., Azure for Students)

### 2. Deployment Steps
You can deploy this application manually using the Azure CLI.

1.  **Switch to the deployment branch**:
    ```bash
    git checkout azure-deploy-sea
    ```

2.  **Create Resource Group**:
    ```bash
    az group create --name branchbase-sea --location southeastasia
    ```

3.  **Create AKS Cluster (Free Tier)**:
    ```bash
    az aks create \
      --resource-group branchbase-sea \
      --name branchbase-aks-sea \
      --tier free \
      --node-count 1 \
      --node-vm-size Standard_B2s \
      --generate-ssh-keys
    ```

4.  **Connect to Cluster**:
    ```bash
    az aks get-credentials --resource-group branchbase-sea --name branchbase-aks-sea
    ```

5.  **Deploy Application**:
    ```bash
    kubectl apply -k ./k8s
    ```

6.  **Find External IP**:
    ```bash
    kubectl get service -n branchbase frontend
    ```
    Visit the `EXTERNAL-IP` in your browser.

## Cloud Portability (Terraform)
While the above uses the CLI, we also provide Terraform templates in the `terraform/` directory for:
- **Azure** (`terraform/azure`)
- **AWS** (`terraform/aws`)
- **GCP** (`terraform/gcp`)

Refer to `walkthrough.md` for detailed Terraform instructions.
