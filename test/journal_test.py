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

    # get entries, should be empty
    def get_entries():
        headers = {}
        res = requests.get(
            url("/journal"),
            headers=with_auth(headers, token),
        )
        got = res.json()
        return got

    entries = get_entries()
    assert len(entries) == 0
    print("getting journal entries, zero expected")

    notFound = "notFound"  # sentinel, do something smarter?

    def get_journal_entry(entry_ID):
        headers = {}
        res = requests.get(
            url(f"/journal/{entry_ID}"),
            headers=with_auth(headers, token),
        )
        if res.status_code == 404:
            return notFound
        else:
            return res.json()

    # get single entry that does not exist
    got = get_journal_entry(0)
    assert got == notFound
    print("getting journal entry that does not exist returns null")

    # add new entry

    def add_entry(entry):
        headers = {}
        res = requests.post(
            url("/journal"),
            headers=with_auth(headers, token),
            json=entry,
        )
        got = res.json()
        assert got.get("entryID") is not None
        return got["entryID"]

    first_entry = {
        "title": "Foo",
        "category": "Bar",
        "content": "hello there",
    }
    first_entry_ID = add_entry(first_entry)
    print(f"add new journal entry: {first_entry_ID}")

    # retrieve journal entry

    got = get_journal_entry(first_entry_ID)
    assert got.get("title") == first_entry["title"]
    assert got.get("category") == first_entry["category"]
    assert got.get("content") == first_entry["content"]
    print("get journal entry")

    def make_update(entry_ID, field, update):
        headers = {}
        res = requests.put(
            url(f"/journal/{entry_ID}"),
            headers=with_auth(headers, token),
            json={field: update},
        )
        got = get_journal_entry(entry_ID)
        assert (
            got.get(field) == update
        ), f"update {field} of entry {entry_ID}, expect: {update}, got: {got.get(field)}"
        print(f"update {field} of entry")

    # make updates
    make_update(first_entry_ID, "title", "Foo2")
    make_update(first_entry_ID, "category", "Bar2")
    make_update(first_entry_ID, "content", "Good Bye")

    # add another entry
    second_entry = {
        "title": "Something",
        "category": "Work",
        "content": "work is okay",
    }

    second_entry_ID = add_entry(second_entry)
    print(f"add second journal entry: {second_entry_ID}")
    got = get_journal_entry(second_entry_ID)
    assert got.get("title") == second_entry["title"]
    assert got.get("category") == second_entry["category"]
    assert got.get("content") == second_entry["content"]

    # get all entries, assert that number is 2
    entries = get_entries()
    assert len(entries) == 2
    print("getting journal entries, 2 expected")

    # delete 1 entry
    headers = {}
    res = requests.delete(
        url(f"/journal/{first_entry_ID}"),
        headers=with_auth(headers, token),
    )
    print("delete first entry")

    got = get_journal_entry(second_entry_ID)
    print("can still get second entry")
    assert got is not None

    got = get_journal_entry(first_entry_ID)
    print("getting journal entry that does not exist returns null")
    assert got is notFound, f"got is {got}"

    # get all entries, assert that number is 1
    entries = get_entries()
    assert len(entries) == 1
    print("getting journal entries, 1 expected")


if __name__ == "__main__":
    main()
