import pytest
from app import create_app


@pytest.fixture(scope="module")
def client ():
    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    with app.app_context():
        yield client
