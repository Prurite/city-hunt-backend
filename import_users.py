# Usage: put a users.csv file, with colummns: uid, password, type
# along with this script in the same directory and run it.
# type can be "admin" or "user"

import os, csv, json
from pymango import MongoClient

def main():
    with open("config.json") as f:
        db_url = json.load(f)["db_url"]
    client = MongoClient(db_url)
    db = client.cityhunt
    users = db.users
    with open("users.csv") as f:
        reader = csv.DictReader(f)
        for row in reader:
            users.insert_one(row)
    print("Users imported successfully")
