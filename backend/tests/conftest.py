import os
import sys

sys.path.insert(1, os.path.join(sys.path[0], '..'))

pytest_plugins = [
    "fixtures.fixture_client",
    "fixtures.fixture_redis"
]