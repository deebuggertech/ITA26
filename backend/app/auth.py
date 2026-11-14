import secrets
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

_tokens: dict[str, User] = {}


def login(username: str, password: str) -> tuple[str, User]:
    user = USERS.get(username)
    if user is None or password != DEMO_PASSWORD:
        raise HTTPException(401, "Benutzername oder Passwort falsch")
    token = secrets.token_hex(16)
    _tokens[token] = user
    return token, user


def require_role(*roles: str):
    def dependency(authorization: str = Header(default="")) -> User:
        user = _tokens.get(authorization.removeprefix("Bearer "))
        if user is None:
            raise HTTPException(401, "Nicht angemeldet")
        if user.role not in roles:
            raise HTTPException(403, "Keine Berechtigung")
        return user

    return Depends(dependency)
