"""
Lambda authorizer: validates the x-api-key header against the value
stored in SSM Parameter Store. Returns a simple boolean response
(enable_simple_responses = true in Terraform).
"""
import os
import boto3

SSM = boto3.client("ssm")
_cached_key: str | None = None


def _get_key() -> str:
    global _cached_key
    if _cached_key is None:
        param_name = os.environ["API_KEY_PARAM"]
        response = SSM.get_parameter(Name=param_name, WithDecryption=True)
        _cached_key = response["Parameter"]["Value"]
    return _cached_key


def handler(event, _context):
    provided = (event.get("headers") or {}).get("x-api-key", "")
    try:
        expected = _get_key()
        authorized = provided == expected
    except Exception:  # noqa: BLE001
        authorized = False
    return {"isAuthorized": authorized}
