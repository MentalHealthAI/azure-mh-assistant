from typing import Any

class RequestContext:
    def __init__(
        self,
        history: list[dict[str, str]],
        overrides: dict[str, Any],
        auth_claims: dict[str, Any],
        should_stream: bool
    ):
        self.history = history
        self.overrides = overrides
        self.auth_claims = auth_claims
        self.should_stream = should_stream
        self.extra_info = None
    
    def setResponseExtraInfo(self, extra_info: dict[str, str]):
        if not (self.extra_info is None):
            raise Exception("Unexpected two results")
        self.extra_info = extra_info
