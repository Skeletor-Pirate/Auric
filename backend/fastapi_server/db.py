from sqlmodel import SQLModel, create_engine, Session
import os

# SQLite database file in the same directory
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./conversations.db")
engine = create_engine(DATABASE_URL, echo=False)

def get_session() -> Session:
    with Session(engine) as session:
        yield session
