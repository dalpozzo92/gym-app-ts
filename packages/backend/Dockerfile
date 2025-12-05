FROM node:18-alpine

WORKDIR /app

# Copy root package.json and lockfile if they exist (for monorepo structure)
# If you don't have a root package.json, just copy the backend one.
# Assuming standard structure where we might need to build dependencies.

# For this specific setup, we can just copy the backend package since it seems self-contained enough
# or we can copy everything. Let's try to keep it simple and focused on backend.

COPY packages/backend/package.json ./
# COPY package-lock.json ./ 

RUN npm install

COPY packages/backend/ ./

RUN npm run build

EXPOSE 8000

CMD ["npm", "start"]
