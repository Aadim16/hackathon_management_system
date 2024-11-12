from app import app, db, User, Team, Message
from datetime import datetime

def init_database():
    with app.app_context():
        # Drop all existing tables
        db.drop_all()
        
        # Create all tables with the new schema
        db.create_all()
        
        print("Database initialized successfully!")

if __name__ == "__main__":
    init_database()