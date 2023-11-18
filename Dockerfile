# Usa la imagen oficial de Node.js 14
FROM node:14

# No es necesario el Chromium independiente
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Instala las dependencias necesarias y actualiza los repositorios


# Instala Google Chrome Stable
RUN curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install google-chrome-stable -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia los archivos de tu proyecto al contenedor
COPY package*.json ./

# Copia el resto de los archivos
COPY . .

# Instala las dependencias de la aplicación
RUN npm install

# Expón el puerto en el que se ejecuta tu aplicación (ajusta según tu aplicación)
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["npm", "start"]