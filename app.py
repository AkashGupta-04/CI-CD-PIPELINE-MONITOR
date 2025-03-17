from flask import Flask, redirect, request, session, url_for
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_API = "https://api.github.com/user"

@app.route("/")
def home():
    return f'<a href="{GITHUB_AUTH_URL}?client_id={CLIENT_ID}">Login with GitHub</a>'

@app.route("/callback")
def callback():
    code = request.args.get("code")
    if not code:
        return "Authorization failed", 400

    # Exchange code for access token
    response = requests.post(
        GITHUB_TOKEN_URL,
        headers={"Accept": "application/json"},
        data={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET, "code": code},
    ).json()

    session["access_token"] = response.get("access_token")
    print(response.get("access_token"))
    return redirect(url_for("user_repos"))

@app.route("/profile")
def profile():
    access_token = session.get("access_token")
    if not access_token:
        return redirect(url_for("home"))
    
    user_data = requests.get(
        GITHUB_USER_API, headers={"Authorization": f"token {access_token}"}
    ).json()

    return user_data

@app.route("/user/repos")
def user_repos():
    access_token = session.get("access_token")
    if not access_token:
        return redirect(url_for("home"))

    user_data = requests.get(
        "https://api.github.com/repos/jayeshakhare33/DAA-Lab/commits", headers={"Authorization": f"token {access_token}"}
    ).json()

    return user_data



if __name__ == "__main__":
    app.run(debug=True)