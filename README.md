# Journal App API

Implements a REST API for a journal APP

## Run

At the project root, run:

```
docker-compose up
```

This starts two containers, one for the REST API and one for the database
(Postgres). From there, you can interact the API via `localhost:3000`.

To view the documentation:

```
localhost:3000/docs
```

The docs browser also provides a means for interacting with the API.

## Interacting with the API

The API is REST-based. Any HTTP client can be used to interact with the API. In
the following examples, we will use Python and the
[requests](https://pypi.org/project/requests/) library.

First import the following library, and set up the helper function:

```python
import requests

endpoint = lambda r: f"http://localhost:3000/{r}"
```

### User Account Management

Signing up a user:

```python
user_details = {"username": username, "password": password}
res = requests.post(endpoint("/signup"), json=user_details).json()
print(res)
# {'success': True}
```

Logging in a user. This authenticates the user and returns a JWT token that
should be used for all authorized endpoints:

```python
res = requests.post(endpoint("/login"), json=login_details).json()
token = res["token"]
print(res)
# {'token': 
#  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMiLCJqdGkiOiIxNzIyMjY5NDMzNDIzIiwiaWF0IjoxNzIyMjY5NDMzfQ.pZXfpeGUL22xWsyLjpOG-_UiWvTyAQipVE3SiPwnt88'
# }
```

Getting the user's account details:

```python
res = requests.get(
    endpoint("/account"),
    headers={"Authorization": f"Bearer {token}"},
).json()
print(res)
# {'username': 'Alice', 'id': 1}
```

Refreshing the JWT token:

```python
old_token = token
res = requests.post(
    endpoint("/refresh_token"), headers={"Authorization": f"Bearer {token}"}
).json()
token = res["token"]
assert old_token != token
```

Logging out a user:

```python
res = requests.post(
    endpoint("/logout"),
    headers={"Authorization": f"Bearer {token}"},
)
assert res.status_code == 204
```

Updating the username (after logging back in):

```python
new_username = f"Bob"
username_change = {"username": new_username}
res = requests.put(
    endpoint("/username"),
    headers={"Authorization": f"Bearer {token}"},
    json={"username": new_username},
).json()
print(res)
# {'success': True}
```

Updating the password:

```python
new_password = "you shall not pass"
res = requests.put(
    endpoint("/password"),
    headers={"Authorization": f"Bearer {token}"},
    json={"old_password": password, "new_password": new_password},
).json()
print(res)
# {'success': True}
```

Deleting a user's account (also deletes their auth and journal entries):

```python
res = requests.delete(
    endpoint("/account"),
    headers={"Authorization": f"Bearer {token}"},
).json()
print(res)
# {'success': True}
```

### Journal Entry Management

Add a new entry (title, content, category). Date is assigned by the databases
(on insertion):

```python
journal_entry = {
    "title": "foo",
    "category": "bar",
    "content": "hello there",
}
res = requests.post(
    endpoint("/journal"),
    headers={"Authorization": f"Bearer {token}"},
    json=journal_entry,
).json()
print(res)
# {'entryID': 1}
```

Retrieve a journal entry:

```python
entry_ID = 1
res = requests.get(
    endpoint(f"/journal/{entry_ID}"),
    headers={"Authorization": f"Bearer {token}"},
)
if res.status_code != 404:
    print(res.json())
# {'title': 'foo', 'category': 'bar', 'content': 'hello there'}
```

Edit an entry (update the category):

```python
res = requests.put(
    endpoint(f"/journal/{entry_ID}"),
    headers={"Authorization": f"Bearer {token}"},
    json={"category": "Baz"},
)
assert res.status_code == 204
```

Delete an entry:

```python
res = requests.delete(
    endpoint(f"/journal/{entry_ID}"),
    headers={"Authorization": f"Bearer {token}"},
)
assert res.status_code == 204
```

Listing all journal entries:

```python
entries = requests.get(
    endpoint("/journal"),
    headers={"Authorization": f"Bearer {token}"},
).json()
for entry in entries:
    print(entry["title"], entry["category"])
# foo bar
# foo2 bar2
```

## Tests

To run the user/account management tests:

```
python test/user_test.py
```

To run the journal CRUD tests:

```
python test/journal_test.py
```

## Miscellaneous Notes

- Journal entries use UUIDs as their primary keys rather than serial since they
  are exposed to API users. User IDs use serial (probably should change to
  bigserial) since they are not exposed to users. Reason:
  [Why Auto Increment Is A Terrible Idea](https://www.clever-cloud.com/blog/engineering/2015/05/20/why-auto-increment-is-a-terrible-idea/)
