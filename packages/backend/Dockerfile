# Dockerfile per Monorepo Deployment
# DEVE essere eseguito dalla root del progetto

FROM node:20-alpine

WORKDIR /app

# 1. Copia i file di configurazione del workspace
COPY package.json package-lock.json ./
# Copia anche i package.json dei pacchetti
COPY packages/mobile/package.json ./packages/mobile/
COPY packages/backend/package.json ./packages/backend/

# 2. Installa tutte le dipendenze (root + workspaces)
RUN npm install

# 3. Copia tutto il codice sorgente
COPY . .

# 4. Esegui la build unificata (Mobile + Backend + Copy)
# Questo script è definito nel package.json di root
RUN npm run build

# 5. Spostati nel backend per l'esecuzione
WORKDIR /app/packages/backend

# 6. Espone la porta
EXPOSE 8000

# 7. Avvia il server
CMD ["npm", "start"]
