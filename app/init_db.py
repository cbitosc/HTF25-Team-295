# Initialize the database
from app.database import engine, Base
from app import models

# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_db()

