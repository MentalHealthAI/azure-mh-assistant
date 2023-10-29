from typing import Any, AsyncGenerator
from approaches.appresources import AppResources
from approaches.requestcontext import RequestContext

class StateType:
    def __init__(self, isWaitForUserInputBeforeState: bool):
        self.isWaitForUserInputBeforeState = isWaitForUserInputBeforeState

    async def run(self, app_resources: AppResources, session_state: Any, request_context: RequestContext) -> AsyncGenerator[dict[str, Any], None]:
        raise NotImplementedError