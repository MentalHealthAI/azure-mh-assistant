import os
import json
import logging
from typing import Any, AsyncGenerator, Union

import aiohttp

from approaches.appresources import AppResources
from approaches.approach import Approach
from approaches.requestcontext import RequestContext
from approaches.statemachine import States, FirstState
from approaches.statetypes.statetypeopenai import StateTypeOpenAI

class ChatReadRetrieveReadApproach(Approach):
    def __init__(self, app_resources: AppResources):
        self.app_resources = app_resources

    async def run_until_final_call(
        self,
        session_state: Any,
        request_context: RequestContext,
        history: list[dict[str, str]],
        overrides: dict[str, Any],
        auth_claims: dict[str, Any],
        should_stream: bool = False,
    ) -> AsyncGenerator[dict, None]:
        isWaitForUserInputBeforeState = False
        while (not isWaitForUserInputBeforeState):
            if not ("machineState" in session_state):
                raise Exception("No machineState in session_state")
            if not (session_state["machineState"] in States):
                raise Exception("Unexpected state " + session_state["machineState"])
            state = States[session_state["machineState"]]
            isWaitForUserInputBeforeState = state.isWaitForUserInputBeforeState
            chat_coroutine = state.run(self.app_resources, session_state, request_context)
            async for event in await chat_coroutine:
                if not (event is None):
                    yield event

    async def run_without_streaming(
        self,
        session_state: Any,
        request_context: RequestContext,
        history: list[dict[str, str]],
        overrides: dict[str, Any],
        auth_claims: dict[str, Any],
    ) -> dict[str, Any]:
        chat_coroutine = await self.run_until_final_call(
            session_state, request_context, history, overrides, auth_claims, should_stream=False
        )
        chat_resp = dict(await chat_coroutine)
        chat_resp["choices"][0]["context"] = request_context.extra_info
        chat_resp["choices"][0]["session_state"] = session_state
        return chat_resp

    async def run_with_streaming(
        self,
        session_state: Any,
        request_context: RequestContext,
        history: list[dict[str, str]],
        overrides: dict[str, Any],
        auth_claims: dict[str, Any],
    ) -> AsyncGenerator[dict, None]:
        chat_coroutine = await self.run_until_final_call(
            session_state, request_context, history, overrides, auth_claims, should_stream=True
        )
        yield {
            "choices": [
                {
                    "delta": {"role": StateTypeOpenAI.ASSISTANT},
                    "context": request_context.extra_info,
                    "session_state": session_state,
                    "finish_reason": None,
                    "index": 0,
                }
            ],
            "object": "chat.completion.chunk",
        }

        async for event in await chat_coroutine:
            # "2023-07-01-preview" API version has a bug where first response has empty choices
            if event["choices"]:
                yield event

    async def run(
        self, messages: list[dict], stream: bool = False, session_state: Any = None, context: dict[str, Any] = {}
    ) -> Union[dict[str, Any], AsyncGenerator[dict[str, Any], None]]:
        overrides = context.get("overrides", {})
        auth_claims = context.get("auth_claims", {})
        request_context = RequestContext(messages, overrides, auth_claims, stream)
        if session_state is None:
            session_state = { "machineState": FirstState, "vars": {} }
        if stream is False:
            # Workaround for: https://github.com/openai/openai-python/issues/371
            async with aiohttp.ClientSession() as s:
                openai.aiosession.set(s)
                response = await self.run_without_streaming(session_state, request_context, messages, overrides, auth_claims)
            return response
        else:
            return self.run_with_streaming(session_state, request_context, messages, overrides, auth_claims)
