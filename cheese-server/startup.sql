CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS devices (
    device_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT UNIQUE,
    device_name TEXT,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS cheeses (
    cheesee INTEGER,
    cheeser INTEGER,
    device INTEGER,
    time INTEGER,
    comment TEXT,
    FOREIGN KEY(cheesee) REFERENCES users(user_id),
    FOREIGN KEY(cheeser) REFERENCES users(user_id),
    FOREIGN KEY(device) REFERENCES devices(device_id)
);
