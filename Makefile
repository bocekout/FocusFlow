# Variables
IMAGE_NAME = react-ui-app
CONTAINER_NAME = react-ui-container
PORT = 80

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  build       Build the Docker image"
	@echo "  run         Run the Docker container"
	@echo "  stop        Stop the running container"
	@echo "  clean       Remove the Docker image and container"

# Build the Docker image
.PHONY: build
build:
	docker build -t $(IMAGE_NAME) .

# Run the Docker container
.PHONY: run
run:
	docker run -d -p $(PORT):80 --name $(CONTAINER_NAME) $(IMAGE_NAME)

# Stop the running container
.PHONY: stop
stop:
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

# Clean up the Docker image and container
.PHONY: clean
clean: stop
	docker rmi $(IMAGE_NAME) || true