import requests
import shortuuid
import json
import time


def main():
    addr = "http://127.0.0.1:3000"
    url = lambda endpoint: f"{addr}{endpoint}"
    username = f"Alice_{shortuuid.uuid()}"
    password = "12345"
    user_details = {"username": username, "password": password}

    # sign up new user
    res = requests.post(url("/signup"), json=user_details)
    got = res.json()
    assert got.get("success") == True, f"got: {got}"
    print("signing up new user with fresh details succeeds")

    # try signing up again
    res = requests.post(url("/signup"), json=user_details)
    got = res.json()
    assert got.get("error") is not None
    print("signing up new user with same details fails")

    # login user with wrong password
    login_details = {"username": username, "password": password + "wrong"}
    res = requests.post(url("/login"), json=login_details)
    got = res.json()
    assert res.status_code == 401
    assert got.get("error") == "Unauthorized"
    print("logging in user with wrong password fails")

    # login user with correct password
    login_details = {"username": username, "password": password}
    res = requests.post(url("/login"), json=login_details)
    got = res.json()
    token = got.get("token")
    assert token is not None
    print("logging in user with correct password succeeds")

    def with_auth(headers, token):
        headers["authorization"] = f"Bearer {token}"
        return headers

    # referesh token
    headers = {}
    res = requests.post(url("/refresh"), headers=with_auth(headers, token))
    got = res.json()
    old_token = token
    token = got.get("token")
    assert token is not None
    assert old_token != token
    print("refreshing token succeeds")

    # change password
    headers = {}
    old_password = password
    new_password = "abcde"
    password_change = {"old_password": password, "new_password": new_password}
    res = requests.put(
        url("/password"),
        headers=with_auth(headers, token),
        json=password_change,
    )
    password = new_password
    got = res.json()
    assert got.get("success") == True, f"got: {got}"
    print("changing password succeeds")

    # get user details
    headers = {}
    res = requests.get(
        url("/account"),
        headers=with_auth(headers, token),
    )
    got = res.json()
    assert got.get("username") == username
    assert got.get("id") is not None
    print("getting user details succeeds")

    # logout
    headers = {}
    res = requests.post(
        url("/logout"),
        headers=with_auth(headers, token),
    )
    assert res.status_code == 204
    print("logging out succeeds")

    # try getting user details after logging out
    headers = {}
    res = requests.get(
        url("/account"),
        headers=with_auth(headers, token),
    )
    assert res.status_code == 401
    print("getting user details after logging out fails")

    # try getting user details after logging out (using old_token)
    headers = {}
    res = requests.get(
        url("/account"),
        headers=with_auth(headers, old_token),
    )
    assert res.status_code == 401
    print("getting user details after logging out fails (using old token)")

    # log back in
    login_details = {"username": username, "password": password}
    res = requests.post(url("/login"), json=login_details)
    got = res.json()
    token = got.get("token")
    assert token is not None
    print("logging in user with correct password succeeds")

    # delete account
    headers = {}
    res = requests.delete(
        url("/account"),
        headers=with_auth(headers, token),
    )
    got = res.json()
    assert got.get("success") == True
    assert res.status_code == 200
    print("deleting user account succeeds")

    # log in to deleted account
    login_details = {"username": username, "password": password}
    res = requests.post(url("/login"), json=login_details)
    got = res.json()
    assert res.status_code == 401
    assert got.get("error") == "Unauthorized"
    print("attempting to log in to a deleted account fails")


if __name__ == "__main__":
    main()
