# Use an official Node.js runtime as a parent image
# We choose a Debian-based image (like 'bullseye') because it has the 'apt-get' package manager
FROM node:18-bullseye

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# ✅ --- Install qpdf ---
# This is the crucial step. We update the system's package list and install qpdf.
RUN apt-get update && apt-get install -y qpdf

# Copy the rest of your application's code into the container
COPY . .

# Your app binds to port 5000, so expose it
EXPOSE 5000

# Define the command to run your app
CMD ["node", "index.js"]
