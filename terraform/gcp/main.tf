terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "your-gcp-project-id" # Update this
  region  = "us-central1"
  zone    = "us-central1-a"
}

# GKE Cluster
# We use a Zonal cluster (not Regional) to save on the management fee (Free Tier: 1 zonal cluster is free).
resource "google_container_cluster" "primary" {
  name     = "branchbase-gke"
  location = "us-central1-a" # Zonal

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1
}

# Separately Managed Node Pool
resource "google_container_node_pool" "primary_preemptible_nodes" {
  name       = "branchbase-node-pool"
  location   = "us-central1-a"
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    preemptible  = true # Saves ~80% cost, good for dev/test
    machine_type = "e2-small" # 2 vCPU, 2GB RAM. Cost effective and stable enough for K8s.
    # Note: e2-micro (1GB RAM) is often too small for K8s system pods + app.

    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
