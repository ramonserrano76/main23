# Usa la imagen oficial de Node.js 14
FROM node:17

# No es necesario el Chromium independiente
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Instala las dependencias necesarias y actualiza los repositorios
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    curl \
    gnupg \
    wget \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxi6 \
    libxrandr2 \
    libxtst6 \
    libpango-1.0-0 \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# Create a new user
RUN useradd -m myuser
USER myuser
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