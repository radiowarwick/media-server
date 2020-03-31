# Use latest slim node
FROM node:current-slim

# Set the working directory
WORKDIR /www

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install modules for production
RUN npm install --production

# Install handbrake CLI
RUN apt-get update -qq \
&& apt-get install -y -qq handbrake-cli

# Copy entire bundle to the working directory
COPY . .

# Overrise and expose port 8080
ENV PORT 8080
EXPOSE 8080

# Start the server
CMD ["npm", "run", "start"]