HEPH_IMAGE := "ghcr.io/aleph-im/heph:0.2.0"
HEPH_NAME := "aleph-sdk-ts-heph"
HEPH_VOLUME := "aleph-sdk-ts-heph-data"
HEPH_PORT := "4024"
HEPH_URL := "http://localhost:" + HEPH_PORT
HEPH_WS_URL := "ws://localhost:" + HEPH_PORT

# Boot heph in the background. State persists in the named volume.
start-dev-env:
    docker run -d --rm \
        --name {{HEPH_NAME}} \
        -p 127.0.0.1:{{HEPH_PORT}}:{{HEPH_PORT}} \
        -v {{HEPH_VOLUME}}:/data \
        {{HEPH_IMAGE}}
    @./scripts/wait-for-heph.sh {{HEPH_URL}}
    @echo "heph ready at {{HEPH_URL}}"

# Stop heph. Volume (and DB) is preserved.
stop-dev-env:
    -docker stop {{HEPH_NAME}}

# Stop heph, wipe the volume, restart fresh.
reset-dev-env:
    -docker stop {{HEPH_NAME}}
    -docker volume rm {{HEPH_VOLUME}}
    just start-dev-env

# Run the test suite against the running heph.
test:
    @./scripts/check-heph.sh {{HEPH_URL}}
    ALEPH_API_SERVER={{HEPH_URL}} ALEPH_API_WS_SERVER={{HEPH_WS_URL}} npm test
