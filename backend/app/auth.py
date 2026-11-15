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


# Hardcoded on purpose: this is a demo, every password is "demo".
USERS = {
    "bauer": User("bauer", "Holzwerk Bauer GmbH", "supplier"),
    "nord": User("nord", "Sägewerk Nord", "supplier"),
    "meier": User("meier", "Baustoffe Meier", "supplier"),
    "nordlicht": User("nordlicht", "Spedition Nordlicht", "logistics"),
    "regnauer": User("regnauer", "Regnauer", "manufacturer"),
    "drk": User("drk", "Rotes Kreuz", "aid"),
}
DEMO_PASSWORD = "demo"

# Stateless signed tokens: the demo resets its data on every start, but a logged-in browser must not be thrown out by it.
_SECRET = os.environ.get("TOKEN_SECRET", "relief-demo-secret").encode()


def _sign(username: str) -> str:
    return hmac.new(_SECRET, username.encode(), hashlib.sha256).hexdigest()[:32]


def _user_from_token(token: str) -> User | None:
    username, _, signature = token.partition(".")
    if username in USERS and hmac.compare_digest(signature, _sign(username)):
        return USERS[username]
    return None


def login(username: str, password: str) -> tuple[str, User]:
    user = USERS.get(username)
    if user is None or password != DEMO_PASSWORD:
        raise HTTPException(401, "Benutzername oder Passwort falsch")
    return f"{username}.{_sign(username)}", user


def require_role(*roles: str):
    def dependency(authorization: str = Header(default="")) -> User:
        user = _user_from_token(authorization.removeprefix("Bearer "))
        if user is None:
            raise HTTPException(401, "Nicht angemeldet")
        if user.role not in roles:
            raise HTTPException(403, "Keine Berechtigung")
        return user

    return Depends(dependency)
