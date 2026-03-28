from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200))
    completed = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

with app.app_context():
    db.create_all()


@app.route("/register", methods=["POST"])
def register():
    data = request.json

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "User already exists"}), 400

    user = User(username=data["username"], password=data["password"])
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User created"})


@app.route("/login", methods=["POST"])
def login():
    data = request.json

    user = User.query.filter_by(
        username=data["username"],
        password=data["password"]
    ).first()

    if user:
        return jsonify({
            "id": user.id,
            "username": user.username
        })

    return jsonify({"error": "Invalid login"}), 401


@app.route("/tasks/<int:user_id>", methods=["GET"])
def get_tasks(user_id):
    tasks = Task.query.filter_by(user_id=user_id).all()

    return jsonify([
        {"id": t.id, "text": t.text, "completed": t.completed, "category": t.category}
        for t in tasks
    ])


@app.route("/tasks", methods=["POST"])
def add_task():
    data = request.json

    task = Task(
        text=data["text"],
        category=data["category"],
        user_id=data["user_id"]
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({"message": "Task added"})


@app.route("/tasks/<int:id>", methods=["PUT"])
def update_task(id):
    task = Task.query.get(id)
    task.completed = not task.completed
    db.session.commit()

    return jsonify({"message": "Updated"})


@app.route("/tasks/<int:id>", methods=["DELETE"])
def delete_task(id):
    task = Task.query.get(id)
    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Deleted"})

if __name__ == "__main__":
    app.run(debug=True)

@app.route("/")
def home():
    return "API is running 🚀"