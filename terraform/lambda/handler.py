"""
Lambda handler: receives a German word + word type, calls AWS Bedrock
(Claude 3 Haiku) and returns a fully structured Vocabulary JSON object
matching the VocabTrainer app data model.
"""
import json
import os
import boto3

BEDROCK_CLIENT = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "eu-central-1"))
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "eu.anthropic.claude-3-haiku-20240307-v1:0")

WORD_TYPES = {"noun", "verb", "adjective", "adverb", "preposition", "conjunction", "pronoun", "other"}
CEFR_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}

SYSTEM_PROMPT = """You are a German language expert. When given a German word,
you respond ONLY with a single valid JSON object — no markdown, no explanation, just raw JSON.

IMPORTANT: First check if the input is a real, correctly-spelled German word.
- If the input is NOT German (e.g. English, French, etc.), return ONLY: {"_isValidGerman": false, "_correction": null}
- If the input is a misspelling of a German word, return ONLY: {"_isValidGerman": false, "_correction": "<corrected German word>"}
- If the input IS a valid German word, return the full vocabulary JSON described in the user message."""

def build_user_prompt(word: str, word_type: str | None) -> str:
    if word_type:
        type_instruction = f'word type: {word_type}'
        type_field_note = f'"wordType": "{word_type}"'
    else:
        type_instruction = 'word type: auto-detect from the word itself'
        type_field_note = '"wordType": "<detect the correct type: noun | verb | adjective | adverb | preposition | conjunction | pronoun | other>"'

    is_verb = word_type == "verb"
    is_auto = word_type is None

    if is_verb:
        examples_schema = """[
    { "german": "<example in Präsens (present tense)>",         "english": "<translation>" },
    { "german": "<example in Präteritum (simple past)>",        "english": "<translation>" },
    { "german": "<example in Perfekt (present perfect tense)>", "english": "<translation>" }
  ]"""
    elif word_type == "noun":
        examples_schema = """[
    { "german": "<example sentence using the singular form>",          "english": "<translation>" },
    { "german": "<second example sentence using the singular form>",   "english": "<translation>" },
    { "german": "<example sentence that uses the PLURAL form of the noun>", "english": "<translation>" }
  ]"""
    elif is_auto:
        examples_schema = """[
    { "german": "<example sentence 1>", "english": "<translation>" },
    { "german": "<example sentence 2>", "english": "<translation>" },
    { "german": "<example sentence 3 (if verb: use Perfekt; if noun: use plural form)>", "english": "<translation>" }
  ]"""
    else:
        examples_schema = """[
    { "german": "<example sentence 1>", "english": "<translation>" },
    { "german": "<example sentence 2>", "english": "<translation>" },
    { "german": "<example sentence 3>", "english": "<translation>" }
  ]"""

    base = f"""Generate a complete vocabulary entry for the German word "{word}" ({type_instruction}).

Return a JSON object with exactly these fields:

{{
  "german": "<the German word, capitalised if noun>",
  "english": "<English translation(s), comma-separated if multiple>",
  {type_field_note},
  "level": "<CEFR level: A1 | A2 | B1 | B2 | C1 | C2>",
  "description": "<optional short grammar note or usage tip, or null>",
  "examples": {examples_schema}"""

    if word_type == "noun":
        base += """,
  "nounDetails": {
    "article": "<der | die | das>",
    "plural": "<plural form>",
    "deklinationBestimmt": {
      "nominative": "<e.g. der Hund>",
      "akkusativ":  "<e.g. den Hund>",
      "genitiv":    "<e.g. des Hundes>",
      "dativ":      "<e.g. dem Hund>"
    },
    "deklinationUnbestimmt": {
      "nominative": "<e.g. ein Hund>",
      "akkusativ":  "<e.g. einen Hund>",
      "genitiv":    "<e.g. eines Hundes>",
      "dativ":      "<e.g. einem Hund>"
    }
  },
  "verbDetails": null,
  "adjectiveDetails": null"""

    elif word_type == "verb":
        base += """,
  "nounDetails": null,
  "verbDetails": {
    "isSeparable": <true | false>,
    "isRegular": <true | false>,
    "hilfsverb": "<haben | sein>",
    "present": {
      "ich": "<form>", "du": "<form>", "erSieEs": "<form>",
      "wir": "<form>", "ihr": "<form>", "sie": "<form>"
    },
    "simplePast": {
      "ich": "<form>", "du": "<form>", "erSieEs": "<form>",
      "wir": "<form>", "ihr": "<form>", "sie": "<form>"
    },
    "pastPerfect": {
      "ich": "<form>", "du": "<form>", "erSieEs": "<form>",
      "wir": "<form>", "ihr": "<form>", "sie": "<form>"
    },
    "future": {
      "ich": "<form>", "du": "<form>", "erSieEs": "<form>",
      "wir": "<form>", "ihr": "<form>", "sie": "<form>"
    },
    "imperative": {
      "du": "<form>", "wir": "<form>", "ihr": "<form>", "Sie": "<form>"
    }
  },
  "adjectiveDetails": null"""

    elif word_type == "adjective":
        base += """,
  "nounDetails": null,
  "verbDetails": null,
  "adjectiveDetails": {
    "komparativ": "<comparative form>",
    "superlativ": "<superlative form, e.g. am schnellsten>",
    "deklinationMaskulin": {
      "nominative": "<form>", "akkusativ": "<form>",
      "genitiv": "<form>",   "dativ": "<form>"
    },
    "deklinationFeminin": {
      "nominative": "<form>", "akkusativ": "<form>",
      "genitiv": "<form>",   "dativ": "<form>"
    },
    "deklinationNeutral": {
      "nominative": "<form>", "akkusativ": "<form>",
      "genitiv": "<form>",   "dativ": "<form>"
    },
    "deklinationPlurar": {
      "nominative": "<form>", "akkusativ": "<form>",
      "genitiv": "<form>",   "dativ": "<form>"
    }
  }"""

    else:
        if word_type is None:
            # Auto-detect: ask Claude to fill in the correct details block
            base += """,
  "nounDetails": <if the word is a noun, fill in full noun object as shown below; otherwise use null.
    Noun object shape: {"article": "der|die|das", "plural": "<form>",
    "deklinationBestimmt": {"nominative":"<>","akkusativ":"<>","genitiv":"<>","dativ":"<>"},
    "deklinationUnbestimmt": {"nominative":"<>","akkusativ":"<>","genitiv":"<>","dativ":"<>"}}>,
  "verbDetails": <if the word is a verb, fill in full conjugation object; otherwise null.
    Verb object shape: {"isSeparable": true|false, "isRegular": true|false, "hilfsverb": "haben|sein",
    "present": {"ich":"<>","du":"<>","erSieEs":"<>","wir":"<>","ihr":"<>","sie":"<>"},
    "simplePast": {"ich":"<>","du":"<>","erSieEs":"<>","wir":"<>","ihr":"<>","sie":"<>"},
    "pastPerfect": {"ich":"<>","du":"<>","erSieEs":"<>","wir":"<>","ihr":"<>","sie":"<>"},
    "future": {"ich":"<>","du":"<>","erSieEs":"<>","wir":"<>","ihr":"<>","sie":"<>"},
    "imperative": {"du":"<>","wir":"<>","ihr":"<>","Sie":"<>"}}>,
  "adjectiveDetails": <if the word is an adjective, fill in full declension object; otherwise null.
    Adjective object shape: {"komparativ":"<>","superlativ":"<>",
    "deklinationMaskulin":{"nominative":"<>","akkusativ":"<>","genitiv":"<>","dativ":"<>"},
    "deklinationFeminin":{"nominative":"<>","akkusativ":"<>","genitiv":"<>","dativ":"<>"},
    "deklinationNeutral":{"nominative":"<>","akkusativ":"<>","genitiv":"<>","dativ":"<>"},
    "deklinationPlurar":{"nominative":"<>","akkusativ":"<>","genitiv":"<>","dativ":"<>"}}>"""
        else:
            base += """,
  "nounDetails": null,
  "verbDetails": null,
  "adjectiveDetails": null"""

    base += """
}

Rules:
- Return ONLY the raw JSON object. No markdown code blocks, no preamble.
- All string values must be properly escaped JSON strings.
- "level" must be one of: A1, A2, B1, B2, C1, C2 — choose based on typical learner exposure.
- For verbs, provide exactly 3 example sentences: one in Präsens, one in Präteritum, one in Perfekt.
- For nouns, provide exactly 3 example sentences: at least one must use the plural form of the noun.
- For all other word types, provide exactly 3 natural example sentences.
- For nouns the "german" field should NOT include the article (just the noun), article goes in nounDetails.
- "wordType" must be one of: noun, verb, adjective, adverb, preposition, conjunction, pronoun, other.
- Fill nounDetails / verbDetails / adjectiveDetails according to the detected or given wordType; set the other two to null.
"""
    return base


def invoke_bedrock(word: str, word_type: str) -> dict:
    prompt = build_user_prompt(word, word_type)
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": prompt}]
    }
    response = BEDROCK_CLIENT.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body)
    )
    result = json.loads(response["body"].read())
    text = result["content"][0]["text"].strip()
    # Strip markdown code fences if the model adds them despite instructions
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def cors_headers() -> dict:
    return {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-api-key"
    }


def handler(event, context):
    # Handle CORS pre-flight
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"error": "Invalid JSON body"})
        }

    word = (body.get("word") or "").strip()
    raw_type = (body.get("wordType") or "").strip().lower()
    word_type = raw_type if raw_type in WORD_TYPES else None  # None → auto-detect

    if not word:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"error": "Missing required field: word"})
        }

    try:
        vocab = invoke_bedrock(word, word_type)
    except json.JSONDecodeError as exc:
        return {
            "statusCode": 502,
            "headers": cors_headers(),
            "body": json.dumps({"error": f"Bedrock returned non-JSON response: {exc}"})
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "statusCode": 502,
            "headers": cors_headers(),
            "body": json.dumps({"error": str(exc)})
        }

    # Check if Claude returned an early validation error (minimal JSON)
    is_valid_german = vocab.pop("_isValidGerman", True)
    correction = vocab.pop("_correction", None)

    if not is_valid_german:
        error_body = {"error": "WORD_MISSPELLED", "correction": correction} if correction else {"error": "NOT_GERMAN_WORD"}
        return {
            "statusCode": 422,
            "headers": cors_headers(),
            "body": json.dumps(error_body)
        }

    # If Claude returned only the validation fields and nothing else, treat as invalid
    if not vocab.get("german"):
        return {
            "statusCode": 422,
            "headers": cors_headers(),
            "body": json.dumps({"error": "NOT_GERMAN_WORD"})
        }

    # Validate level field falls within known CEFR values
    if vocab.get("level") not in CEFR_LEVELS:
        vocab["level"] = "B1"  # safe default

    return {
        "statusCode": 200,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(vocab, ensure_ascii=False)
    }
