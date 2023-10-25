import types

StateTypes = types.SimpleNamespace()
StateTypes.NoOp = "NoOp"
StateTypes.Input = "Input"
StateTypes.OpenAI = "OpenAI"

FirstState = "FirstState"

StateWaitingForName = "WAITING_FOR_NAME"
StateWaitingForFeeling = "WAITING_FOR_FEELING"
StateEmpathyToFeelings = "EMPATHY_TO_FEELINGS"

States = {}

States[FirstState] = {
    "type": StateTypes.NoOp,
    "nextState": StateWaitingForName,
}

States[StateWaitingForName] = {
    "type": StateTypes.Input,
    "out": "שמי יואב, אני בוט מבוסס בינה מלאכותית שמומחה בעזרה פסיכולוגית מיידית למבוגרים שהיו חשופים לאירועי מלחמה או קרב, בנו אותי חוקרים ומפתחים שמומחים בנושא על סמך ידע מדעי ויכולת טכנולוגית עצומה במיוחד כדי לסייע לך. אמור לי בבקשה מה שמך",
    "nextState": StateWaitingForFeeling,
    "targetInput": "patientName"
}

States[StateWaitingForFeeling] = {
    "type": StateTypes.Input,
    "out": """שלום {patientName}, ברוך הבא לתהליך ייצוב מיידי, שמטרתו להביא לרגיעה ולהקלה במצוקה פסיכולוגית. תהליך זה עזר לאנשים רבים בעולם. התהליך ייקח כ10-20 דקות, במהלכן אקח אותך דרך השלבים החשובים לעבור תהליך הרגעה ועיבוד. בכל שלב אתה יכול לכתוב לי אם יש לך שאלות או דבר מה שתרצה לשתף אותי בו
"אשמח לדעת ממש בקצרה מה מטריד אותך, ?אני רק צריך לשמוע תיאור קצר מאוד. אתה לא חייב לספר לי? """,
    "nextState": StateEmpathyToFeelings,
    "targetInput": "patientFeelings"
}

States[StateEmpathyToFeelings] = {
    "type": StateTypes.OpenAI,
    "systemPrompt": "תן תגובה ממנה הנבדק יבין שהבנת מה הוא אמר, תתייחס באופן אימפטי מאוד בקצרה אל תהיה נועז בתגובה אל תפרש אל תשייך לנבדק רגשות תחושות או מצבים שלא דיווח עליהם, השתדל להיות קשוב ומינימליסטי ולהצמד למה שאמר אבל לא לחזור בצורה טלגרפית",
    "lastUserMessage": "{patientFeelings}"
}