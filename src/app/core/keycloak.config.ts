import Keycloak from 'keycloak-js';

const keycloakConfig: Keycloak.KeycloakConfig = {
  url: 'http://localhost:8080', // URL del servidor Keycloak de tu backend
  realm: 'nombre-de-tu-realm',   // Nombre del realm proporcionado por tu equipo
  clientId: 'nombre-del-client'  // ID del cliente configurado para este frontend
};

export const keycloak = new Keycloak(keycloakConfig);