import hashlib
import hmac
import os
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException


@dataclass(frozen=True)
class User:
    username: str
    display_name: str
    role: str  # supplier | logistics | manufacturer | aid


# Demo accounts: every password is "demo".
USERS = {u.username: u for u in (
    User("bauer", "Holzwerk Bauer GmbH", "supplier"),
    User("nord", "Sägewerk Nord", "supplier"),
    User("meier", "Baustoffe Meier", "supplier"),
    User("nordlicht", "Spedition Nordlicht", "logistics"),
    User("regnauer", "Regnauer", "manufacturer"),
    User("drk", "Rotes Kreuz", "aid"),
)}
DEMO_PASSWORD = "demo"

# Stateless tokens, so the data reset on startup does not log browsers out.
_SECRET = os.environ.get("TOKEN_SECRET", "relief-demo-secret").encode()


def _sign(username: str) -> str:
    return hmac.new(_SECRET, username.encode(), hashlib.sha256).hexdigest()[:32]


def login(username: str, password: str) -> tuple[str, User]:
    user = USERS.get(username)
    if user is None or password != DEMO_PASSWORD:
        raise HTTPException(401, "Benutzername oder Passwort falsch")
    return f"{username}.{_sign(username)}", user


def require_role(*roles: str):
    def dependency(authorization: str = Header(default="")) -> User:
        username, _, signature = authorization.removeprefix("Bearer ").partition(".")
        if username not in USERS or not hmac.compare_digest(signature, _sign(username)):
            raise HTTPException(401, "Nicht angemeldet")
        if USERS[username].role not in roles:
            raise HTTPException(403, "Keine Berechtigung")
        return USERS[username]

    return Depends(dependency)
