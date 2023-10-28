from typing import Any
from approaches.appresources import AppResources
from approaches.requestcontext import RequestContext

class StateType:
    def __init__(self, isWaitForUserInputBeforeState: bool):
        self.isWaitForUserInputBeforeState = isWaitForUserInputBeforeState

    async def run(self, app_resources: AppResources, session_state: Any, request_context: RequestContext) -> bool:
        raise NotImplementedError