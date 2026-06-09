"""Hilfsfunktionen für lokale Textvergleiche und Hashes."""
import difflib
import hashlib


def normalize_text(text: str) -> str:
    return " ".join((text or "").split()).strip().lower()


def text_hash(text: str) -> str:
    return hashlib.sha256(normalize_text(text).encode("utf-8")).hexdigest()


def create_text_diff(old_text: str, new_text: str) -> str:
    if old_text == new_text:
        return "Keine Textänderung erkannt."
    diff = difflib.unified_diff(
        (old_text or "").splitlines(),
        (new_text or "").splitlines(),
        fromfile="alter_text",
        tofile="neuer_text",
        lineterm="",
    )
    return "\n".join(diff)
