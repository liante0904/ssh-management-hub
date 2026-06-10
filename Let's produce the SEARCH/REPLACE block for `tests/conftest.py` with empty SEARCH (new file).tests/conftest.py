import pytest
from unittest.mock import MagicMock

class MockRow:
    """Mock database row that supports both index and attribute access."""
    def __init__(self, values):
        self._values = values

    def __getitem__(self, index):
        return self._values[index]

    def __getattr__(self, name):
        # Return None for any attribute not explicitly set
        return None

    def __len__(self):
        return len(self._values)

@pytest.fixture
def mock_db():
    """Return a mock database connection."""
    return MagicMock()

@pytest.fixture
def sample_firm_rows():
    """Return a list of MockRow objects representing firms, including ga_enabled_yn."""
    return [
        MockRow([1, '삼성증권', 'Y', 'Y', 'Y']),   # sec_firm_order, firm_nm, telegram_update_yn, ga_enabled_yn, ...
        MockRow([2, '미래에셋', 'N', 'Y', 'N']),
        MockRow([3, 'KB증권', 'Y', 'N', 'Y']),
    ]
