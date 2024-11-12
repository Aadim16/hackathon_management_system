from database import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'team_id': self.team_id
        }

class Team(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='active')  # 'active' or 'banned'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    members = db.relationship('User', backref='team', lazy=True)
    evaluations = db.relationship('Evaluation', backref='team', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'members': [member.to_dict() for member in self.members],
            'evaluations': [eval.to_dict() for eval in self.evaluations]
        }

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_announcement = db.Column(db.Boolean, default=False)

    # Relationship
    sender = db.relationship('User', backref='messages', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'sender': self.sender.to_dict(),
            'content': self.content,
            'timestamp': self.timestamp.isoformat(),
            'is_announcement': self.is_announcement
        }

class Evaluation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=False)
    evaluator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    marks = db.Column(db.Float, nullable=False)
    comments = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    evaluator = db.relationship('User', backref='evaluations', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'team_id': self.team_id,
            'evaluator': self.evaluator.to_dict(),
            'marks': self.marks,
            'comments': self.comments,
            'timestamp': self.timestamp.isoformat()
        }