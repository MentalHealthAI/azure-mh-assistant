from typing import Any

from approaches.appresources import AppResources
from approaches.statetypes.statetype import StateType
from approaches.requestcontext import RequestContext

class StateTypeSaveInputToVar(StateType):
    def __init__(self, next_state, var):
        super(StateTypeSaveInputToVar, self).__init__(isWaitForUserInputBeforeState = True)
        self.next_state = next_state
        self.var = var
    
    async def run(self, app_resources: AppResources, session_state: Any, request_context: RequestContext) -> bool:
        session_state["machineState"] = self.next_state
        vars = session_state["vars"]
        if vars is None:
            vars = {}
            session_state["vars"] = vars
        vars[self.var] = request_context.history[-1]["content"]
