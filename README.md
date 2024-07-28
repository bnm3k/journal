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

## Tests

To run the user/account management tests:

```
python test/user_test.py
```

To run the journal CRUD tests:

```
python test/journal_test.py
```
