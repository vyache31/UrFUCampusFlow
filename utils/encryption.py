from cryptography.fernet import Fernet
from config import settings


cipher = Fernet(settings.TOKEN_ENCRYPTION_KEY.encode())


def encrypt_token(token: str) -> str:
    return cipher.encrypt(token.encode()).decode()


def decrypt_token(token: str) -> str:
    return cipher.decrypt(token.encode()).decode()