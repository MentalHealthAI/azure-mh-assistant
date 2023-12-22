import { useRef, useState, useEffect } from "react";
import { Checkbox, Panel, DefaultButton, TextField, SpinButton, Dropdown, IDropdownOption } from "@fluentui/react";
import { SparkleFilled } from "@fluentui/react-icons";
import readNDJSONStream from "ndjson-readablestream";

import styles from "./Chat.module.css";
import introImage from "../../assets/intro.png";

import { chatApi, RetrievalMode, ChatAppResponse, ChatAppResponseOrError, ChatAppRequest, ResponseMessage } from "../../api";
import { Answer, AnswerError, AnswerLoading } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ExampleList } from "../../components/Example";
import { UserChatMessage } from "../../components/UserChatMessage";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { SettingsButton } from "../../components/SettingsButton";
import { ClearChatButton } from "../../components/ClearChatButton";
import { useLogin, getToken } from "../../authConfig";
import { useMsal } from "@azure/msal-react";
import { TokenClaimsDisplay } from "../../components/TokenClaimsDisplay";

const Chat = () => {
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");
    const [retrieveCount, setRetrieveCount] = useState<number>(3);
    const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>(RetrievalMode.Hybrid);
    const [useSemanticRanker, setUseSemanticRanker] = useState<boolean>(true);
    const [shouldStream, setShouldStream] = useState<boolean>(true);
    const [useSemanticCaptions, setUseSemanticCaptions] = useState<boolean>(false);
    const [excludeCategory, setExcludeCategory] = useState<string>("");
    const [useSuggestFollowupQuestions, setUseSuggestFollowupQuestions] = useState<boolean>(false);
    const [useOidSecurityFilter, setUseOidSecurityFilter] = useState<boolean>(false);
    const [useGroupsSecurityFilter, setUseGroupsSecurityFilter] = useState<boolean>(false);

    const lastQuestionRef = useRef<string>("");
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isWritingWords, setIsWritingWords] = useState<boolean>(false);
    const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<unknown>();
    const [isFirstRender, setIsFirstRender] = useState<boolean>(true);

    const [activeCitation, setActiveCitation] = useState<string>();
    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | undefined>(undefined);

    const [selectedAnswer, setSelectedAnswer] = useState<number>(0);
    const [answers, setAnswers] = useState<[user: string, responses: ChatAppResponse[]][]>([]);
    const [streamedAnswers, setStreamedAnswers] = useState<[user: string, response: ChatAppResponse[]][]>([]);

    const [lastAnswer, setLastAnswer] = useState<ChatAppResponse | undefined>(undefined);

    const handleAsyncRequest = async (question: string, answers: [string, ChatAppResponse[]][], setAnswers: Function, responseBody: ReadableStream<any>) => {
        let role: string;
        let answer: string = "";
        let responses: ChatAppResponse[] = [];
        let askResponse: ChatAppResponse = {} as ChatAppResponse;

        const createResponse = (contentAnswer: string): ChatAppResponse => {
            return {
                ...askResponse,
                choices: [{ ...askResponse.choices[0], message: { content: contentAnswer, role: role } }]
            };
        };

        const updateState = (newContent: string) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    answer += newContent;
                    const latestResponse = createResponse(answer);
                    let latestResponses: ChatAppResponse[] = [...responses, latestResponse];
                    setStreamedAnswers([...answers, [question, latestResponses]]);
                    resolve(null);
                }, 33);
            });
        };

        async function* asyncWordGenerator(str: string, delay: number) {
            const words = str.split(" ");
            for (const word of words) {
                // Wait for the delay, then yield the word
                await new Promise(resolve => setTimeout(resolve, delay));
                yield word;
            }
        }

        try {
            setIsStreaming(true);
            for await (const event of readNDJSONStream(responseBody)) {
                if (event["choices"] && event["choices"][0]["context"] && event["choices"][0]["context"]["data_points"]) {
                    event["choices"][0]["message"] = event["choices"][0]["delta"];
                    askResponse = event;
                } else if (event["choices"] && event["choices"][0]["delta"]) {
                    setIsLoading(false);
                    setIsWritingWords(true);
                    const partsWithContent = event["choices"][0]["delta"].filter((part: any) => part["content"]);
                    for (const msg of partsWithContent) {
                        role = msg["role"] ? msg["role"] : askResponse.choices[0].message.role;
                        if (msg["role"] == "assistant") {
                            // Animate writing words only for assistant role
                            const sentence = msg["content"];
                            const delay = 33;
                            let isFirst = true;
                            for await (let word of asyncWordGenerator(sentence, delay)) {
                                if (!isFirst) {
                                    word = " " + word;
                                }
                                await updateState(word);
                                isFirst = false;
                            }
                        }

                        responses.push(createResponse(msg["content"]));
                    }
                    setIsWritingWords(false);
                }
            }
        } finally {
            setIsStreaming(false);
        }
        return responses;
    };

    const client = useLogin ? useMsal().instance : undefined;

    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        error && setError(undefined);
        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);

        const token = client ? await getToken(client) : undefined;

        try {
            const messages: ResponseMessage[] = answers.flatMap(a => [
                { content: a[0], role: "user" },
                ...a[1].map(b => {
                    return { content: b.choices[0].message.content, role: "assistant" };
                })
            ]);

            const request: ChatAppRequest = {
                messages: [...messages, { content: question, role: "user" }],
                stream: shouldStream,
                context: {
                    overrides: {
                        prompt_template: promptTemplate.length === 0 ? undefined : promptTemplate,
                        exclude_category: excludeCategory.length === 0 ? undefined : excludeCategory,
                        top: retrieveCount,
                        retrieval_mode: retrievalMode,
                        semantic_ranker: useSemanticRanker,
                        semantic_captions: useSemanticCaptions,
                        suggest_followup_questions: useSuggestFollowupQuestions,
                        use_oid_security_filter: useOidSecurityFilter,
                        use_groups_security_filter: useGroupsSecurityFilter
                    }
                },
                // ChatAppProtocol: Client must pass on any session state received from the server
                session_state: answers.length ? answers[answers.length - 1][1][answers[answers.length - 1][1].length - 1].choices[0].session_state : null
            };

            const response = await chatApi(request, token?.accessToken);
            if (!response.body) {
                throw Error("No response body");
            }
            if (shouldStream) {
                const parsedResponse: ChatAppResponse[] = await handleAsyncRequest(question, answers, setAnswers, response.body);
                setAnswers([...answers, [question, parsedResponse]]);
            } else {
                // This might not work since support of roled list in server response
                const parsedResponse: ChatAppResponseOrError = await response.json();
                if (response.status > 299 || !response.ok) {
                    throw Error(parsedResponse.error || "Unknown error");
                }
                setAnswers([...answers, [question, [parsedResponse as ChatAppResponse]]]);
            }
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        lastQuestionRef.current = "";
        error && setError(undefined);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);
        setAnswers([]);
        setStreamedAnswers([]);
        setIsLoading(false);
        setIsStreaming(false);
    };

    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" }), [isLoading]);
    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "auto" }), [streamedAnswers]);

    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
            const clientId = new URLSearchParams(window.location.search).get("clientid");
            makeApiRequest(clientId == null || clientId == "" ? "כניסה ללא זיהוי משתמש" : clientId);
        }
    }, [isFirstRender]);

    const onPromptTemplateChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplate(newValue || "");
    };

    const onRetrieveCountChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setRetrieveCount(parseInt(newValue || "3"));
    };

    const onRetrievalModeChange = (_ev: React.FormEvent<HTMLDivElement>, option?: IDropdownOption<RetrievalMode> | undefined, index?: number | undefined) => {
        setRetrievalMode(option?.data || RetrievalMode.Hybrid);
    };

    const onUseSemanticRankerChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticRanker(!!checked);
    };

    const onUseSemanticCaptionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticCaptions(!!checked);
    };

    const onShouldStreamChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setShouldStream(!!checked);
    };

    const onExcludeCategoryChanged = (_ev?: React.FormEvent, newValue?: string) => {
        setExcludeCategory(newValue || "");
    };

    const onUseSuggestFollowupQuestionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSuggestFollowupQuestions(!!checked);
    };

    const onUseOidSecurityFilterChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseOidSecurityFilter(!!checked);
    };

    const onUseGroupsSecurityFilterChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseGroupsSecurityFilter(!!checked);
    };

    const onExampleClicked = (example: string) => {
        makeApiRequest(example);
    };

    const onShowCitation = (citation: string, index: number) => {
        if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveCitation(citation);
            setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
        }

        setSelectedAnswer(index);
    };

    const onToggleTab = (tab: AnalysisPanelTabs, index: number) => {
        if (activeAnalysisPanelTab === tab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveAnalysisPanelTab(tab);
        }

        setSelectedAnswer(index);
    };

    const setIsPlayingVideoIntercept = (isPlayingVideo_: boolean) => {
        if (isPlayingVideo && !isPlayingVideo_) {
            makeApiRequest("הצפיה הסתיימה");
        }
        setIsPlayingVideo(isPlayingVideo_);
    };

    return (
        <div className={styles.container}>
            <div className={styles.chatRoot}>
                <div className={styles.chatHeader}>חרבות ברזל - תמיכה והכוונה רגשית</div>
                <div className={styles.chatContainer}>
                    <div className={styles.chatMessageStreamContainer}>
                        <div className={styles.chatIntroContainer}>
                            <div className={styles.chatIntroImageContainer}>
                                <div className={styles.chatIntroImageViewport}>
                                    <img src={introImage} className={styles.chatIntroImage} />
                                </div>
                            </div>
                            <div className={styles.chatIntroText}>אנחנו כאן עבורך</div>
                        </div>
                        <div className={styles.chatMessageStream}>
                            {isStreaming &&
                                streamedAnswers.map((streamedAnswer, index) => (
                                    <div key={index}>
                                        {index > 0 && <UserChatMessage message={streamedAnswer[0]} />}
                                        {streamedAnswer[1].map(roledAnswer => (
                                            <div className={styles.chatMessageGpt}>
                                                <Answer
                                                    isStreaming={true}
                                                    key={index}
                                                    answer={roledAnswer}
                                                    isSelected={false}
                                                    isVideoEnabled={index == streamedAnswers.length - 1}
                                                    onCitationClicked={c => onShowCitation(c, index)}
                                                    onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
                                                    onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
                                                    onFollowupQuestionClicked={q => makeApiRequest(q)}
                                                    setIsPlayingVideo={setIsPlayingVideoIntercept}
                                                    showFollowupQuestions={useSuggestFollowupQuestions && answers.length - 1 === index}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            {!isStreaming &&
                                answers.map((answer, index) => (
                                    <div key={index}>
                                        {index > 0 && <UserChatMessage message={answer[0]} />}
                                        {answer[1].map(roledAnswer => (
                                            <div className={styles.chatMessageGpt}>
                                                <Answer
                                                    isStreaming={false}
                                                    key={index}
                                                    answer={roledAnswer}
                                                    isSelected={selectedAnswer === index && activeAnalysisPanelTab !== undefined}
                                                    isVideoEnabled={index == streamedAnswers.length - 1}
                                                    onCitationClicked={c => onShowCitation(c, index)}
                                                    onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
                                                    onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
                                                    onFollowupQuestionClicked={q => makeApiRequest(q)}
                                                    setIsPlayingVideo={setIsPlayingVideoIntercept}
                                                    showFollowupQuestions={useSuggestFollowupQuestions && answers.length - 1 === index}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            {isLoading && (
                                <>
                                    <UserChatMessage message={lastQuestionRef.current} />
                                    <div className={styles.chatMessageGptMinWidth}>
                                        <AnswerLoading />
                                    </div>
                                </>
                            )}
                            {error ? (
                                <>
                                    <UserChatMessage message={lastQuestionRef.current} />
                                    <div className={styles.chatMessageGptMinWidth}>
                                        <AnswerError error={error.toString()} onRetry={() => makeApiRequest(lastQuestionRef.current)} />
                                    </div>
                                </>
                            ) : null}
                            <div ref={chatMessageStreamEnd} />
                        </div>
                    </div>

                    <div className={styles.chatInput}>
                        <QuestionInput
                            clearOnSend
                            placeholder="כיצד אני יכול לעזור לך?"
                            disabled={isLoading || isWritingWords || isFirstRender || isPlayingVideo}
                            onSend={question => makeApiRequest(question)}
                        />
                    </div>
                </div>

                {answers.length > 0 && activeAnalysisPanelTab && (
                    <AnalysisPanel
                        className={styles.chatAnalysisPanel}
                        activeCitation={activeCitation}
                        onActiveTabChanged={x => onToggleTab(x, selectedAnswer)}
                        citationHeight="810px"
                        answer={answers[selectedAnswer][1][answers[selectedAnswer][1].length - 1]}
                        activeTab={activeAnalysisPanelTab}
                    />
                )}

                <Panel
                    headerText="Configure answer generation"
                    isOpen={isConfigPanelOpen}
                    isBlocking={false}
                    onDismiss={() => setIsConfigPanelOpen(false)}
                    closeButtonAriaLabel="Close"
                    onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>}
                    isFooterAtBottom={true}
                >
                    <TextField
                        className={styles.chatSettingsSeparator}
                        defaultValue={promptTemplate}
                        label="Override prompt template"
                        multiline
                        autoAdjustHeight
                        onChange={onPromptTemplateChange}
                    />

                    <SpinButton
                        className={styles.chatSettingsSeparator}
                        label="Retrieve this many search results:"
                        min={1}
                        max={50}
                        defaultValue={retrieveCount.toString()}
                        onChange={onRetrieveCountChange}
                    />
                    <TextField className={styles.chatSettingsSeparator} label="Exclude category" onChange={onExcludeCategoryChanged} />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticRanker}
                        label="Use semantic ranker for retrieval"
                        onChange={onUseSemanticRankerChange}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticCaptions}
                        label="Use query-contextual summaries instead of whole documents"
                        onChange={onUseSemanticCaptionsChange}
                        disabled={!useSemanticRanker}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSuggestFollowupQuestions}
                        label="Suggest follow-up questions"
                        onChange={onUseSuggestFollowupQuestionsChange}
                    />
                    {useLogin && (
                        <Checkbox
                            className={styles.chatSettingsSeparator}
                            checked={useOidSecurityFilter}
                            label="Use oid security filter"
                            disabled={!client?.getActiveAccount()}
                            onChange={onUseOidSecurityFilterChange}
                        />
                    )}
                    {useLogin && (
                        <Checkbox
                            className={styles.chatSettingsSeparator}
                            checked={useGroupsSecurityFilter}
                            label="Use groups security filter"
                            disabled={!client?.getActiveAccount()}
                            onChange={onUseGroupsSecurityFilterChange}
                        />
                    )}
                    <Dropdown
                        className={styles.chatSettingsSeparator}
                        label="Retrieval mode"
                        options={[
                            { key: "hybrid", text: "Vectors + Text (Hybrid)", selected: retrievalMode == RetrievalMode.Hybrid, data: RetrievalMode.Hybrid },
                            { key: "vectors", text: "Vectors", selected: retrievalMode == RetrievalMode.Vectors, data: RetrievalMode.Vectors },
                            { key: "text", text: "Text", selected: retrievalMode == RetrievalMode.Text, data: RetrievalMode.Text }
                        ]}
                        required
                        onChange={onRetrievalModeChange}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={shouldStream}
                        label="Stream chat completion responses"
                        onChange={onShouldStreamChange}
                    />
                    {useLogin && <TokenClaimsDisplay />}
                </Panel>
            </div>
        </div>
    );
};

export default Chat;
