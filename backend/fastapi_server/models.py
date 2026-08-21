from sqlmodel import SQLModel, Field
from datetime import datetime

class Conversation(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_audio: bytes = Field(sa_column_kwargs={"nullable": False})
    assistant_audio: bytes = Field(sa_column_kwargs={"nullable": False})
    transcript: str = Field(nullable=False)
    emotion: str | None = Field(default=None)
