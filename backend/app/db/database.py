# Database session and base configuration using SQLAlchemy

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# If using SQLite, check_same_thread=False is needed for multi-threaded requests
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for API routes to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
