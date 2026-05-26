"""
Lambda handler: receives a German word + word type, calls AWS Bedrock
(Claude 3 Haiku) and returns a fully structured Vocabulary JSON object
matching the VocabTrainer app data model.

Also handles POST /share and GET /share/{token} for temporary
cross-device vocabulary sharing via S3.
"""
import json
import os
import uuid
import boto3
from botocore.exceptions import ClientError

BEDROCK_CLIENT = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "eu-central-1"))
S3_CLIENT      = boto3.client("s3",              region_name=os.environ.get("AWS_REGION", "eu-central-1"))

MODEL_ID     = os.environ.get("BEDROCK_MODEL_ID", "eu.anthropic.claude-3-haiku-20240307-v1:0")
SHARE_BUCKET = os.environ.get("SHARE_BUCKET", "")
SHARE_PREFIX = "shares/"

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
    { "german": "<example in Präsens (present tense)>",         "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" },
    { "german": "<example in Präteritum (simple past)>",        "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" },
    { "german": "<example in Perfekt (present perfect tense)>", "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" }
  ]"""
    elif word_type == "noun":
        examples_schema = """[
    { "german": "<example sentence using the singular form>",          "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" },
    { "german": "<second example sentence using the singular form>",   "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" },
    { "german": "<example sentence that uses the PLURAL form of the noun>", "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" }
  ]"""
    elif is_auto:
        examples_schema = """[
    { "german": "<example sentence 1>", "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" },
    { "german": "<example sentence 2>", "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" },
    { "german": "<example sentence 3 (if verb: use Perfekt; if noun: use plural form)>", "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" }
  ]"""
    else:
        examples_schema = """[
    { "german": "<example sentence 1>", "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" },
    { "german": "<example sentence 2>", "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" },
    { "german": "<example sentence 3>", "english": "<English translation>", "turkish": "<Turkish translation>", "persian": "<Persian/Farsi translation>" }
  ]"""

    base = f"""Generate a complete vocabulary entry for the German word "{word}" ({type_instruction}).

Important normalization rule before generating the entry:
- Convert the input to its canonical dictionary form based on part of speech.
- Verb: infinitive form (e.g. "muss" -> "müssen", "ging" -> "gehen").
- Noun: singular nominative without article (e.g. "Bücher" -> "Buch").
- Adjective/Adverb: positive/base form (e.g. "besser" -> "gut").
- Use this normalized form as the final vocabulary target.

Return a JSON object with exactly these fields:

{{
    "german": "<the normalized canonical German word, capitalised if noun>",
  "english": "<English translation(s), comma-separated if multiple>",
  "turkish": "<Turkish translation(s), comma-separated if multiple>",
  "persian": "<Persian/Farsi translation(s), comma-separated if multiple>",
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

    base += """,
  "synonyms": ["<German synonym 1>", "<German synonym 2>", "<German synonym 3>"],
  "antonyms": ["<German antonym 1>", "<German antonym 2>"]
}

Rules:
- Return ONLY the raw JSON object. No markdown code blocks, no preamble.
- All string values must be properly escaped JSON strings.
- Normalize the input first and generate the full entry for that normalized form.
- "english", "turkish", and "persian" fields must always be filled with accurate translations.
- "level" must be one of: A1, A2, B1, B2, C1, C2 — choose based on typical learner exposure.
- For verbs, provide exactly 3 example sentences: one in Präsens, one in Präteritum, one in Perfekt.
- For nouns, provide exactly 3 example sentences: at least one must use the plural form of the noun.
- For all other word types, provide exactly 3 natural example sentences.
- For nouns the "german" field should NOT include the article (just the noun), article goes in nounDetails.
- "wordType" must be one of: noun, verb, adjective, adverb, preposition, conjunction, pronoun, other.
- Fill nounDetails / verbDetails / adjectiveDetails according to the detected or given wordType; set the other two to null.
- "synonyms": list up to 5 German synonyms or near-synonyms for the word; use [] if none exist.
- "antonyms": list up to 5 German antonyms for the word; use [] if none exist.
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
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-api-key"
    }


def handle_generate(event, context):
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


# ── Share handlers ────────────────────────────────────────────────────────────

def handle_share_upload(event, context):
    """POST /share — store vocab JSON in S3, return a one-time token."""
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Invalid JSON"})}

    vocabs = body.get("vocabs", [])
    if not isinstance(vocabs, list) or not vocabs:
        return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "vocabs must be a non-empty array"})}

    token = uuid.uuid4().hex  # 32-char hex, no dashes
    key   = f"{SHARE_PREFIX}{token}.json"

    try:
        S3_CLIENT.put_object(
            Bucket=SHARE_BUCKET,
            Key=key,
            Body=json.dumps(vocabs, ensure_ascii=False).encode("utf-8"),
            ContentType="application/json"
        )
    except Exception as exc:
        return {"statusCode": 500, "headers": cors_headers(), "body": json.dumps({"error": str(exc)})}

    return {
        "statusCode": 200,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps({"token": token})
    }


def handle_share_download(event, context):
    """GET /share/{token} — fetch vocab JSON from S3, delete it, return it."""
    path_params = event.get("pathParameters") or {}
    token = (path_params.get("token") or "").strip()
    if not token:
        return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Missing token"})}

    key = f"{SHARE_PREFIX}{token}.json"

    try:
        obj = S3_CLIENT.get_object(Bucket=SHARE_BUCKET, Key=key)
        vocabs = json.loads(obj["Body"].read().decode("utf-8"))
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        if code in ("NoSuchKey", "404"):
            return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found or already used"})}
        return {"statusCode": 500, "headers": cors_headers(), "body": json.dumps({"error": str(exc)})}
    except Exception as exc:
        return {"statusCode": 500, "headers": cors_headers(), "body": json.dumps({"error": str(exc)})}

    # One-time use: delete immediately after retrieval
    try:
        S3_CLIENT.delete_object(Bucket=SHARE_BUCKET, Key=key)
    except Exception:
        pass  # best-effort delete; lifecycle rule is the safety net

    return {
        "statusCode": 200,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(vocabs, ensure_ascii=False)
    }



# ── Sentence analysis ─────────────────────────────────────────────────────────

SENTENCE_SYSTEM_PROMPT = (
    "You are a German language expert and proofreader. When given a German sentence, "
    "you respond ONLY with a single valid JSON object — no markdown, no explanation, just raw JSON."
)


def build_sentence_generation_prompt(options: dict) -> str:
        level = options.get("level", "A2")
        sentence_type = options.get("sentenceType", "any")
        tense = options.get("tense", "any")
        modal_verb = options.get("modalVerb", "optional")
        length = options.get("length", "medium")
        negation = options.get("negation", "optional")
        passive_voice = options.get("passiveVoice", "optional")
        topic = (options.get("topic") or "").strip()

        length_instruction = {
                "short": "4-6 words",
                "medium": "7-11 words",
                "long": "12-18 words"
        }.get(length, "7-11 words")

        topic_line = f'- Topic preference: "{topic}"' if topic else "- Topic preference: choose a common real-life topic"

        return f"""Generate one natural German sentence for learners and return a full analysis JSON.

Constraints:
- CEFR level target: {level}
- Sentence type: {sentence_type} (simple | compound | complex | any)
- Tense target: {tense} (Präsens | Präteritum | Perfekt | Plusquamperfekt | Futur I | Futur II | any)
- Modal verb usage: {modal_verb} (required | forbidden | optional)
- Length target: {length} ({length_instruction})
- Negation usage: {negation} (required | forbidden | optional)
- Passive voice usage: {passive_voice} (required | forbidden | optional)
{topic_line}

Return a JSON object with exactly these fields:
{{
    "german": "<generated German sentence>",
    "english": "<full natural English translation>",
    "turkish": "<full natural Turkish translation>",
    "persian": "<full natural Persian/Farsi translation>",
    "words": [
        {{
            "word": "<German word>",
            "lemma": "<canonical dictionary form: verb infinitive, noun singular (no article), adjective/adverb base form>",
            "type": "<noun | verb | adjective | adverb | other>",
            "english": "<English translation of this single word>",
            "turkish": "<Turkish translation of this word>",
            "persian": "<Persian translation of this word>",
            "note": "<short grammar note>"
        }}
    ],
    "grammar": {{
        "tense": "<Präsens | Präteritum | Perfekt | Plusquamperfekt | Futur I | Futur II>",
        "sentenceType": "<simple | compound | complex>",
        "hasModalVerb": <true | false>,
        "modalVerb": "<modal verb if present, otherwise null>",
        "isNegation": <true | false>,
        "isPassive": <true | false>,
        "clauseType": "<main clause | subordinate clause | relative clause | mixed>",
        "notes": "<one or two concise English notes about grammar and why it matches constraints>"
    }}
}}

Rules:
- Return ONLY raw JSON. No markdown, no explanations.
- Respect all constraints as much as possible while keeping the sentence natural.
- "words" should include meaningful words (verbs, nouns, adjectives, adverbs, pronouns as needed).
- "type" must be exactly one of: noun, verb, adjective, adverb, other.
- Ensure the returned grammar fields reflect the actual generated sentence.
"""

def build_sentence_prompt(sentence: str) -> str:
    return f"""Analyze this German sentence: "{sentence}"

Return a JSON object with exactly these fields:
{{
    "german": "<the fully corrected German sentence (fix spelling, word order, grammar, and punctuation)>",
  "english": "<full natural English translation of the sentence>",
  "turkish": "<full natural Turkish translation>",
  "persian": "<full natural Persian/Farsi translation>",
  "words": [
    {{
      "word": "<German word>",
            "lemma": "<canonical dictionary form: verb infinitive, noun singular (no article), adjective/adverb positive/base form>",
      "type": "<noun | verb | adjective | adverb | other>",
      "english": "<English translation of this single word>",
      "turkish": "<Turkish translation of this word>",
      "persian": "<Persian translation of this word>",
      "note": "<short grammar note, e.g. 'strong verb, hilfsverb: haben' or 'neuter noun, article: das'>"
    }}
  ],
  "grammar": {{
    "tense": "<Präsens | Präteritum | Perfekt | Plusquamperfekt | Futur I | Futur II>",
    "sentenceType": "<simple | compound | complex>",
    "hasModalVerb": <true | false>,
    "modalVerb": "<the modal verb if present, otherwise null>",
    "isNegation": <true | false>,
    "isPassive": <true | false>,
    "clauseType": "<main clause | subordinate clause | relative clause | mixed>",
    "notes": "<one or two sentences explaining the main grammar points of this sentence>"
  }}
}}

Rules:
- Return ONLY raw JSON. No markdown code blocks, no preamble.
- First silently proofread and correct the input sentence.
- Always return the corrected sentence in the "german" field, even if the original input had mistakes.
- Preserve original meaning while correcting; do not paraphrase unless needed for grammatical correctness.
- "words": include all meaningful words — all verbs (including auxiliaries), all nouns, adjectives, adverbs. Skip standalone articles and conjunctions unless they are noteworthy.
- "lemma" is required for every word entry and must be the canonical form.
- For verbs, "lemma" must be the infinitive (e.g. "habe" -> "haben").
- For nouns, "lemma" must be singular nominative without article (e.g. "Bücher" -> "Buch").
- For adjectives/adverbs, "lemma" must be positive/base form (e.g. "besser" -> "gut").
- "type" must be exactly one of: noun, verb, adjective, adverb, other
- "tense": identify the primary tense of the main clause
- "sentenceType": simple = one main clause only; compound = two or more main clauses joined by coordinating conjunction; complex = main clause + at least one subordinate clause
- "hasModalVerb": true if a modal verb (können, müssen, dürfen, wollen, sollen, mögen, möchten) is used
- "isNegation": true if nicht, kein, nie, niemals, niemand, nichts or similar negation is present
- "isPassive": true if Vorgangspassiv (werden + Partizip II) or Zustandspassiv (sein + Partizip II) is used
- "grammar.notes": write in English, be concise but informative
"""


def invoke_bedrock_sentence(sentence: str) -> dict:
    prompt = build_sentence_prompt(sentence)
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "system": SENTENCE_SYSTEM_PROMPT,
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
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def invoke_bedrock_generate_sentence(options: dict) -> dict:
    prompt = build_sentence_generation_prompt(options)
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "system": SENTENCE_SYSTEM_PROMPT,
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
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def matches_generation_constraints(generated: dict, options: dict) -> bool:
    grammar = generated.get("grammar") or {}
    sentence = (generated.get("german") or "").strip()
    if not sentence:
        return False

    sentence_type = (options.get("sentenceType") or "any").strip().lower()
    if sentence_type != "any" and (grammar.get("sentenceType") or "").strip().lower() != sentence_type:
        return False

    tense = (options.get("tense") or "any").strip().lower()
    if tense != "any" and (grammar.get("tense") or "").strip().lower() != tense:
        return False

    modal_verb = (options.get("modalVerb") or "optional").strip().lower()
    has_modal = bool(grammar.get("hasModalVerb"))
    if modal_verb == "required" and not has_modal:
        return False
    if modal_verb == "forbidden" and has_modal:
        return False

    negation = (options.get("negation") or "optional").strip().lower()
    has_negation = bool(grammar.get("isNegation"))
    if negation == "required" and not has_negation:
        return False
    if negation == "forbidden" and has_negation:
        return False

    passive = (options.get("passiveVoice") or "optional").strip().lower()
    has_passive = bool(grammar.get("isPassive"))
    if passive == "required" and not has_passive:
        return False
    if passive == "forbidden" and has_passive:
        return False

    length = (options.get("length") or "medium").strip().lower()
    word_count = len([w for w in sentence.split() if w.strip()])
    if length == "short" and not (4 <= word_count <= 6):
        return False
    if length == "medium" and not (7 <= word_count <= 11):
        return False
    if length == "long" and not (12 <= word_count <= 18):
        return False

    return True


def handle_analyze_sentence(event, context):
    """POST /analyze-sentence — analyze a German sentence with AI."""
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Invalid JSON body"})}

    sentence = (body.get("sentence") or "").strip()
    if not sentence:
        return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Missing required field: sentence"})}

    try:
        analysis = invoke_bedrock_sentence(sentence)
    except json.JSONDecodeError as exc:
        return {"statusCode": 502, "headers": cors_headers(), "body": json.dumps({"error": f"Bedrock returned non-JSON response: {exc}"})}
    except Exception as exc:
        return {"statusCode": 502, "headers": cors_headers(), "body": json.dumps({"error": str(exc)})}

    return {
        "statusCode": 200,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(analysis, ensure_ascii=False)
    }


def handle_generate_sentence(event, context):
    """POST /generate-sentence — generate a random constrained sentence with analysis."""
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Invalid JSON body"})}

    options = body or {}
    generated = None
    matched = False
    last_error = None

    for _ in range(3):
        try:
            candidate = invoke_bedrock_generate_sentence(options)
        except json.JSONDecodeError as exc:
            last_error = f"Bedrock returned non-JSON response: {exc}"
            continue
        except Exception as exc:
            last_error = str(exc)
            continue

        generated = candidate
        if matches_generation_constraints(candidate, options):
            matched = True
            break

    if generated is None:
        return {"statusCode": 502, "headers": cors_headers(), "body": json.dumps({"error": last_error or "Failed to generate sentence"})}

    if not matched:
        return {
            "statusCode": 422,
            "headers": {**cors_headers(), "Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "error": "CONSTRAINTS_NOT_MET",
                    "message": "Could not generate a sentence that satisfies all constraints. Please try again or relax one option.",
                },
                ensure_ascii=False,
            ),
        }

    return {
        "statusCode": 200,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(generated, ensure_ascii=False)
    }


# ── Main router ───────────────────────────────────────────────────────────────

def handler(event, context):
    # Handle CORS pre-flight
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    route = event.get("routeKey", "")

    if route == "POST /generate":
        return handle_generate(event, context)
    if route == "POST /share":
        return handle_share_upload(event, context)
    if route == "GET /share/{token}":
        return handle_share_download(event, context)
    if route == "POST /analyze-sentence":
        return handle_analyze_sentence(event, context)
    if route == "POST /generate-sentence":
        return handle_generate_sentence(event, context)

    return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}
