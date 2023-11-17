# Usa la imagen oficial de Node.js 18
FROM node:18

# Instala dependencias necesarias
RUN apt-get update && \
    apt-get install -y chromium

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia los archivos de tu proyecto al contenedor
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos
COPY . .

# Expón el puerto en el que se ejecuta tu aplicación (ajusta según tu aplicación)
EXPOSE  8000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
