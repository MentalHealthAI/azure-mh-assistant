from typing import Any

from approaches.appresources import AppResources
from approaches.statetypes.statetype import StateType
from approaches.requestcontext import RequestContext

class StateTypePrint(StateType):
    def __init__(self, next_state, out):
        super(StateTypePrint, self).__init__(isWaitForUserInputBeforeState = False)
        self.next_state = next_state
        self.out = out
    
    async def run(self, app_resources: AppResources, session_state: Any, request_context: RequestContext):
        session_state["machineState"] = self.next_state

        extra_info = {
            "data_points": [],
            "thoughts": f"Searched for:<br><br><br>Conversations:<br>"
            + self.out.replace("\n", "<br>").replace("\n", "<br>"),
        }

        request_context.setResponse(extra_info, None)
