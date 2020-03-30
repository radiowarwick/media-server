# Use latest slim node
FROM node:current-slim

# Set the working directory
WORKDIR /www

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install modules for production
RUN npm install --production

# Copy entire bundle to the working directory
COPY . .

# Define base enviroment
ENV UPLOAD_USER user
ENV UPLOAD_PASSWORD hackme
ENV PORT 8080

# Expose port 8080
EXPOSE 8080

# Start the server
CMD ["npm", "run", "start"]