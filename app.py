from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hackathon.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=True)

class Team(db.Model):
    __tablename__ = 'teams'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    topic = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), default='General')
    status = db.Column(db.String(20), default='active')
    score = db.Column(db.Float, default=0.0)

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/chat')
def chat_page():
    return render_template('chat.html')

@app.route('/admin')
@jwt_required()
def admin_page():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if user.role != 'admin':
        return jsonify({"success": False, "message": "Access denied"}), 403
    return render_template('admin.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        if not all(k in data for k in ['email', 'password', 'name', 'role']):
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({"success": False, "message": "Email already registered"}), 400

        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        new_user = User(
            email=data['email'],
            password=hashed_password,
            name=data['name'],
            role=data['role']
        )

        if data['role'] == 'student' and 'teamName' in data and 'teamTopic' in data:
            existing_team = Team.query.filter_by(name=data['teamName']).first()
            if existing_team:
                return jsonify({"success": False, "message": "Team name already exists"}), 400
            
            new_team = Team(
                name=data['teamName'],
                topic=data['teamTopic'],
                category=data.get('category', 'General')
            )
            db.session.add(new_team)
            db.session.flush()  # Get the team ID
            new_user.team_id = new_team.id

        db.session.add(new_user)
        db.session.commit()
        return jsonify({"success": True, "message": "Registration successful"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        user = User.query.filter_by(email=data['email']).first()
        if user and bcrypt.check_password_hash(user.password, data['password']):
            access_token = create_access_token(identity=user.id)
            return jsonify({
                "success": True,
                "access_token": access_token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": user.role
                },
                "redirect": "/admin" if user.role == "admin" else "/chat"
            }), 200
        return jsonify({"success": False, "message": "Invalid email or password"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/messages', methods=['GET', 'POST'])
@jwt_required()
def messages():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    
    if request.method == 'GET':
        try:
            team = Team.query.filter_by(id=user.team_id).first() if user.role == 'student' else None
            team_id = team.id if team else None
            
            if user.role == 'student':
                messages = Message.query.filter_by(team_id=team_id).all()
            else:
                messages = Message.query.all()
            
            return jsonify([{
                'id': msg.id,
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat(),
                'username': db.session.get(User, msg.user_id).name,
                'role': db.session.get(User, msg.user_id).role,
                'team': db.session.get(Team, msg.team_id).name
            } for msg in messages]), 200
        except Exception as e:
            return jsonify({"success": False, "message": f"An error occurred: {str(e)}"}), 500
    
    elif request.method == 'POST':
        try:
            content = request.json['content']
            team = Team.query.filter_by(id=user.team_id).first() if user.role == 'student' else None
            team_id = team.id if team else Team.query.first().id
            
            new_message = Message(content=content, user_id=user_id, team_id=team_id)
            db.session.add(new_message)
            db.session.commit()
            
            return jsonify({"success": True, "message": "Message sent successfully"}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": f"An error occurred: {str(e)}"}), 500

@app.route('/api/teams', methods=['GET', 'PUT'])
@jwt_required()
def teams():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    
    if request.method == 'GET':
        try:
            teams = Team.query.all()
            return jsonify([{
                'id': team.id,
                'name': team.name,
                'topic': team.topic,
                'category': team.category,
                'status': team.status,
                'score': team.score
            } for team in teams]), 200
        except Exception as e:
            return jsonify({"success": False, "message": f"An error occurred: {str(e)}"}), 500
    
    elif request.method == 'PUT' and user.role in ['admin', 'evaluator']:
        try:
            data = request.json
            team = db.session.get(Team, data['team_id'])
            
            if not team:
                return jsonify({"success": False, "message": "Team not found"}), 404
            
            if user.role == 'admin' and 'status' in data:
                team.status = data['status']
            
            if user.role == 'evaluator' and 'score' in data:
                team.score = data['score']
            
            db.session.commit()
            return jsonify({"success": True, "message": "Team updated successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": f"An error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)