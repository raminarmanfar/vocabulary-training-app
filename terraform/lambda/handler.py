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

SYSTEM_PROMPT = """You are a German language expert. When given a German word and its word type,
you respond ONLY with a single valid JSON object — no markdown, no explanation, just raw JSON.
The JSON must conform exactly to the schema described in the user message."""

def build_user_prompt(word: str, word_type: str) -> str:
    base = f"""Generate a complete vocabulary entry for the German word "{word}" (word type: {word_type}).

Return a JSON object with exactly these fields:

{{
  "german": "<the German word, capitalised if noun>",
  "english": "<English translation(s), comma-separated if multiple>",
  "wordType": "<one of: noun | verb | adjective | adverb | preposition | conjunction | pronoun | other>",
  "level": "<CEFR level: A1 | A2 | B1 | B2 | C1 | C2>",
  "description": "<optional short grammar note or usage tip, or null>",
  "examples": [
    {{ "german": "<example sentence>", "english": "<translation>" }},
    {{ "german": "<second example>",  "english": "<translation>" }}
  ]"""

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
- Provide exactly 2 natural example sentences.
- For nouns the "german" field should NOT include the article (just the noun), article goes in nounDetails.
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
    word_type = (body.get("wordType") or "").strip().lower()

    if not word:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"error": "Missing required field: word"})
        }

    if word_type not in WORD_TYPES:
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({
                "error": f"Invalid wordType '{word_type}'. Must be one of: {', '.join(sorted(WORD_TYPES))}"
            })
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

    # Validate level field falls within known CEFR values
    if vocab.get("level") not in CEFR_LEVELS:
        vocab["level"] = "B1"  # safe default

    return {
        "statusCode": 200,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(vocab, ensure_ascii=False)
    }
