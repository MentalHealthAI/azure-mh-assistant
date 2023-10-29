from typing import Any, AsyncGenerator

from approaches.appresources import AppResources
from approaches.statetypes.statetype import StateType
from approaches.requestcontext import RequestContext

class StateTypePrint(StateType):
    def __init__(self, next_state, out):
        super(StateTypePrint, self).__init__(isWaitForUserInputBeforeState = False)
        self.next_state = next_state
        self.out = out
    
    async def run(self, app_resources: AppResources, session_state: Any, request_context: RequestContext) -> AsyncGenerator[dict[str, Any], None]:
        session_state["machineState"] = self.next_state

        msg_to_display = self.out.replace("\n", "<br>")
        extra_info = {
            "data_points": [],
            "thoughts": f"Searched for:<br><br><br>Conversations:<br>"
            + msg_to_display,
        }

        request_context.setResponseExtraInfo(extra_info)

        yield msg_to_display