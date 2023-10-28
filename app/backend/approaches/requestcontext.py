from typing import Any
import openai

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
        self.chat_coroutine = None
    
    def setResponse(extra_info: dict[str, str], chat_coroutine: openai.ChatCompletion):
        if not (self.chat_coroutine is None):
            raise Exception("Unexpected two results")
        self.extra_info = extra_info
        self.chat_coroutine = chat_coroutine