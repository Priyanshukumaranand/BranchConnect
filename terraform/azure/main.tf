terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "branchbase-resources"
  location = "Southeast Asia"
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = "branchbase-aks"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "branchbase"
  sku_tier            = "Free" # Explicitly use the Free tier (no SLA)

  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_B2s" # Burstable, cheaper for dev/test
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = "Development"
  }
}

output "kube_config" {
  value = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive = true
}
