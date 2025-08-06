FROM node:18-slim

WORKDIR /app

# Installa le dipendenze necessarie
RUN apt-get update && apt-get install -y openssl netcat-traditional

COPY package*.json ./
RUN npm install

# Copia solo i file Prisma e genera il client
COPY prisma ./prisma/
RUN npx prisma generate

# Copia script prima di copiare tutto il codice
COPY scripts/docker-entrypoint.sh /docker-entrypoint.sh
COPY scripts/create-admin-user.js /app/scripts/create-admin-user.js
RUN chmod +x /docker-entrypoint.sh

# Ora copia il resto del codice
COPY . .
RUN npm run build

EXPOSE 3000
EXPOSE 3001

# Verifica finale
RUN echo "Container pronto per l'esecuzione."
RUN ls -la /docker-entrypoint.sh
RUN ls -la /app/scripts/create-admin-user.js

CMD ["/docker-entrypoint.sh"]