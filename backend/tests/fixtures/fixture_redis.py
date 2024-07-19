import pytest
import redis


@pytest.fixture
def redis_client():
    client = redis.StrictRedis(host='localhost', port=6379, db=0)
    yield client
    client.flushdb()
