from approaches.localization.he import choose_annoying_reason_with_distress, exit_after_distress_increased_and_fail_to_connect_to_current, exit_after_distress_increased_and_succeed_to_connect_to_current, exit_after_distress_increased_twice, exit_after_improvement, exit_after_improvement_and_fail_to_connect_to_current, exit_after_improvement_and_succeed_to_connect_to_current, exit_after_no_clear_improvement_and_fail_to_connect_to_current, exit_after_no_clear_improvement_and_succeed_to_connect_to_current, exit_no_clear_improvement, how_much_distress_and_advance_video, is_connected_to_current_after_improvement, is_connected_to_current_after_no_improvement, should_continue_after_improvement, start_exercise_1_danger, start_exercise_2_accountability, start_exercise_3_self, start_exercise_4_future, start_exercise_5_others
from approaches.localization.he_malepatient import heMalePatient

heMalePatientMaleBot = {
    "id": "heMalePatientMaleBot",
    "parent": heMalePatient["id"],
    "chooseAnnoyingReasonWithMediumDistress": [{"role": "explanationText", "content": choose_annoying_reason_with_distress(is_patient_male=True, is_bot_male=True, is_distress_high=False)}],
    "chooseAnnoyingReasonWithHighDistress": [{"role": "explanationText", "content": choose_annoying_reason_with_distress(is_patient_male=True, is_bot_male=True, is_distress_high=True)}],
    "startExercise1Danger": lambda request_context: start_exercise_1_danger(request_context, is_patient_male=True, is_bot_male=True),
    "startExercise2Accountability": lambda request_context: start_exercise_2_accountability(request_context, is_patient_male=True, is_bot_male=True),
    "startExercise3Self": lambda request_context: start_exercise_3_self(request_context, is_patient_male=True, is_bot_male=True),
    "startExercise4Future": lambda request_context: start_exercise_4_future(request_context, is_patient_male=True, is_bot_male=True),
    "startExercise5Others": lambda request_context: start_exercise_5_others(request_context, is_patient_male=True, is_bot_male=True),
    "howMuchDistressAndAdvanceVideo": lambda request_context: how_much_distress_and_advance_video(request_context, is_patient_male=True, is_bot_male=True),
    "exitAfterDistressIncreasedTwice": exit_after_distress_increased_twice(is_bot_male=True),
    "exitAfterImprovement": exit_after_improvement(is_patient_male=True, is_bot_male=True),
    "exitNoClearImprovement": exit_no_clear_improvement(is_patient_male=True, is_bot_male=True),
    "shouldContinueAfterImprovement": should_continue_after_improvement(is_patient_male=True, is_bot_male=True),
    "isConnectedToCurrentAfterNoImprovement": is_connected_to_current_after_no_improvement(is_patient_male=True, is_bot_male=True),
    "isConnectedToCurrentAfterImprovement": is_connected_to_current_after_improvement(is_patient_male=True, is_bot_male=True),
    "exitAfterDistressIncreasedAndFailToConnectToCurrent": exit_after_distress_increased_and_fail_to_connect_to_current(is_patient_male=True, is_bot_male=True),
    "exitAfterDistressIncreasedAndSucceedToConnectToCurrent": exit_after_distress_increased_and_succeed_to_connect_to_current(is_patient_male=True, is_bot_male=True),
    "exitAfterImprovementAndFailToConnectToCurrent": exit_after_improvement_and_fail_to_connect_to_current(is_patient_male=True, is_bot_male=True),
    "exitAfterImprovementAndSucceedToConnectToCurrent": exit_after_improvement_and_succeed_to_connect_to_current(is_patient_male=True, is_bot_male=True),
    "exitAfterNoClearImprovementAndFailToConnectToCurrent":  exit_after_no_clear_improvement_and_fail_to_connect_to_current(is_patient_male=True, is_bot_male=True),
    "exitAfterNoClearImprovementAndSucceedToConnectToCurrent": exit_after_no_clear_improvement_and_succeed_to_connect_to_current(is_patient_male=True, is_bot_male=True),
}