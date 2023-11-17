# Usa la imagen oficial de Node.js 18
FROM node:18

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia los archivos de tu proyecto al contenedor
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos
COPY . .

# Expón el puerto en el que se ejecuta tu aplicación (ajusta según tu aplicación)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
