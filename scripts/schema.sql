begin;

create table users(
    id serial primary key,
    username text not null unique
);


create table auth(
    user_id int not null,
    hash text not null,
    salt text not null,
    constraint fk_auth_user_id foreign key (user_id)
        references users(id)
        on delete cascade
);

create table journal(
    id serial,
    user_id int not null,
    created_at timestamptz default now(),
    title text not null,
    category text not null,
    content text not null,
    constraint fk_journal_user_id foreign key (user_id)
        references users(id)
        on delete cascade
);


commit;
