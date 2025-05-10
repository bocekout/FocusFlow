# Step 1: Use Node.js to build the React project
FROM node:18.18.0 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY react-ui/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY react-ui/ ./

# Build the React project
RUN npm run build

# Step 2: Use Nginx to serve the built files
FROM nginx:alpine

# Copy the built files from the previous stage to the Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]