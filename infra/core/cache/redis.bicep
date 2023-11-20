// This module creates a redis cache resource

// The name of the redis cache
param name string

// The location of the redis cache
param location string

// The tags to apply to the redis cache
param tags object

// The SKU of the redis cache
param sku object

// Whether to enable the non-SSL port for the redis cache
param enableNonSslPort bool

// The redis cache resource
resource redis 'Microsoft.Cache/Redis@2020-06-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: sku
    enableNonSslPort: enableNonSslPort
  }
}

// The output of the redis cache connection string
//output connectionString string = 'redis://${redis.listKeys().primaryKey}@${redis.properties.hostName}:${redis.properties.sslPort}'
output name string = redis.name
output hostName string = redis.properties.hostName
output sslPort int = redis.properties.sslPort
output id string = redis.id
