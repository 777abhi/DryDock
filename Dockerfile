# Use a lightweight Node.js base image
FROM public.ecr.aws/docker/library/node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package management files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies like ts-node and typescript)
RUN npm ci

# Copy the rest of the application
COPY . .

# Set default command using ts-node to run the scanner
ENTRYPOINT ["npx", "ts-node", "src/drydock.ts"]

# If users don't provide arguments, default to showing help or doing nothing.
# But they usually run it like: docker run drydock scan <paths>
