FROM node:20-alpine

WORKDIR /app

# Copia il package.json del backend
COPY packages/backend/package.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il codice sorgente del backend
COPY packages/backend/ ./

# Compila il progetto TypeScript
RUN npm run build

# Espone la porta (assicurati che corrisponda a quella del server Fastify)
EXPOSE 8000

# Avvia il server
CMD ["npm", "start"]
